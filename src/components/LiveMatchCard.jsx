import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { getImageUrl, formatMinute } from '../services/bsdApi';
import SmartLogo from './SmartLogo';

export default function LiveMatchCard({ match }) {
  const { 
    id, 
    home_score, 
    away_score, 
    current_minute, 
    period,
    live_stats, 
    incidents,
    home_xg_live,
    away_xg_live,
    referee
  } = match;

  // Safely extract league
  const league = typeof match.league === 'string' 
    ? { name: match.league, id: match.league } 
    : (match.league || { name: match.league_name || 'Unknown League', id: match.league?.id || match.league_short, api_id: match.league?.api_id });
    
  // Normalize team objects to handle both string and object formats
  const rawHome = match.home_team_obj || match.home_team;
  const home_team = typeof rawHome === 'string' 
    ? { name: rawHome, id: rawHome } 
    : (rawHome ? { ...rawHome, id: rawHome.id || rawHome.team_id, api_id: rawHome.api_id } : { name: 'Home Team' });
    
  const rawAway = match.away_team_obj || match.away_team;
  const away_team = typeof rawAway === 'string' 
    ? { name: rawAway, id: rawAway } 
    : (rawAway ? { ...rawAway, id: rawAway.id || rawAway.team_id, api_id: rawAway.api_id } : { name: 'Away Team' });

  const leagueLogos = [getImageUrl('league', league?.id)];
  const homeLogos = [getImageUrl('team', home_team?.id)];
  const awayLogos = [getImageUrl('team', away_team?.id)];

  const sortedIncidents = incidents ? [...incidents].sort((a, b) => a.minute - b.minute) : [];

  return (
    <Link 
      to={`/match/${id}`}
      className="block bg-white rounded-xl border border-red-200 overflow-hidden hover:border-red-400 transition-colors relative shadow-sm"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
      
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <SmartLogo 
            urls={leagueLogos} 
            alt={league?.name} 
            className="w-4 h-4 object-contain"
            fallbackText={league?.name || 'L'}
          />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {league?.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-red-600">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-xs font-bold">{formatMinute(current_minute, period)}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SmartLogo 
              urls={homeLogos} 
              alt={home_team?.name} 
              className="w-8 h-8 object-contain shrink-0"
              fallbackText={home_team?.name || 'H'}
            />
            <span className="text-sm font-bold text-slate-900 truncate">{home_team?.name}</span>
          </div>

          <div className="flex items-center justify-center px-4 min-w-[80px] shrink-0">
            <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900">{home_score ?? 0}</span>
              <span className="text-sm text-slate-400">-</span>
              <span className="text-xl font-bold text-slate-900">{away_score ?? 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
            <span className="text-sm font-bold text-slate-900 truncate text-right">{away_team?.name}</span>
            <SmartLogo 
              urls={awayLogos} 
              alt={away_team?.name} 
              className="w-8 h-8 object-contain shrink-0"
              fallbackText={away_team?.name || 'A'}
            />
          </div>
        </div>

        {/* Live Stats Mini */}
        {live_stats && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {/* Possession */}
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-600 font-medium">{Math.round(live_stats.home?.ball_possession || 0)}%</span>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Possession</span>
              <span className="text-slate-600 font-medium">{Math.round(live_stats.away?.ball_possession || 0)}%</span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200 mb-3">
              <div 
                className="bg-green-500 h-full transition-all duration-500" 
                style={{ width: `${live_stats.home?.ball_possession || 50}%` }}
              ></div>
              <div 
                className="bg-blue-500 h-full transition-all duration-500" 
                style={{ width: `${live_stats.away?.ball_possession || 50}%` }}
              ></div>
            </div>

            {/* Shots */}
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">{live_stats.home?.total_shots || 0}</span>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Shots</span>
              <span className="text-slate-600 font-medium">{live_stats.away?.total_shots || 0}</span>
            </div>
            
            {/* Shots on target */}
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">{live_stats.home?.shots_on_target || 0}</span>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">On Target</span>
              <span className="text-slate-600 font-medium">{live_stats.away?.shots_on_target || 0}</span>
            </div>
            
            {/* Corners */}
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">{live_stats.home?.corner_kicks || 0}</span>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Corners</span>
              <span className="text-slate-600 font-medium">{live_stats.away?.corner_kicks || 0}</span>
            </div>
          </div>
        )}

        {/* Live xG */}
        {(home_xg_live !== undefined && away_xg_live !== undefined) && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 font-medium">{home_xg_live.toFixed(2)}</span>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Live xG</span>
              <span className="text-slate-600 font-medium">{away_xg_live.toFixed(2)}</span>
            </div>
            <div className="flex h-1 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
              <div 
                className="bg-green-400 h-full transition-all duration-500" 
                style={{ width: `${(home_xg_live / (home_xg_live + away_xg_live || 1)) * 100}%` }}
              ></div>
              <div 
                className="bg-blue-400 h-full transition-all duration-500" 
                style={{ width: `${(away_xg_live / (home_xg_live + away_xg_live || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Incidents */}
        {sortedIncidents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Recent Events</h4>
            </div>
            <div className="space-y-1.5">
              {sortedIncidents.slice(-3).reverse().map((incident, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="font-mono font-medium text-slate-900 w-6">{incident.minute}'</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    incident.type === 'goal' ? 'bg-green-100 text-green-700' :
                    incident.type === 'card' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {incident.type}
                  </span>
                  <span className="truncate flex-1 font-medium" title={incident.player_name}>{incident.player_name}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{incident.is_home ? 'Home' : 'Away'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Referee */}
        {referee && referee.name && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
            <span>Ref: {referee.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
