import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import SmartLogo from './SmartLogo';
import { getTeamLogoUrl, getLeagueLogoUrl } from '../services/api';
import { generateMatchSlug } from '../utils/url';

export default function MatchCard({ match }) {
  const { id, event_date, league, home_score, away_score, status } = match;
  
  // Normalize team objects to handle both string and object formats
  const rawHome = match.home_team_obj || match.home_team;
  const home_team = typeof rawHome === 'string' 
    ? { name: rawHome, id: rawHome } 
    : (rawHome ? { ...rawHome, id: rawHome.id || rawHome.team_id, api_id: rawHome.api_id } : { name: 'Home Team' });
    
  const rawAway = match.away_team_obj || match.away_team;
  const away_team = typeof rawAway === 'string' 
    ? { name: rawAway, id: rawAway } 
    : (rawAway ? { ...rawAway, id: rawAway.id || rawAway.team_id, api_id: rawAway.api_id } : { name: 'Away Team' });

  const leagueLogos = [getLeagueLogoUrl(league?.id)];
  const homeLogos = [getTeamLogoUrl(home_team?.id)];
  const awayLogos = [getTeamLogoUrl(away_team?.id)];
  const matchSlug = generateMatchSlug(home_team?.name, away_team?.name, id);

  return (
    <Link 
      to={`/match/${matchSlug}`}
      className="block bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all"
    >
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
        <span className="text-xs text-slate-500">
          {format(new Date(event_date), 'MMM d, HH:mm')}
        </span>
      </div>

      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <SmartLogo 
            urls={homeLogos} 
            alt={home_team?.name} 
            className="w-6 h-6 object-contain"
            fallbackText={home_team?.name || 'H'}
          />
          <span className="text-sm font-medium text-slate-900 truncate">{home_team?.name}</span>
        </div>

        <div className="flex flex-col items-center justify-center px-4 min-w-[80px]">
          {status === 'NS' ? (
            <span className="text-sm font-bold text-slate-400">vs</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">{home_score}</span>
              <span className="text-sm text-slate-500">-</span>
              <span className="text-lg font-bold text-slate-900">{away_score}</span>
            </div>
          )}
          {status === 'LIVE' && (
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1 animate-pulse">
              Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="text-sm font-medium text-slate-900 truncate text-right">{away_team?.name}</span>
          <SmartLogo 
            urls={awayLogos} 
            alt={away_team?.name} 
            className="w-6 h-6 object-contain"
            fallbackText={away_team?.name || 'A'}
          />
        </div>
      </div>
    </Link>
  );
}
