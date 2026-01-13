import axios from 'axios';

const OSRM_BASE_URL = 'http://router.project-osrm.org';

/**
 * Fetch driving durations table.
 * @param {Array<{lat, lon}>} origins 
 * @param {Array<{lat, lon}>} destinations 
 * @returns {Promise<Array<Array<number>>>} Matrix of durations in seconds
 */
export const getDrivingDurations = async (origins, destinations) => {
    if (origins.length === 0 || destinations.length === 0) return [];

    // OSRM Table API: /table/v1/driving/{lon},{lat};{lon},{lat}?sources=...&destinations=...
    // Coordinates: all origins followed by all destinations
    const allPoints = [...origins, ...destinations];
    const coordsString = allPoints.map(p => `${p.lon},${p.lat}`).join(';');

    // Indices
    const sourceIndices = origins.map((_, i) => i).join(';');
    const destIndices = destinations.map((_, i) => origins.length + i).join(';');

    // Check URL length. If too long, we might need chunking. 
    // Approx limit is often 8kb. 
    // 100 destinations * 20 chars = 2000 chars. Safe.

    try {
        const url = `${OSRM_BASE_URL}/table/v1/driving/${coordsString}`;
        const response = await axios.get(url, {
            params: {
                sources: sourceIndices,
                destinations: destIndices
            }
        });

        if (response.data && response.data.durations) {
            return response.data.durations;
        }
        throw new Error("Invalid OSRM response");
    } catch (error) {
        console.error("Routing error:", error);
        // Fallback or better error handling?
        // If OSRM fails, we might fall back to straight line (haversine) but user asked for driving.
        // We will throw for now.
        throw error;
    }
};
