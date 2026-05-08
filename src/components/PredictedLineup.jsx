import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { getImageUrl } from '../services/bsdApi';
import SmartLogo from './SmartLogo';

export default function PredictedLineup({ lineup, homeTeam, awayTeam, unavailable = [] }) {
  if (!lineup) return null;

  // Handle both old and new API structures
  const isNewStructure = !!lineup.lineups;
  
  const homeFormation = isNewStructure ? lineup.lineups?.home?.predicted_formation : lineup.home_formation;
  const awayFormation = isNewStructure ? lineup.lineups?.away?.predicted_formation : lineup.away_formation;
  
  const homeStarters = isNewStructure 
    ? (lineup.lineups?.home?.starters || []) 
    : (lineup.starters?.filter(p => p.is_home) || []);
    
  const awayStarters = isNewStructure 
    ? (lineup.lineups?.away?.starters || []) 
    : (lineup.starters?.filter(p => !p.is_home) || []);

  const homeUnavailable = [];
  const awayUnavailable = [];

  if (isNewStructure) {
    if (lineup.lineups?.home?.unavailable) {
      homeUnavailable.push(...lineup.lineups.home.unavailable);
    }
    if (lineup.lineups?.away?.unavailable) {
      awayUnavailable.push(...lineup.lineups.away.unavailable);
    }
  } else {
    // old structure
    if (lineup.unavailable) {
      homeUnavailable.push(...lineup.unavailable.filter(p => p.is_home));
      awayUnavailable.push(...lineup.unavailable.filter(p => !p.is_home));
    }
  }

  if (unavailable?.home) {
    homeUnavailable.push(...unavailable.home);
  }
  if (unavailable?.away) {
    awayUnavailable.push(...unavailable.away);
  }
  
  // Deduplicate by player_id
  const getUnique = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
      const id = item.player_id || item.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const uniqueHomeUnavailable = getUnique(homeUnavailable);
  const uniqueAwayUnavailable = getUnique(awayUnavailable);
  const allUnavailable = [...uniqueHomeUnavailable, ...uniqueAwayUnavailable];

  const confidence = isNewStructure 
    ? Math.round(((lineup.lineups?.home?.confidence || 0) + (lineup.lineups?.away?.confidence || 0)) / 2)
    : lineup.confidence;

  if (homeStarters.length === 0 && awayStarters.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Predicted Lineups</h3>
        </div>
        <p className="text-slate-500">Stats not yet available. Lineups will be displayed closer to kick-off.</p>
      </div>
    );
  }

  const getRatingColor = (rating) => {
    if (!rating) return 'bg-slate-400';
    if (rating >= 70) return 'bg-[#10B981]'; // Green
    if (rating >= 50) return 'bg-[#3B82F6]'; // Blue
    return 'bg-slate-400'; // Gray
  };

  const renderTeamPredictedLineup = (team, formation, teamStarters, conf, teamUnavailable) => {
    if (!teamStarters || teamStarters.length === 0) return null;
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
              {formation && (
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold">
                  {formation}
                </span>
              )}
              <span className="bg-[#FFF8E6] text-[#B48316] px-3 py-1 rounded-lg text-sm font-bold">
                Predicted
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
              Predicted Starting XI
            </h4>
            {conf > 0 && (
              <span className="bg-[#E6F0FD] text-[#2563EB] px-3 py-1.5 rounded-lg text-xs font-bold">
                {conf}% conf
              </span>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="px-2 pb-2">
          {teamStarters.map((player, idx) => {
            const playerImg = getImageUrl('player', player.player_id || player.id);
            const position = player.position || 'Unknown';
            const startsInfo = player.starts_info || ''; // e.g. "10/10 starts · Avg 7.14"
            const rating = player.rating || (player.probability ? (player.probability * 100).toFixed(1) : null);
            
            // Check if player is doubtful by checking unavailable list
            const isDoubtful = allUnavailable.some(u => 
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
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-500 pl-7">
                      <span className="font-medium text-slate-700">{position}</span>
                      {startsInfo ? (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>{startsInfo}</span>
                        </>
                      ) : null}
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
          })}
        </div>

        {teamUnavailable && teamUnavailable.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
            <h4 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               <AlertCircle className="w-4 h-4 text-rose-500" />
               Unavailable Players
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teamUnavailable.map((player, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                   <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                     <img 
                       src={getImageUrl('player', player.player_id || player.id)} 
                       alt={player.name} 
                       className="w-full h-full object-cover"
                       onError={(e) => {
                         e.target.onerror = null;
                         e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.name || 'P') + '&background=e2e8f0&color=64748b&bold=true';
                       }}
                     />
                   </div>
                   <div className="flex flex-col">
                     <span className="font-bold text-sm text-slate-900">{player.name}</span>
                     <span className="text-xs text-rose-600 font-medium capitalize">
                       {player.status || player.reason || 'Unavailable'}
                     </span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderTeamPredictedLineup(homeTeam, homeFormation, homeStarters, confidence, uniqueHomeUnavailable)}
      {renderTeamPredictedLineup(awayTeam, awayFormation, awayStarters, confidence, uniqueAwayUnavailable)}
    </div>
  );
}
