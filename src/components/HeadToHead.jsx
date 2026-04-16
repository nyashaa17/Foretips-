import React from 'react';
import { Users, History } from 'lucide-react';
import { format } from 'date-fns';

export default function HeadToHead({ h2h, homeTeam, awayTeam }) {
  if (!h2h) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-500 p-2 rounded-lg">
          <Users className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Head-to-Head</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">{homeTeam} Wins</span>
          <span className="text-2xl font-black text-slate-900">{h2h.home_wins || 0}</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Draws</span>
          <span className="text-2xl font-black text-slate-900">{h2h.draws || 0}</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">{awayTeam} Wins</span>
          <span className="text-2xl font-black text-slate-900">{h2h.away_wins || 0}</span>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Avg Total Goals</span>
          <span className="text-2xl font-black text-slate-900">{h2h.avg_total_goals != null ? Number(h2h.avg_total_goals).toFixed(2) : '0.00'}</span>
        </div>
      </div>

      {h2h.recent_matches && h2h.recent_matches.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Recent Meetings
          </h4>
          <div className="space-y-2">
            {h2h.recent_matches.map((match, idx) => {
              // Parse score if it's a string like "1-4"
              let homeScore = match.home_score;
              let awayScore = match.away_score;
              if (match.score && typeof match.score === 'string') {
                const parts = match.score.split('-');
                if (parts.length === 2) {
                  homeScore = parts[0].trim();
                  awayScore = parts[1].trim();
                }
              }

              return (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                  <span className="text-slate-500 w-24">
                    {match.date ? format(new Date(match.date), 'MMM d, yyyy') : ''}
                  </span>
                  <div className="flex-1 flex justify-center items-center gap-3">
                    <span className={`font-medium text-right flex-1 ${Number(homeScore) > Number(awayScore) ? 'text-slate-900' : 'text-slate-500'}`}>
                      {match.home || match.home_team}
                    </span>
                    <span className="bg-slate-200 px-2 py-1 rounded font-bold text-slate-700">
                      {homeScore} - {awayScore}
                    </span>
                    <span className={`font-medium text-left flex-1 ${Number(awayScore) > Number(homeScore) ? 'text-slate-900' : 'text-slate-500'}`}>
                      {match.away || match.away_team}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
