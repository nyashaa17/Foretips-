import { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export default function MatchSelector({ matches, selectedMatch, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-slate-900 font-bold text-center">-- Select an upcoming match --</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {matches.map(m => {
            const date = new Date(m.strTimestamp);
            const day = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isSelected = selectedMatch === m.idEvent;
            
            return (
              <button
                key={m.idEvent}
                onClick={() => {
                  onSelect(m.idEvent);
                  onClose();
                }}
                className="w-full text-left p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-900 text-sm">
                  {m.strEvent} ({day} {time})
                </span>
                {isSelected ? (
                  <div className="w-6 h-6 rounded-full border-2 border-pink-500 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                )}
              </button>
            );
          })}
          <button
            onClick={() => {
              onSelect('custom');
              onClose();
            }}
            className="w-full text-left p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="text-slate-900 text-sm">Custom Match (Manual Entry)</span>
            {selectedMatch === 'custom' ? (
              <div className="w-6 h-6 rounded-full border-2 border-pink-500 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
