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

/**
 * Fetch full route geometry and leg details for a sequence of points.
 * @param {Array<{lat, lon}>} points 
 * @returns {Promise<{coordinates:Array<[lat, lon]>, legs:Array<{duration:number, distance:number}>}>} 
 */
export const getRoute = async (points) => {
    if (points.length < 2) return { coordinates: [], legs: [] };

    const coordsString = points.map(p => `${p.lon},${p.lat}`).join(';');
    // geometries=geojson returns standard GeoJSON LineString coordinates
    // overview=full gives full path
    // steps=false (default) but legs=true implicitly with multiple waypoints
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            return {
                // OSRM returns [lon, lat], Leaflet needs [lat, lon]
                coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
                legs: route.legs // Array of leg objects, each has .duration (seconds) & .distance (meters)
            };
        }
        return { coordinates: [], legs: [] };
    } catch (error) {
        console.error("Route fetch error", error);
        return { coordinates: [], legs: [] };
    }
};
