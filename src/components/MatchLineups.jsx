import React, { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { getImageUrl } from '../services/bsdApi';
import SmartLogo from './SmartLogo';

export default function MatchLineups({ lineups, homeTeam, awayTeam, unavailable = [] }) {
  if (!lineups || (!lineups.home && !lineups.away)) return null;

  const [activeSubTab, setActiveSubTab] = useState('starters');

  const getRatingColor = (rating) => {
    if (!rating) return 'bg-slate-400';
    if (rating >= 7.0) return 'bg-[#10B981]'; // Green
    if (rating >= 6.0) return 'bg-[#3B82F6]'; // Blue
    return 'bg-slate-400'; // Gray
  };

  const renderPlayer = (player, idx, isHome) => {
    const playerImg = getImageUrl('player', player.player_id || player.id);
    const position = player.position || 'Unknown';
    const startsInfo = player.starts_info || ''; // if any
    const rating = player.rating || (player.probability ? (player.probability * 100).toFixed(1) : null);
    
    // Check if player is doubtful by checking unavailable list
    const isDoubtful = unavailable && Array.isArray(unavailable[isHome ? 'home' : 'away']) &&
      unavailable[isHome ? 'home' : 'away'].some(u => 
        (u.player_id === player.player_id || u.id === player.id) && 
        u.status?.toLowerCase() === 'doubtful'
      );

    return (
      <div key={idx} className="flex items-center justify-between p-4 bg-white border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
            <img 
              src={playerImg} 
              alt={player.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.name || 'P') + '&background=e2e8f0&color=64748b&bold=true';
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-400 w-5 text-right">{player.number || ''}</span>
              <span className="font-bold text-[#0F172A] text-[17px]">{player.name}</span>
              {isDoubtful && (
                <span className="bg-[#FFF8E6] text-[#B48316] text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                  Doubtful
                </span>
              )}
            </div>
            
            <div className="flex flex-col gap-1 pl-7">
              <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                <span className="font-medium text-slate-700">{position.charAt(0)}</span>
                {startsInfo ? (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{startsInfo}</span>
                  </>
                ) : null}
              </div>
              
              {/* Events & Match specific indicators */}
              <div className="flex gap-1">
                {player.goals > 0 && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded" title="Goals">⚽ {player.goals}</span>}
                {player.yellow_cards > 0 && <span className="w-2 h-3 bg-yellow-400 rounded-sm" title="Yellow Card"></span>}
                {player.red_cards > 0 && <span className="w-2 h-3 bg-red-500 rounded-sm" title="Red Card"></span>}
                {player.substituted_out && <span className="text-xs text-red-500 font-bold" title="Subbed Out">↓ Out</span>}
                {player.substituted_in && <span className="text-xs text-green-500 font-bold" title="Subbed In">↑ In</span>}
              </div>
            </div>
          </div>
        </div>
        
        {rating && (
          <div className={`px-3 py-1.5 rounded-lg text-white font-bold text-[15px] ${getRatingColor(parseFloat(rating))}`}>
            {rating}
          </div>
        )}
      </div>
    );
  };

  const renderTeamLineup = (team, teamData, isHome) => {
    if (!teamData) return null;
    const starters = teamData.players || teamData.starters || [];
    const substitutes = teamData.substitutes || [];
    
    const playersToRender = activeSubTab === 'starters' ? starters : substitutes;

    return (
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm mb-6 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <SmartLogo 
                urls={[getImageUrl('team', team?.id)]} 
                alt={team?.name} 
                className="w-8 h-8 object-contain"
                fallbackText={team?.name || 'T'}
              />
              <h3 className="text-lg font-bold text-slate-900">{team?.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              {teamData.formation && (
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold">
                  {teamData.formation}
                </span>
              )}
              <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-sm font-bold">
                Confirmed
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeSubTab === 'starters' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                onClick={() => setActiveSubTab('starters')}
              >
                Starting XI
              </button>
              <button
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeSubTab === 'substitutes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                onClick={() => setActiveSubTab('substitutes')}
              >
                Substitutes
              </button>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="px-2 pb-2">
          {playersToRender.length > 0 ? (
            playersToRender.map((player, idx) => renderPlayer(player, idx, isHome))
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              No players listed
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mb-8">
      {renderTeamLineup(homeTeam, lineups.home, true)}
      {renderTeamLineup(awayTeam, lineups.away, false)}
    </div>
  );
}
