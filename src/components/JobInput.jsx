import React, { useState } from 'react';
import { Upload, Play, Loader2 } from 'lucide-react';

export const JobInput = ({ onImport, isProcessing, progress }) => {
    const [text, setText] = useState('');

    const handleImport = () => {
        // Split by newlines or commas
        const postcodes = text.split(/[\n,]/).map(p => p.trim()).filter(p => p.length > 0);
        if (postcodes.length > 0) {
            onImport(postcodes);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                <Upload className="w-5 h-5 text-blue-600" /> Job Import
            </h2>
            <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Paste job postcodes (one per line or comma separated):</label>
                <textarea
                    className="w-full h-32 p-3 border rounded-md focus:ring-2 focus:ring-blue-200 outline-none font-mono text-sm"
                    placeholder="SW1A 1AA&#10;EC1A 1BB&#10;..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isProcessing}
                />
                <p className="text-xs text-gray-400 mt-1">{text.split(/[\n,]/).filter(p => p.trim()).length} postcodes detected</p>
            </div>

            <button
                onClick={handleImport}
                disabled={!text.trim() || isProcessing}
                className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium text-white transition-colors ${!text.trim() || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing {progress.current}/{progress.total}
                    </>
                ) : (
                    <>
                        <Play className="w-4 h-4" />
                        Calculate Allocation
                    </>
                )}
            </button>

            {isProcessing && (
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};
