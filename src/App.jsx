import React, { useState } from 'react';
import { TeamSetup } from './components/TeamSetup';
import { JobInput } from './components/JobInput';
import { Dashboard } from './components/Dashboard';
import { batchGeocode } from './services/geocoding';
import { allocateJobs } from './utils/allocator';
import { LayoutDashboard, Users, Zap } from 'lucide-react';

const INITIAL_MEMBERS = [
  { id: 'm1', name: 'Member 1', postcode: '', color: '#3b82f6', valid: null }, // Blue
  { id: 'm2', name: 'Member 2', postcode: '', color: '#10b981', valid: null }, // Green
  { id: 'm3', name: 'Member 3', postcode: '', color: '#f59e0b', valid: null }, // Amber
];

function App() {
  const [teamSize, setTeamSize] = useState(3);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [view, setView] = useState('setup'); // 'setup' | 'dashboard'

  const updateMember = (id, updates) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleImport = async (postcodes) => {
    setLoading(true);
    setProgress({ current: 0, total: postcodes.length });

    try {
      // 1. Geocode
      const geocoded = await batchGeocode(postcodes, (curr, total) => {
        setProgress({ current: curr, total });
      });

      if (geocoded.length === 0) {
        alert("No valid postcodes found.");
        setLoading(false);
        return;
      }

      // 2. Allocate
      // Only use the first `teamSize` members, and only those that are valid
      const activeMembers = members.slice(0, teamSize).filter(m => m.valid);
      const allocated = await allocateJobs(activeMembers, geocoded);

      setJobs(allocated);
      setView('dashboard');
    } catch (err) {
      console.error(err);
      alert("Error during allocation: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeMembersLength = members.slice(0, teamSize).filter(m => m.valid).length;

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Route<span className="text-blue-600">Planner</span>
          </h1>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('setup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'setup' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            <Users className="w-4 h-4" /> Team & Import
          </button>
          <button
            onClick={() => setView('dashboard')}
            disabled={jobs.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              } ${jobs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-6 md:p-8">
        {view === 'setup' ? (
          <div className="max-w-4xl mx-auto h-full overflow-y-auto pr-2 pb-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-3 text-gray-800">Setup Project</h1>
              <p className="text-gray-500 text-lg">Define your team's home bases and import the list of job postcodes to generate an optimized schedule.</p>
            </div>

            <TeamSetup
              members={members}
              onUpdateMember={updateMember}
              teamSize={teamSize}
              setTeamSize={setTeamSize}
            />

            <div className={`transition-opacity duration-300 ${activeMembersLength < teamSize ? "opacity-50 pointer-events-none grayscale" : "opacity-100"}`}>
              {activeMembersLength < teamSize && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-4 flex items-center gap-2">
                  <span>⚠️</span> Please configure all {teamSize} team members with valid, geocoded postcodes before importing jobs.
                </div>
              )}
              <JobInput onImport={handleImport} isProcessing={loading} progress={progress} />
            </div>
          </div>
        ) : (
          <Dashboard members={members} jobs={jobs} />
        )}
      </main>
    </div>
  );
}

export default App;
