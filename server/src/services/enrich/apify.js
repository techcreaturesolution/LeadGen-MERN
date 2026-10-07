import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token
// Note: Make sure process.env.APIFY_TOKEN is loaded by your dotenv setup
export const apifyEnabled = () => Boolean(process.env.APIFY_TOKEN);

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

// Mapping Apify Company data to match our standard Company object
export function fromApifyOrg(org) {
    if (!org) return null;
    return {
        name: org.name || org.title,
        website: org.websiteUrl || org.website || undefined,
        domain: org.websiteUrl ? new URL(org.websiteUrl).hostname : undefined,
        companyType: org.industry || undefined,
        description: org.description || org.about || undefined,
        employeeCount: org.staffCount || org.employeeCount || undefined,
        foundedYear: org.founded || undefined,
        linkedinUrl: org.url || org.linkedinUrl || undefined,
        phone: org.phone || undefined,
        city: org.headquarters?.city || org.city || undefined,
    };
}

/**
 * 1. Extract Website Email and Phones
 * Actor: vdrmota/contact-info-scraper
 */
export async function apifyContactDetails(websiteUrl) {
    try {
        const input = {
            startUrls: [{ url: websiteUrl }],
            maxDepth: 1, // Only check main pages to save cost/time
            maxItems: 40  // Limit to 40 results as requested
        };
        const run = await client.actor(process.env.APIFY_CONTACT_DETAIL).call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
            return {
                emails: items[0].emails || [],
                phones: items[0].phones || [],
                socialLinks: items[0].socialUrls || []
            };
        }
        return null;
    } catch (error) {
        console.error("Apify Contact Error:", error.message);
        return null;
    }
}

/**
 * 2. Extract Company Details from LinkedIn
 * Actor: harvestapi/linkedin-company
 */
export async function apifyOrganization({ domain, name }) {
    try {
        const input = {
            searchTerms: [domain || name],
            limit: 1 // Only need the top match for company details
        };
        const run = await client.actor(process.env.APIFY_COMPANY_DETAIL).call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
            return items[0]; // Returning top company match
        }
        return null;
    } catch (error) {
        console.error("Apify Company Error:", error.message);
        return null;
    }
}

/**
 * 3. Extract HR / Founder Profile from LinkedIn
 * Actor: harvestapi/linkedin-profile-scraper
 */
export async function apifyPeople(domain, role, perPage = 40) {
    try {
        const searchQuery = `${domain} "${role}" OR "HR" OR "Human Resources" OR "Founder"`;
        
        const input = {
            queries: [searchQuery],
            maxResults: perPage
        };
        
        const run = await client.actor(process.env.APIFY_LINKEDIN_PROFILE).call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
            return items.map(p => ({
                name: [p.firstName, p.lastName].filter(Boolean).join(' ') || p.fullName,
                title: p.headline || p.title,
                source: 'apify',
                linkedinUrl: p.url
            }));
        }
        return [];
    } catch (error) {
        console.error("Apify HR Profile Error:", error.message);
        return [];
    }
}
