
import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const LAST_UPDATE_VERSION = '2026-05-08-v3';

const updates = [
  { title: 'New "Events" Tab', description: 'Quickly see all match events directly in the match details page.' },
  { title: 'Improved League Standings', description: 'Cleaner, easier-to-read league tables with better navigation.' },
  { title: 'Match Preview & Lineups', description: 'View predicted lineups, formations, and player positions.' },
  { title: 'Unavailable Players', description: 'Quickly identify missing players and unavailability reasons.' },
  { title: 'Expanded League Coverage', description: 'We have added several new leagues for your enjoyment.' },
  { title: 'Feature Updates', description: 'Community Tips and Leaderboard are temporarily paused to refine the experience. They will return in a future update.' },
];

export default function UpdateNotification() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('last_seen_update_version');
    if (lastSeenVersion !== LAST_UPDATE_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const closeNotification = () => {
    setIsOpen(false);
    localStorage.setItem('last_seen_update_version', LAST_UPDATE_VERSION);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <Sparkles className="w-5 h-5" />
            What&apos;s New
          </div>
          <button onClick={closeNotification} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <ul className="space-y-4 mb-6">
          {updates.map((update, idx) => (
            <li key={idx}>
              <h4 className="font-bold text-sm text-slate-900">{update.title}</h4>
              <p className="text-xs text-slate-500">{update.description}</p>
            </li>
          ))}
        </ul>

        <button 
          onClick={closeNotification}
          className="w-full bg-[#0F172A] text-white py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
