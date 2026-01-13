import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
const getColoredIcon = (color) => {
    // Generate a simple SVG icon with the color
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="white" stroke-width="2">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
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

export const MapComponent = ({ members, jobs }) => {
    // Prepare markers
    const memberMarkers = members.filter(m => m.lat && m.lon).map(m => ({
        ...m,
        type: 'HOME',
        icon: getColoredIcon(m.color)
    }));

    const jobMarkers = jobs.filter(j => j.lat && j.lon && j.assignedTo !== 'UNASSIGNED').map(j => {
        const assignedMember = members.find(m => m.id === j.assignedTo);
        return {
            ...j,
            type: 'JOB',
            color: assignedMember?.color || 'gray',
            icon: getColoredIcon(assignedMember?.color || 'gray') // Use smaller or dot icon ideally, but pin is fine
        };
    });

    const allMarkers = [...memberMarkers, ...jobMarkers];
    const center = allMarkers.length > 0 ? [allMarkers[0].lat, allMarkers[0].lon] : [51.505, -0.09]; // Default London

    return (
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

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
                        {j.day}<br />
                        {(j.durationFromHome / 60).toFixed(0)} min drive
                    </Popup>
                </Marker>
            ))}

            <FitBounds markers={allMarkers} />
        </MapContainer>
    );
};
