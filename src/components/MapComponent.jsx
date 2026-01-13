import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// import { getRoute } from '../services/routing'; // Moved to Dashboard

// Fix leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom colored icon
const getColoredIcon = (color, label = '') => {
    // Generate a simple SVG icon with the color and label
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="white" stroke-width="2">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <text x="12" y="10" font-family="Arial" font-size="8" fill="white" text-anchor="middle" dy=".3em" font-weight="bold">${label}</text>
    </svg>`;

    return L.divIcon({
        className: 'custom-marker',
        html: svg,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const FitBounds = ({ markers }) => {
    const map = useMap();
    React.useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lon]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [markers, map]);
    return null;
};

export const MapComponent = ({ members, jobs, routes = [] }) => {
    // Routes passed from parent to sync with time calculations

    // Prepare markers
    const memberMarkers = members.filter(m => m.lat && m.lon).map(m => ({
        ...m,
        type: 'HOME',
        icon: getColoredIcon(m.color, 'H')
    }));

    const jobMarkers = [];
    members.forEach(member => {
        const memberJobs = jobs.filter(j => j.assignedTo === member.id && j.lat && j.lon);
        // Sort to get the correct index for labeling
        const days = [...new Set(memberJobs.map(j => j.day))];

        days.forEach(day => {
            const dayJobs = memberJobs.filter(j => j.day === day)
                .sort((a, b) => a.durationFromHome - b.durationFromHome);

            dayJobs.forEach((job, idx) => {
                jobMarkers.push({
                    ...job,
                    type: 'JOB',
                    color: member.color,
                    icon: getColoredIcon(member.color, idx + 1), // Label 1, 2, 3...
                    order: idx + 1
                });
            });
        });
    });

    const allMarkers = [...memberMarkers, ...jobMarkers];
    const center = allMarkers.length > 0 ? [allMarkers[0].lat, allMarkers[0].lon] : [51.505, -0.09]; // Default London

    return (
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {routes.map((route) => (
                <Polyline
                    key={route.key}
                    positions={route.positions}
                    color={route.color}
                    weight={4}
                    opacity={0.6}
                />
            ))}

            {memberMarkers.map((m) => (
                <Marker key={`home-${m.id}`} position={[m.lat, m.lon]} icon={m.icon} zIndexOffset={1000}>
                    <Popup>
                        <strong>{m.name}</strong> (Home Base)<br />
                        {m.postcode}
                    </Popup>
                </Marker>
            ))}

            {jobMarkers.map((j, idx) => (
                <Marker key={`job-${idx}`} position={[j.lat, j.lon]} icon={j.icon}>
                    <Popup>
                        Job: {j.postcode}<br />
                        {j.day} - Stop #{j.order}<br />
                        {(j.durationFromHome / 60).toFixed(0)} min drive
                    </Popup>
                </Marker>
            ))}

            <FitBounds markers={allMarkers} />
        </MapContainer>
    );
};
