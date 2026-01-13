import React, { useState, useEffect } from 'react';
import { MapComponent } from './MapComponent';
import { getRoute } from '../services/routing';

import { Download } from 'lucide-react';

export const Dashboard = ({ members, jobs }) => {
    // Stores route data: { "memberId-Day": { coordinates: [...], legs: [...] } }
    const [routesData, setRoutesData] = useState({});

    useEffect(() => {
        const fetchAllRoutes = async () => {
            const data = {};

            for (const member of members) {
                const memberJobs = jobs.filter(j => j.assignedTo === member.id && j.lat && j.lon);
                const days = [...new Set(memberJobs.map(j => j.day))];

                for (const day of days) {
                    const dayJobs = memberJobs.filter(j => j.day === day)
                        .sort((a, b) => a.durationFromHome - b.durationFromHome);

                    // Route: Home -> Job 1 -> Job 2 ... -> Home
                    const points = [
                        { lat: member.lat, lon: member.lon }, // Home
                        ...dayJobs.map(j => ({ lat: j.lat, lon: j.lon })), // Jobs
                        { lat: member.lat, lon: member.lon } // Back Home
                    ];

                    const result = await getRoute(points);
                    if (result.coordinates.length > 0) {
                        data[`${member.id}-${day}`] = {
                            coordinates: result.coordinates,
                            legs: result.legs,
                            color: member.color
                        };
                    }
                }
            }
            setRoutesData(data);
        };

        if (jobs.length > 0 && members.length > 0) {
            fetchAllRoutes();
        }
    }, [members, jobs]);
    const handleExport = () => {
        const headers = ['Postcode', 'Address', 'Assigned To', 'Day', 'Drive Time (min)'];
        const rows = jobs.map(j => {
            const member = members.find(m => m.id === j.assignedTo);
            const address = j.display_name ? `"${j.display_name.replace(/"/g, '""')}"` : ''; // Handle commas in address
            return [
                j.postcode,
                address,
                member ? member.name : 'Unassigned',
                j.day || '',
                j.durationFromHome ? (j.durationFromHome / 60).toFixed(0) : ''
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), ...rows].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "route_allocation.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-end">
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>
            <div className="flex-1 min-h-0 flex gap-6">
                {/* Columns Area - 60% width maybe? Or flex-1 */}
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 min-w-[50%]">
                    {members.map(member => {
                        const memberJobs = jobs.filter(j => j.assignedTo === member.id);
                        // Group by Day
                        const schedule = {};
                        memberJobs.forEach(j => {
                            if (!schedule[j.day]) schedule[j.day] = [];
                            schedule[j.day].push(j);
                        });
                        // Sort days
                        const days = Object.keys(schedule).sort();

                        return (
                            <div key={member.id} className="min-w-[320px] bg-gray-50 rounded-lg flex flex-col border border-gray-200">
                                <div className="p-4 rounded-t-lg shadow-sm flex justify-between items-center" style={{ backgroundColor: member.color, color: 'white' }}>
                                    <span className="font-bold text-lg">{member.name}</span>
                                    <span className="text-xs bg-black/20 px-2 py-1 rounded-full font-mono">{memberJobs.length} Jobs</span>
                                </div>
                                <div className="p-3 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                                    {days.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-gray-400 italic">
                                            No jobs assigned
                                        </div>
                                    )}
                                    {days.map(day => (
                                        <div key={day} className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                                            <div className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 border-b border-gray-200 flex justify-between uppercase tracking-wide">
                                                {day}
                                                <span className={schedule[day].length > 10 ? 'text-red-500' : 'text-gray-500'}>{schedule[day].length} / 10</span>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {schedule[day].map((job, idx) => (
                                                    <div key={idx} className="p-3 text-sm hover:bg-gray-50 flex justify-between items-center group transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-gray-700 font-medium">{job.postcode}</span>
                                                            {job.display_name && (
                                                                <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{job.display_name.split(',')[0]}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded group-hover:bg-gray-200" title="Travel time for this leg">
                                                            {(() => {
                                                                const routeKey = `${member.id}-${day}`;
                                                                const dayRoute = routesData[routeKey];
                                                                // Leg 0 is Home -> Job 1
                                                                // Leg 1 is Job 1 -> Job 2
                                                                // ...
                                                                // Leg N is Job N -> Home
                                                                // idx matches the leg index we care about for "arrival at job idx"
                                                                // Job idx 0 arrived via Leg 0.
                                                                if (dayRoute && dayRoute.legs && dayRoute.legs[idx]) {
                                                                    const durationSec = dayRoute.legs[idx].duration;
                                                                    return `~${(durationSec / 60).toFixed(0)}m`;
                                                                }
                                                                return '-';
                                                            })()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Map Area */}
                <div className="flex-[1.5] rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white h-full relative">
                    <MapComponent
                        members={members}
                        jobs={jobs}
                        routes={Object.entries(routesData).map(([key, data]) => ({
                            key,
                            positions: data.coordinates,
                            color: data.color
                        }))}
                    />
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-2 rounded shadow-md z-[1000] text-xs space-y-1">
                        <div className="font-bold mb-1">Legend</div>
                        {members.map(m => (
                            <div key={m.id} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></div>
                                <span>{m.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
