import { env } from '../../config/env.js';
import pLimit from 'p-limit';
import { http, sleep } from '../../utils/http.js';
import { searchOsm } from './osm.js';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'places.primaryTypeDisplayName',
  'places.types',
  'places.businessStatus',
  'places.googleMapsUri',
  'nextPageToken',
].join(',');

async function placesTextSearch(textQuery, limit) {
  const results = [];
  let pageToken;
  do {
    const { data } = await http.post(
      'https://places.googleapis.com/v1/places:searchText',
      { textQuery, pageSize: 20, ...(pageToken ? { pageToken } : {}) },
      {
        headers: { 'X-Goog-Api-Key': env.googleMapsApiKey, 'X-Goog-FieldMask': FIELD_MASK },
        timeout: 20000,
      },
    );
    for (const p of data.places || []) {
      if (p.businessStatus === 'CLOSED_PERMANENTLY') continue;
      results.push({
        name: p.displayName?.text,
        category: p.primaryTypeDisplayName?.text,
        address: p.formattedAddress,
        phone: p.internationalPhoneNumber || p.nationalPhoneNumber,
        website: p.websiteUri,
        rating: p.rating,
        reviewsCount: p.userRatingCount,
        lat: p.location?.latitude,
        lng: p.location?.longitude,
        mapsUrl: p.googleMapsUri,
        source: 'google_maps',
      });
    }
    pageToken = data.nextPageToken;
    if (pageToken) await sleep(1500);
  } while (pageToken && results.length < limit);
  return results;
}

async function serpApiMaps(textQuery, limit) {
  const results = [];
  for (let start = 0; start < Math.min(limit, 120); start += 20) {
    const { data } = await http.get('https://serpapi.com/search.json', {
      params: { engine: 'google_maps', q: textQuery, type: 'search', start, api_key: env.serpApiKey, hl: 'en' },
      timeout: 30000,
    });
    const page = data.local_results || [];
    for (const p of page) {
      results.push({
        name: p.title,
        category: p.type,
        address: p.address,
        phone: p.phone,
        website: p.website,
        rating: p.rating,
        reviewsCount: p.reviews,
        lat: p.gps_coordinates?.latitude,
        lng: p.gps_coordinates?.longitude,
        mapsUrl: p.place_id ? `https://www.google.com/maps/place/?q=place_id:${p.place_id}` : undefined,
        source: 'google_maps',
      });
    }
    if (page.length < 20) break;
  }
  return results;
}

const PROVIDER_SEARCH = {
  google_places: (textQuery, _plan, limit) => placesTextSearch(textQuery, limit),
  serpapi_google_maps: (textQuery, _plan, limit) => serpApiMaps(textQuery, limit),
  openstreetmap: (_textQuery, plan, limit, log) => searchOsm(plan, limit, log),
};

export function mapsProviders() {
  const list = [env.googleMapsApiKey && 'google_places', env.serpApiKey && 'serpapi_google_maps'].filter(Boolean);
  return list.length ? list : ['openstreetmap'];
}

export const mapsProvider = () => mapsProviders()[0];

const errorText = (err) => err.response?.data?.error?.message || err.response?.data?.error || err.message;

// Every configured provider runs at the same time; the pipeline's dedupe merges the overlapping places.
export async function searchOneLocation(plan, limit, log, { providers = mapsProviders(), search = PROVIDER_SEARCH } = {}) {
  const textQuery = [plan.businessType, plan.location && `in ${plan.location}`].filter(Boolean).join(' ');
  log('info', `Maps: searching "${textQuery}" via ${providers.join(' + ')}`);
  const settled = await Promise.allSettled(providers.map((p) => search[p](textQuery, plan, limit, log)));
  const rows = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      if (providers.length > 1) log('info', `Maps (${providers[i]}): ${r.value.length} places`);
      rows.push(...r.value);
    } else {
      log('error', `Maps (${providers[i]}) failed: ${errorText(r.reason)}`);
    }
  });
  if (settled.every((r) => r.status === 'rejected')) throw settled[0].reason;
  return rows;
}

export async function searchGoogleMaps(plan, limit, log) {
  const locations = plan.locations?.length ? plan.locations : [plan.location || ''];
  const limitLocations = pLimit(3);
  const perLocation = await Promise.all(
    locations.map((location) =>
      limitLocations(async () => {
        try {
          const found = await searchOneLocation({ ...plan, location }, limit, log);
          return found.map((r) => ({ ...r, searchLocation: location || undefined }));
        } catch (err) {
          if (locations.length === 1) throw err;
          log('error', `Maps (${location}) failed: ${errorText(err)}`);
          return [];
        }
      }),
    ),
  );
  return perLocation.flat();
}
