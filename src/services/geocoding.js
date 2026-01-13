import axios from 'axios';

const CACHE_KEY = 'geocode_cache';
const RATE_LIMIT_MS = 1100; // 1.1s to be safe

const getCache = () => {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
};

const setCache = (cache) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const geocodePostcode = async (postcode, country = 'United Kingdom') => {
    // Normalize: remove spaces, uppercase
    const normalized = postcode ? postcode.toUpperCase().replace(/\s/g, '') : '';
    if (!normalized) return null;

    // Check cache
    const cache = getCache();
    if (cache[normalized]) {
        console.log(`Cache hit for ${normalized}`);
        return cache[normalized];
    }

    try {
        await delay(RATE_LIMIT_MS); // Respect rate limit
        console.log(`Fetching ${normalized} from Nominatim...`);
        // Use a generic User-Agent or the browser's one will be sent.
        // Nominatim requires a valid referer or user-agent identifying the app.
        // Since this runs in browser, 'User-Agent' header might be restricted by browser,
        // but Nominatim often checks valid Referer if UA is browser. 
        // We will try standard request.

        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: `${postcode}, ${country}`,
                format: 'json',
                limit: 1
            }
        });

        if (response.data && response.data.length > 0) {
            const result = {
                lat: parseFloat(response.data[0].lat),
                lon: parseFloat(response.data[0].lon),
                display_name: response.data[0].display_name
            };

            // Update cache
            const newCache = getCache();
            newCache[normalized] = result;
            setCache(newCache);

            return result;
        }
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};

export const batchGeocode = async (postcodes, onProgress) => {
    const results = [];
    let processed = 0;

    // De-duplicate postcodes first to save calls
    const distinctPostcodes = [...new Set(postcodes)];

    for (const pc of distinctPostcodes) {
        const coords = await geocodePostcode(pc);
        if (coords) {
            results.push({ postcode: pc, ...coords });
        }
        processed++;
        if (onProgress) onProgress(processed, distinctPostcodes.length);
    }
    return results;
};
