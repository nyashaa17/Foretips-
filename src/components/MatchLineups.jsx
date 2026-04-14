import React from 'react';
import { Shield } from 'lucide-react';

export default function MatchLineups({ lineups, homeTeam, awayTeam }) {
  if (!lineups || (!lineups.home && !lineups.away)) return null;

  const renderTeamLineup = (teamName, teamData) => {
    if (!teamData) return null;
    
    return (
      <div className="flex-1">
        <div className="mb-4">
          <h4 className="font-bold text-slate-900">{teamName}</h4>
          <p className="text-sm text-slate-500">Formation: {teamData.formation || 'Unknown'}</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Starting XI</h5>
            <div className="space-y-2">
              {(teamData.starters || []).map((player, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">{player.number || '-'}</span>
                    <span className="text-sm font-medium text-slate-900">{player.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {player.goals > 0 && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded" title="Goals">⚽ {player.goals}</span>}
                    {player.yellow_cards > 0 && <span className="w-2 h-3 bg-yellow-400 rounded-sm" title="Yellow Card"></span>}
                    {player.red_cards > 0 && <span className="w-2 h-3 bg-red-500 rounded-sm" title="Red Card"></span>}
                    {player.substituted_out && <span className="text-xs text-red-500 font-bold ml-1" title="Subbed Out">↓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {teamData.substitutes && teamData.substitutes.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Substitutes</h5>
              <div className="space-y-2">
                {teamData.substitutes.map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-bold text-slate-400">{player.number || '-'}</span>
                      <span className="text-sm text-slate-600">{player.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {player.substituted_in && <span className="text-xs text-green-500 font-bold mr-1" title="Subbed In">↑</span>}
                      {player.goals > 0 && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded" title="Goals">⚽ {player.goals}</span>}
                      {player.yellow_cards > 0 && <span className="w-2 h-3 bg-yellow-400 rounded-sm" title="Yellow Card"></span>}
                      {player.red_cards > 0 && <span className="w-2 h-3 bg-red-500 rounded-sm" title="Red Card"></span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Match Lineups</h3>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {renderTeamLineup(homeTeam, lineups.home)}
        {renderTeamLineup(awayTeam, lineups.away)}
      </div>
    </div>
  );
}
