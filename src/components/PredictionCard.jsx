import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { saveToHistory } from '../services/api';
import { isValueBet, getImageUrl } from '../services/bsdApi';
import { hapticFeedback } from '../utils/haptics';
import { getPreviewUrl } from '../utils/image';
import clsx from 'clsx';
import { Brain, Share2, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { supabase } from '../supabaseClient';
import { GoogleGenAI } from "@google/genai";

import SmartLogo from './SmartLogo';

export default function PredictionCard({ prediction }) {
  const cardRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

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

  const hasActualScore = event.home_score !== undefined && event.away_score !== undefined && event.home_score !== null && event.away_score !== null;
  const isMatchFinished = ['finished', 'Finished', 'FT', 'AET', 'PEN'].includes(event.status);
  const isMatchLive = ['inprogress', '1st_half', 'halftime', '2nd_half', 'LIVE', 'HT'].includes(event.status);

  // Real-time odds from API (event object) or calculated from probabilities
  // If match is finished, prefer the pre-match odds stored in the prediction object if available
  const displayOdds = {
    home: (isMatchFinished && prediction.odds_home) ? prediction.odds_home : (event.odds_home || (prob_home_win ? (100 / prob_home_win).toFixed(2) : null)),
    draw: (isMatchFinished && prediction.odds_draw) ? prediction.odds_draw : (event.odds_draw || (prob_draw ? (100 / prob_draw).toFixed(2) : null)),
    away: (isMatchFinished && prediction.odds_away) ? prediction.odds_away : (event.odds_away || (prob_away_win ? (100 / prob_away_win).toFixed(2) : null))
  };

  let actualResult = null;
  let predictionCorrect = null;
  if (hasActualScore && isMatchFinished) {
    if (event.home_score > event.away_score) actualResult = 'H';
    else if (event.home_score < event.away_score) actualResult = 'A';
    else actualResult = 'D';

    if (predicted_result) {
      predictionCorrect = actualResult === predicted_result;
    }
  }

  const leagueLogos = [getImageUrl('league', league?.api_id)];
  const homeLogos = [getImageUrl('team', home_team?.api_id)];
  const awayLogos = [getImageUrl('team', away_team?.api_id)];

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

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    hapticFeedback('light');
    
    const homeName = home_team?.name || 'Home Team';
    const awayName = away_team?.name || 'Away Team';
    const leagueName = league?.name || 'League';
    
    if (!cardRef.current) {
      const fallbackText = `🏆 Foretips Prediction\n⚽ ${homeName} vs ${awayName}\n\nCheck out full details here: ${window.location.origin}/match/${id}`;
      const url = `https://wa.me/?text=${encodeURIComponent(fallbackText)}`;
      window.open(url, '_blank');
      return;
    }

    try {
      setIsSharing(true);
      
      // 1. Try to get AI Analysis from cache or generate it
      let aiAnalysisText = '';
      const cacheKey = `ai_analysis_${id}`;
      
      try {
        const { data: cached } = await supabase
          .from('api_cache')
          .select('data')
          .eq('key', cacheKey)
          .single();
          
        if (cached && cached.data) {
          aiAnalysisText = cached.data;
        } else {
          // Generate on the fly if not cached
          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
          const model = "gemini-3-flash-preview";
          
          const prompt = `As a professional football analyst, provide a detailed but concise analysis (max 60 words) for ${homeName} vs ${awayName} in the ${leagueName}. 
          Consider these stats:
          - ${homeName} win probability: ${prob_home_win}%
          - Draw probability: ${prob_draw}%
          - ${awayName} win probability: ${prob_away_win}%
          - Confidence level: ${confidence}%
          - Predicted score: ${most_likely_score}
          - Over 2.5 Goals probability: ${prob_over_25}%
          - Both Teams to Score probability: ${prob_btts_yes}%
          
          Structure the response with:
          1. Key Insight: (One sentence on the tactical matchup)
          2. Betting Value: (Where the best value lies based on probabilities vs odds)
          3. Final Verdict: (The most likely outcome)`;

          const response = await ai.models.generateContent({
            model,
            contents: prompt,
          });

          aiAnalysisText = response.text;
          
          // Save to cache in background
          supabase.from('api_cache').upsert({ 
            key: cacheKey, 
            data: aiAnalysisText,
            updated_at: new Date().toISOString()
          }).then();
        }
      } catch (err) {
        console.warn('Could not fetch or generate AI analysis for sharing:', err);
      }

      const captionText = `🏆 Foretips Prediction\n⚽ ${homeName} vs ${awayName}\n\n${aiAnalysisText ? `🤖 AI Analysis:\n${aiAnalysisText}\n\n` : ''}Check out full details here: ${window.location.origin}/match/${id}`;
      
      // Capture the card as a blob using html-to-image
      const blob = await htmlToImage.toBlob(cardRef.current, {
        quality: 1,
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Higher quality
      });

      if (!blob) throw new Error('Failed to create image blob');
      
      const file = new File([blob], `foretips-${homeName}-vs-${awayName}.png`, { type: 'image/png' });
      
      // Check if Web Share API is supported and can share files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Foretips Prediction',
            text: captionText,
          });
        } catch (shareError) {
          console.log('Error sharing via Web Share API:', shareError);
          // Fallback to text only if user cancels or it fails
          if (shareError.name !== 'AbortError') {
            const url = `https://wa.me/?text=${encodeURIComponent(captionText)}`;
            window.open(url, '_blank');
          }
        }
      } else {
        // Fallback for desktop/unsupported browsers: Download image and open WhatsApp Web
        const link = document.createElement('a');
        link.download = `foretips-${homeName}-vs-${awayName}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        
        // Copy text to clipboard for convenience
        try {
          await navigator.clipboard.writeText(captionText);
          alert('Image downloaded and text copied to clipboard! You can now paste it into WhatsApp.');
        } catch (err) {
          // Just open WhatsApp with text
          const url = `https://wa.me/?text=${encodeURIComponent(captionText)}`;
          window.open(url, '_blank');
        }
      }
      setIsSharing(false);
      
    } catch (error) {
      console.error('Error generating image:', error);
      setIsSharing(false);
      const fallbackText = `🏆 Foretips Prediction\n⚽ ${homeName} vs ${awayName}\n\nCheck out full details here: ${window.location.origin}/match/${id}`;
      const url = `https://wa.me/?text=${encodeURIComponent(fallbackText)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all group flex flex-col h-full">
      <div ref={cardRef} className="flex flex-col flex-1 bg-white">
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
            {isMatchFinished && (
              <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">FT</div>
            )}
            {isMatchLive && (
              <div className="text-[9px] font-bold text-red-500 mt-1 uppercase tracking-wider animate-pulse">
                {event.current_minute ? `${event.current_minute}'` : 'LIVE'}
              </div>
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
              {(confidence >= 75 || (predicted_result === 'H' && isValueBet(prob_home_win, displayOdds.home)) || (predicted_result === 'A' && isValueBet(prob_away_win, displayOdds.away))) && (
                <span className="bg-green-100 text-green-700 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1">
                  TIP
                </span>
              )}
              {isMatchFinished && predictionCorrect === true && (
                <span className="bg-green-100 text-green-700 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Won</span>
              )}
              {isMatchFinished && predictionCorrect === false && (
                <span className="bg-red-100 text-red-700 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Lost</span>
              )}
              {isMatchLive && (
                <span className="bg-blue-100 text-blue-700 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  In Play
                </span>
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
            <span className="text-[8px] text-slate-400 uppercase font-bold mb-1">Over 1.5</span>
            <span className="text-xs font-black text-slate-900">
              {prediction.prob_over_15 ? `${Math.round(prediction.prob_over_15)}%` : '---'}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center">
            <span className="text-[8px] text-slate-400 uppercase font-bold mb-1">Over 2.5</span>
            <span className="text-xs font-black text-slate-900">
              {prob_over_25 ? `${Math.round(prob_over_25)}%` : '---'}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center">
            <span className="text-[8px] text-slate-400 uppercase font-bold mb-1">Over 3.5</span>
            <span className="text-xs font-black text-slate-900">
              {prediction.prob_over_35 ? `${Math.round(prediction.prob_over_35)}%` : '---'}
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
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col items-center justify-center">
            <span className="text-[8px] text-slate-400 uppercase font-bold mb-1" title="Expected Goals (xG) - A measure of the quality of goalscoring chances">xG</span>
            <span className="text-[10px] font-black text-slate-900 whitespace-nowrap">
              {prediction.expected_home_goals != null ? `${Number(prediction.expected_home_goals).toFixed(1)} - ${Number(prediction.expected_away_goals).toFixed(1)}` : '---'}
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
      </div>

      {/* Action */}
      <div className="px-4 pb-4 flex gap-2">
        <Link 
          to={`/match/${id}`}
          state={{ prediction }}
          onClick={() => {
            hapticFeedback('light');
            saveToHistory(prediction);
          }}
          className="flex-1 py-2.5 bg-slate-900 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 group-hover:bg-green-500"
        >
          View Prediction
        </Link>
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="w-10 h-10 shrink-0 bg-slate-100 hover:bg-[#25D366] hover:text-white text-slate-500 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Share to WhatsApp"
        >
          {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
