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

async function apifyGoogleMaps(textQuery, limit, log, plan) {
  const token = env.apify?.token;
  const actorId = env.apify?.googleMapScraper;
  if (!token || !actorId) return [];

  const rawQueries = (plan?.searchQueries?.length ? plan.searchQueries : [textQuery]).filter(Boolean).slice(0, 3);
  const queries = (rawQueries.length ? rawQueries : [textQuery]).map((q) => {
    if (plan?.location && !q.toLowerCase().includes(plan.location.toLowerCase())) {
      return `${q} in ${plan.location}`;
    }
    return q;
  });
  const perQueryLimit = Math.max(20, Math.ceil(limit / queries.length));

  const { ApifyClient } = await import('apify-client');
  const client = new ApifyClient({ token });
  const input = {
    searchStringsArray: queries,
    maxCrawledPlacesPerSearch: Math.min(perQueryLimit, 60),
    language: 'en',
    skipClosedPlaces: true,
    maxReviews: 0,
    maxImages: 0,
  };

  const run = await client.actor(actorId).call(input, { timeout: 120 });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  return (items || [])
    .map((p) => ({
      name: p.title || p.name,
      category: p.categoryName || p.category || (Array.isArray(p.categories) ? p.categories[0] : undefined),
      address: p.address || [p.street, p.city, p.state, p.postalCode].filter(Boolean).join(', '),
      city: p.city,
      phone: p.phone || p.phoneUnformatted,
      website: p.website || p.url,
      rating: p.totalScore || p.rating,
      reviewsCount: p.reviewsCount || p.reviews,
      lat: p.location?.lat || p.latitude,
      lng: p.location?.lng || p.longitude,
      mapsUrl: p.url && p.url.includes('google.com/maps') ? p.url : (p.placeId ? `https://www.google.com/maps/place/?q=place_id:${p.placeId}` : undefined),
      email: p.email || (Array.isArray(p.emails) && p.emails[0] ? p.emails[0] : undefined),
      linkedinUrl: p.linkedinUrl || p.linkedIn,
      instagramUrl: p.instagramUrl || p.instagram,
      facebookUrl: p.facebookUrl || p.facebook,
      source: 'google_maps',
    }))
    .filter((r) => r.name);
}

const PROVIDER_SEARCH = {
  apify_google_maps: (textQuery, plan, limit, log) => apifyGoogleMaps(textQuery, limit, log, plan),
  google_places: async (textQuery, plan, limit) => {
    const rawQueries = (plan?.searchQueries?.length ? plan.searchQueries : [textQuery]).filter(Boolean).slice(0, 3);
    const queries = rawQueries.length ? rawQueries : [textQuery];
    const perQueryLimit = Math.max(20, Math.ceil(limit / queries.length));
    const results = [];
    for (const q of queries) {
      const qWithLoc = plan?.location && !q.toLowerCase().includes(plan.location.toLowerCase()) ? `${q} in ${plan.location}` : q;
      const res = await placesTextSearch(qWithLoc, perQueryLimit);
      results.push(...res);
      if (results.length >= limit) break;
    }
    return results;
  },
  serpapi_google_maps: async (textQuery, plan, limit) => {
    const rawQueries = (plan?.searchQueries?.length ? plan.searchQueries : [textQuery]).filter(Boolean).slice(0, 3);
    const queries = rawQueries.length ? rawQueries : [textQuery];
    const perQueryLimit = Math.max(20, Math.ceil(limit / queries.length));
    const results = [];
    for (const q of queries) {
      const qWithLoc = plan?.location && !q.toLowerCase().includes(plan.location.toLowerCase()) ? `${q} in ${plan.location}` : q;
      const res = await serpApiMaps(qWithLoc, perQueryLimit);
      results.push(...res);
      if (results.length >= limit) break;
    }
    return results;
  },
  openstreetmap: (_textQuery, plan, limit, log) => searchOsm(plan, limit, log),
};

export function mapsProviders() {
  const list = [
    env.googleMapsApiKey && 'google_places',
    env.serpApiKey && 'serpapi_google_maps',
    env.apify?.token && env.apify?.googleMapScraper && 'apify_google_maps',
  ].filter(Boolean);
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
