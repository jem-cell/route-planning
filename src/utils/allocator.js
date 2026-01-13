import { getDrivingDurations } from '../services/routing';

export const allocateJobs = async (teamMembers, jobsWithCoords) => {
    // teamMembers: [{id, name, lat, lon}, ...]
    // jobsWithCoords: [{id, postcode, lat, lon}, ...]

    if (!teamMembers || teamMembers.length === 0 || !jobsWithCoords || jobsWithCoords.length === 0) {
        return [];
    }

    const homeLocations = teamMembers.map(m => ({ lat: m.lat, lon: m.lon }));
    const jobLocations = jobsWithCoords.map(j => ({ lat: j.lat, lon: j.lon }));

    console.log("Requesting routing matrix...");
    // Get duration matrix: rows = members, cols = jobs
    // Returns durations[memberIndex][jobIndex]
    const durationMatrix = await getDrivingDurations(homeLocations, jobLocations);

    // Create a copy of jobs to annotate
    const allocatedJobs = jobsWithCoords.map(job => ({ ...job }));

    // Step 1: Clustering / Assignment
    allocatedJobs.forEach((job, jobIndex) => {
        let minDuration = Infinity;
        let bestMemberIndex = -1;

        for (let memberIndex = 0; memberIndex < teamMembers.length; memberIndex++) {
            // OSRM returns duration in seconds
            const duration = durationMatrix[memberIndex][jobIndex];

            // Check for valid duration (sometimes null if unreachable)
            if (duration !== null && duration !== undefined && duration < minDuration) {
                minDuration = duration;
                bestMemberIndex = memberIndex;
            }
        }

        if (bestMemberIndex !== -1) {
            job.assignedTo = teamMembers[bestMemberIndex].id;
            job.durationFromHome = minDuration; // in seconds
        } else {
            job.assignedTo = 'UNASSIGNED';
        }
    });

    // Step 2: Batching (Days)
    teamMembers.forEach(member => {
        const memberJobs = allocatedJobs.filter(j => j.assignedTo === member.id);

        // Sort by proximity to home (Simple greedy strategy)
        // This makes Day 1 have the closest jobs, Day 5 the furthest.
        // It's a reasonable default without complex route optimization.
        memberJobs.sort((a, b) => a.durationFromHome - b.durationFromHome);

        memberJobs.forEach((job, index) => {
            const dayNumber = Math.floor(index / 10) + 1;
            job.day = `Day ${dayNumber}`;
        });
    });

    return allocatedJobs;
};
