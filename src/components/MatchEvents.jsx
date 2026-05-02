import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export default function MatchEvents({ incidents }) {
  if (!incidents || incidents.length === 0) return null;

  // We want to process incidents by minute, or maybe reverse them?
  // Let's assume they are sorted by minute descending. Let's sort them just in case.
  const sortedIncidents = [...incidents].sort((a, b) => b.minute - a.minute);

  // Group by HT?
  // We can just render them in order.

  // Let's count totals
  const totalGoals = incidents.filter(i => i.type === 'goal').length;
  const totalCards = incidents.filter(i => i.type === 'card' && (i.card_type === 'yellow' || i.card_type === 'red')).length;
  const totalSubs = incidents.filter(i => i.type === 'substitution').length;

  const renderIcon = (incident) => {
    switch (incident.type) {
      case 'goal':
        return <span className="text-lg">⚽</span>;
      case 'card':
        if (incident.card_type === 'yellow') {
          return <div className="w-4 h-5 bg-yellow-400 rounded-sm"></div>;
        } else if (incident.card_type === 'red') {
          return <div className="w-4 h-5 bg-red-500 rounded-sm"></div>;
        } else {
          return <div className="w-4 h-5 bg-yellow-400 rounded-sm border-2 border-red-500"></div>; // second yellow
        }
      case 'substitution':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'var':
        return (
          <div className="bg-slate-800 text-white text-[9px] font-black rounded-full w-6 h-6 flex items-center justify-center tracking-tighter">
            VAR
          </div>
        );
      default:
        return null;
    }
  };

  const formatText = (incident) => {
    switch (incident.type) {
      case 'goal':
        const scoreStr = incident.is_home === true || incident.is_home === false
          ? `(${incident.home_score} - ${incident.away_score})`
          : '';
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
              {incident.player}
              {scoreStr && (
                <span className="bg-slate-800 text-white text-[11px] px-1.5 py-0.5 rounded font-bold">
                  {incident.home_score} - {incident.away_score}
                </span>
              )}
            </span>
            {incident.assist && <span className="text-[11px] text-slate-500">assist by {incident.assist}</span>}
          </div>
        );
      case 'card':
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm">{incident.player}</span>
            <span className="text-[11px] text-slate-500 capitalize">{incident.card_type} card</span>
          </div>
        );
      case 'substitution':
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <span className="text-green-500 text-base">↑</span> {incident.player_in}
            </span>
            <span className="text-[11px] text-slate-600 flex items-center gap-1.5">
              <span className="text-red-500 text-base">↓</span> {incident.player_out}
            </span>
          </div>
        );
      case 'var':
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm">{incident.player}</span>
            <span className="text-[11px] text-slate-500">{incident.reason || incident.text || 'VAR Decision'}</span>
          </div>
        );
      default:
        return <span className="text-sm font-medium">{incident.text || incident.type}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Events
        </h3>
        <div className="text-[11px] text-slate-500 font-medium">
          {totalGoals} goals • {totalCards} cards • {totalSubs} subs
        </div>
      </div>
      
      <div className="divide-y divide-slate-100">
        {sortedIncidents.map((incident, idx) => {
          if (incident.type === 'period') {
            return (
              <div key={idx} className="bg-slate-50 py-2.5 flex items-center justify-center text-xs font-bold text-slate-500">
                {incident.text || 'HT'} {incident.home_score !== undefined ? `${incident.home_score} - ${incident.away_score}` : ''}
              </div>
            );
          }

          if (incident.type === 'injuryTime') {
            return null; // Skip rendering injury time block, or render small +x
          }

          return (
            <div key={idx} className="flex items-center px-4 py-3 hover:bg-slate-50/50 transition-colors">
              <div className="w-12 shrink-0 text-sm font-bold text-slate-500 flex justify-end pr-4 border-r border-slate-100">
                {incident.minute}'
              </div>
              <div className="flex flex-1 items-center gap-4 px-4">
                <div className="w-8 flex justify-center shrink-0">
                  {renderIcon(incident)}
                </div>
                {formatText(incident)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
