import React, { useState } from 'react';
import { geocodePostcode } from '../services/geocoding';
import { MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const TeamSetup = ({ members, onUpdateMember }) => {
    const [loading, setLoading] = useState({});

    const handlePostcodeBlur = async (id, postcode) => {
        if (!postcode) return;
        // Don't re-geocode if unchanged and valid? 
        // Simplified: always check if changed.

        setLoading(prev => ({ ...prev, [id]: true }));
        const coords = await geocodePostcode(postcode);

        if (coords) {
            onUpdateMember(id, { ...members.find(m => m.id === id), postcode, ...coords, valid: true });
        } else {
            onUpdateMember(id, { ...members.find(m => m.id === id), postcode, valid: false });
        }
        setLoading(prev => ({ ...prev, [id]: false }));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                <MapPin className="w-5 h-5 text-blue-600" /> Team Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {members.map((member, idx) => (
                    <div key={member.id} className="border p-4 rounded-md relative bg-gray-50 hover:shadow-md transition-shadow">
                        <div className='absolute top-4 right-4 w-3 h-3 rounded-full shadow-sm' style={{ backgroundColor: member.color }}></div>

                        <div className="mb-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Name</label>
                            <input
                                type="text"
                                value={member.name}
                                onChange={(e) => onUpdateMember(member.id, { ...member, name: e.target.value })}
                                className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                placeholder={`Member ${idx + 1}`}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Home Postcode</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={member.postcode}
                                    onChange={(e) => onUpdateMember(member.id, { ...member, postcode: e.target.value })}
                                    onBlur={(e) => handlePostcodeBlur(member.id, e.target.value)}
                                    className={`w-full p-2 border rounded pr-8 bg-white focus:ring-2 outline-none transition-all ${member.valid === false ? 'border-red-500 focus:ring-red-200' :
                                            member.valid === true ? 'border-green-500 focus:ring-green-200' : 'focus:ring-blue-200'
                                        }`}
                                    placeholder="e.g. SW1A 1AA"
                                />
                                <div className="absolute right-2 top-2.5">
                                    {loading[member.id] ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> :
                                        member.valid === true ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                                            member.valid === false ? <XCircle className="w-4 h-4 text-red-500" /> : null
                                    }
                                </div>
                            </div>
                            {member.display_name && (
                                <p className="text-xs text-gray-500 mt-1 truncate" title={member.display_name}>
                                    {member.display_name}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
