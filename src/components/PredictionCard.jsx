import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { saveToHistory, getTeamLogoUrl, getLeagueLogoUrl } from '../services/api';
import { hapticFeedback } from '../utils/haptics';
import { getPreviewUrl } from '../utils/image';
import clsx from 'clsx';
import { Brain } from 'lucide-react';

import SmartLogo from './SmartLogo';

export default function PredictionCard({ prediction }) {
  console.log('Prediction object:', prediction);
  const {
    id,
    predicted_result,
    prob_home_win,
    prob_draw,
    prob_away_win,
    prob_over_25,
    prob_btts_yes,
    confidence,
    most_likely_score,
    odds,
  } = prediction;

  // Handle both flattened mock data and nested API data
  const event = prediction.event || prediction;
  console.log('Event object:', event);
  
  // Safely extract league
  const league = typeof event.league === 'string' 
    ? { name: event.league, id: event.league } 
    : (event.league || { name: event.league_name || 'Unknown League', id: event.league?.id || event.league_short, api_id: event.league?.api_id });
    
  // Safely extract home team
  const rawHome = event.home_team_obj || event.home_team;
  const home_team = typeof rawHome === 'string' 
    ? { name: rawHome, id: rawHome } 
    : (rawHome ? { ...rawHome, id: rawHome.id || rawHome.team_id, api_id: rawHome.api_id } : { name: 'Home Team' });
  console.log('Home team object:', home_team);
    
  // Safely extract away team
  const rawAway = event.away_team_obj || event.away_team;
  const away_team = typeof rawAway === 'string' 
    ? { name: rawAway, id: rawAway } 
    : (rawAway ? { ...rawAway, id: rawAway.id || rawAway.team_id, api_id: rawAway.api_id } : { name: 'Away Team' });
  console.log('Away team object:', away_team);
    
  const event_date = event.event_date || event.start_time;

  // Real-time odds from API (event object) or calculated from probabilities
  const displayOdds = {
    home: event.odds_home || (prob_home_win ? (100 / prob_home_win).toFixed(2) : null),
    draw: event.odds_draw || (prob_draw ? (100 / prob_draw).toFixed(2) : null),
    away: event.odds_away || (prob_away_win ? (100 / prob_away_win).toFixed(2) : null)
  };

  const hasActualScore = event.home_score !== undefined && event.away_score !== undefined && event.home_score !== null && event.away_score !== null;
  const isMatchFinished = event.status === 'Finished' || event.status === 'FT' || hasActualScore;

  let actualResult = null;
  let predictionCorrect = null;
  if (hasActualScore) {
    if (event.home_score > event.away_score) actualResult = 'H';
    else if (event.home_score < event.away_score) actualResult = 'A';
    else actualResult = 'D';

    if (predicted_result) {
      predictionCorrect = actualResult === predicted_result;
    }
  }

  const leagueLogos = [getLeagueLogoUrl(league?.api_id)];
  const homeLogos = [getTeamLogoUrl(home_team?.api_id)];
  const awayLogos = [getTeamLogoUrl(away_team?.api_id)];

  const getConfidenceColor = (conf) => {
    if (!conf) return 'bg-slate-100 text-slate-400 border-slate-200';
    if (conf >= 70) return 'bg-green-500/20 text-green-600 border-green-500/30';
    if (conf >= 50) return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
    return 'bg-red-500/20 text-red-600 border-red-500/30';
  };

  const getResultLabel = (res) => {
    if (res === 'H') return 'Home Win';
    if (res === 'D') return 'Draw';
    if (res === 'A') return 'Away Win';
    return 'Pending...';
  };

  const getResultColor = (res) => {
    if (res === 'H') return 'text-green-600';
    if (res === 'D') return 'text-yellow-600';
    if (res === 'A') return 'text-blue-600';
    return 'text-slate-400';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all group flex flex-col h-full">
      {/* Header */}
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <SmartLogo 
            urls={leagueLogos} 
            alt={league?.name} 
            className="w-4 h-4 object-contain shrink-0"
            fallbackText={league?.name || 'L'}
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
            {league?.name || 'Unknown League'}
          </span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {predicted_result && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-sm border border-purple-200 shrink-0" title="Based on ML analytics of past data">
              <Brain className="w-3 h-3" />
              <span className="hidden sm:inline">ML PREDICTED</span>
              <span className="sm:hidden">ML</span>
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0">
            {event_date ? format(new Date(event_date), 'MMM d, HH:mm') : '--:--'}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col items-center gap-2 w-[40%]">
            <SmartLogo 
              urls={homeLogos} 
              alt={home_team?.name} 
              className="w-10 h-10 object-contain"
              fallbackText={home_team?.name || 'H'}
            />
            <span className="text-sm font-bold text-slate-900 text-center line-clamp-1">
              {home_team?.name || 'Home Team'}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center w-[20%]">
            {hasActualScore ? (
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                <span className="text-lg font-bold text-white">{event.home_score}</span>
                <span className="text-sm text-slate-400">-</span>
                <span className="text-lg font-bold text-white">{event.away_score}</span>
              </div>
            ) : (
              <div className="text-[10px] font-black text-slate-300">VS</div>
            )}
            {isMatchFinished && !hasActualScore && (
              <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">FT</div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 w-[40%]">
            <SmartLogo 
              urls={awayLogos} 
              alt={away_team?.name} 
              className="w-10 h-10 object-contain"
              fallbackText={away_team?.name || 'A'}
            />
            <span className="text-sm font-bold text-slate-900 text-center line-clamp-1">
              {away_team?.name || 'Away Team'}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pick</span>
              {predictionCorrect === true && (
                <span className="bg-green-100 text-green-700 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Won</span>
              )}
              {predictionCorrect === false && (
                <span className="bg-red-100 text-red-700 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Lost</span>
              )}
            </div>
            <span className={clsx("text-sm font-black", getResultColor(predicted_result))}>
              {getResultLabel(predicted_result)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Confidence</span>
            <div className={clsx(
              "px-2 py-0.5 rounded-md text-[10px] font-black border",
              getConfidenceColor(confidence)
            )}>
              {confidence ? `${Math.round(confidence)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Goal Market Section */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center">
            <span className="text-[8px] text-slate-400 uppercase font-bold mb-1">Over 2.5</span>
            <span className="text-xs font-black text-slate-900">
              {prob_over_25 ? `${Math.round(prob_over_25)}%` : '---'}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center">
            <span className="text-[8px] text-slate-400 uppercase font-bold mb-1">BTTS</span>
            <span className="text-xs font-black text-slate-900">
              {prob_btts_yes ? `${Math.round(prob_btts_yes)}%` : '---'}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center">
            <span className="text-[8px] text-slate-400 uppercase font-bold mb-1">Score</span>
            <span className="text-xs font-black text-green-600">
              {most_likely_score || 'N/A'}
            </span>
          </div>
        </div>

        {/* Compact Odds */}
        <div className="mt-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 border border-slate-100 rounded-lg py-1 flex flex-col items-center">
              <span className="text-[8px] text-slate-400 font-bold" title="Home Win">1</span>
              <span className="text-[11px] font-bold text-slate-700">
                {displayOdds.home || '-'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg py-1 flex flex-col items-center">
              <span className="text-[8px] text-slate-400 font-bold" title="Draw">X</span>
              <span className="text-[11px] font-bold text-slate-700">
                {displayOdds.draw || '-'}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg py-1 flex flex-col items-center">
              <span className="text-[8px] text-slate-400 font-bold" title="Away Win">2</span>
              <span className="text-[11px] font-bold text-slate-700">
                {displayOdds.away || '-'}
              </span>
            </div>
          </div>
          {!displayOdds.home && (
            <div className="mt-1 text-center">
              <span className="text-[8px] text-slate-300 italic">Odds not available yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="px-4 pb-4">
        <Link 
          to={`/match/${id}`}
          state={{ prediction }}
          onClick={() => {
            hapticFeedback('light');
            saveToHistory(prediction);
          }}
          className="w-full py-2.5 bg-slate-900 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 group-hover:bg-green-500"
        >
          View Prediction
        </Link>
      </div>
    </div>
  );
}
