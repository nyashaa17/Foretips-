import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getEventDetails, getPredictionDetails, getPredictionByEventId, getPlayerStats, getPredictedLineup, getOddsCompare, getImageUrl } from '../services/bsdApi';
import { saveToHistory } from '../services/api';
import { format } from 'date-fns';
import { ChevronLeft, TrendingUp, Activity, Target, Shield, Sparkles, Trophy, Clock, Info, Flag, Users } from 'lucide-react';
import SEO from '../components/SEO';
import clsx from 'clsx';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../supabaseClient';
import { AdPlacement } from '../components/AdPlacement';
import ReactMarkdown from 'react-markdown';
import NotFound from './NotFound';

import SmartLogo from '../components/SmartLogo';
import MatchSpatialData from '../components/MatchSpatialData';
import OddsComparison from '../components/OddsComparison';
import PlayerStatsTable from '../components/PlayerStatsTable';
import PredictedLineup from '../components/PredictedLineup';
import TeamForm from '../components/TeamForm';
import HeadToHead from '../components/HeadToHead';
import MatchLineups from '../components/MatchLineups';

const StatBar = ({ label, home, away, type = 'percentage' }) => {
  const homeVal = parseFloat(home) || 0;
  const awayVal = parseFloat(away) || 0;
  const total = homeVal + awayVal;
  const homePercent = total > 0 ? (homeVal / total) * 100 : 50;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
        <span>{home}{type === 'percentage' ? '%' : ''}</span>
        <span>{label}</span>
        <span>{away}{type === 'percentage' ? '%' : ''}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
        <div 
          className="h-full bg-green-500 transition-all duration-500" 
          style={{ width: `${homePercent}%` }} 
        />
        <div 
          className="h-full bg-blue-500 transition-all duration-500" 
          style={{ width: `${100 - homePercent}%` }} 
        />
      </div>
    </div>
  );
};

export default function MatchDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrediction = location.state?.prediction || null;
  
  const [match, setMatch] = useState(initialPrediction);
  const [eventDetails, setEventDetails] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [predictedLineup, setPredictedLineup] = useState(null);
  const [oddsCompare, setOddsCompare] = useState(null);
  const [loading, setLoading] = useState(!initialPrediction);
  const [error, setError] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        if (!initialPrediction) setLoading(true);
        
        const isEventRoute = location.pathname.startsWith('/event/');
        let data = null;
        let eventId = null;
        
        if (isEventRoute) {
          data = await getPredictionByEventId(id);
          eventId = id;
        } else {
          // It's a prediction ID, but we need to fetch it to get the event ID
          data = await getPredictionDetails(id);
          eventId = data?.event?.id || data?.event?.api_id;
        }

        // Fallback to initialPrediction if API returns null
        if (!data && initialPrediction) {
          data = initialPrediction;
          eventId = data.event?.id || data.event?.api_id;
        }

        if (!data && !eventId) {
          setError('Match details not found.');
          setMatch(null);
        } else {
          if (data) {
            setMatch(data);
            if (!isEventRoute || data.id) {
              saveToHistory(data);
            }
            if (data.id) {
              generateAiAnalysis(data);
            }
          }
          
          if (eventId) {
            try {
              // Fetch comprehensive event details
              const fullEventData = await getEventDetails(eventId);
              if (fullEventData) {
                setEventDetails(fullEventData);
                
                // If not started, fetch predicted lineup
                if (fullEventData.status === 'notstarted' || fullEventData.status === 'NS') {
                  const lineupData = await getPredictedLineup(fullEventData.api_id).catch(() => null);
                  setPredictedLineup(lineupData);
                }
              }
              
              const pStatsData = await getPlayerStats(eventId).catch(() => null);
              if (pStatsData?.results) {
                setPlayerStats(pStatsData.results);
              }
              
              const oddsData = await getOddsCompare(eventId).catch(() => null);
              if (oddsData?.results) {
                setOddsCompare(oddsData.results);
              } else if (Array.isArray(oddsData)) {
                setOddsCompare(oddsData);
              }
            } catch (e) {
              console.warn('Failed to fetch comprehensive event details:', e);
            }
          }
        }
      } catch (err) {
        if (!initialPrediction) setError(err.message || 'Failed to load match details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id, initialPrediction, location.pathname]);

  const generateAiAnalysis = async (matchData) => {
    if (!matchData) return;
    
    const cacheKey = `ai_analysis_${matchData.id || id}`;
    
    // 1. Check cache
    try {
      const { data: cached, error: cacheError } = await supabase
        .from('api_cache')
        .select('data')
        .eq('key', cacheKey)
        .single();
        
      if (cached && !cacheError) {
        setAiAnalysis(cached.data);
        return;
      }
    } catch (e) {
      console.warn('AI analysis cache check failed:', e.message);
    }

    // 2. Generate if not in cache
    try {
      setAnalyzing(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const homeTeam = typeof matchData.event?.home_team === 'string' ? matchData.event.home_team : (matchData.event?.home_team_obj?.name || matchData.event?.home_team?.name || 'Home Team');
      const awayTeam = typeof matchData.event?.away_team === 'string' ? matchData.event.away_team : (matchData.event?.away_team_obj?.name || matchData.event?.away_team?.name || 'Away Team');
      const league = typeof matchData.event?.league === 'string' ? matchData.event.league : (matchData.event?.league?.name || matchData.event?.league_name || 'League');
      
      const prompt = `As a professional football analyst, provide a detailed but concise analysis (max 60 words) for ${homeTeam} vs ${awayTeam} in the ${league}. 
      Consider these stats:
      - ${homeTeam} win probability: ${matchData.prob_home_win}%
      - Draw probability: ${matchData.prob_draw}%
      - ${awayTeam} win probability: ${matchData.prob_away_win}%
      - Confidence level: ${matchData.confidence}%
      - Predicted score: ${matchData.most_likely_score}
      - Over 2.5 Goals probability: ${matchData.prob_over_25}%
      - Both Teams to Score probability: ${matchData.prob_btts_yes}%
      
      Structure the response with:
      1. Key Insight: (One sentence on the tactical matchup)
      2. Betting Value: (Where the best value lies based on probabilities vs odds)
      3. Final Verdict: (The most likely outcome)`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const analysis = response.text;
      setAiAnalysis(analysis);

      // 3. Save to cache
      await supabase.from('api_cache').upsert({
        key: cacheKey,
        data: analysis,
        created_at: new Date().toISOString()
      }, { onConflict: 'key' });

    } catch (err) {
      console.error('AI Analysis failed:', err);
      setAiAnalysis('AI analysis is currently unavailable for this match.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-slate-200 rounded-lg mb-6"></div>
          <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-96 bg-slate-50 rounded-2xl border border-slate-200"></div>
            <div className="h-96 bg-slate-50 rounded-2xl border border-slate-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return <NotFound />;
  }

  const event = match.event || match;
  
  // Safely extract league
  const league = typeof event.league === 'string' 
    ? { name: event.league, id: event.league } 
    : (event.league || { name: event.league_name || 'Unknown League', id: event.league?.id || event.league_short, api_id: event.league?.api_id });
    
  // Safely extract home team
  const rawHome = event.home_team_obj || event.home_team;
  const home_team = typeof rawHome === 'string' 
    ? { name: rawHome, id: rawHome } 
    : (rawHome ? { ...rawHome, id: rawHome.id || rawHome.team_id, api_id: rawHome.api_id } : { name: 'Home Team' });
    
  // Safely extract away team
  const rawAway = event.away_team_obj || event.away_team;
  const away_team = typeof rawAway === 'string' 
    ? { name: rawAway, id: rawAway } 
    : (rawAway ? { ...rawAway, id: rawAway.id || rawAway.team_id, api_id: rawAway.api_id } : { name: 'Away Team' });
    
  const event_date = event.event_date || event.start_time;
  const { status, home_score, away_score } = event;
  const prediction = match.predictions?.[0] || match.prediction || (match.predicted_result ? match : null);

  const seoTitle = `${home_team?.name} vs ${away_team?.name} Prediction & Analysis`;
  const seoDescription = `Expert prediction and statistical analysis for ${home_team?.name} vs ${away_team?.name} in the ${league?.name}. Get win probabilities, predicted score, and AI-driven insights.`;

  const homeLogos = [getImageUrl('team', home_team?.api_id)];
  const awayLogos = [getImageUrl('team', away_team?.api_id)];
  const leagueLogos = [getImageUrl('league', league?.api_id)];

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
    return 'Unknown';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO title={seoTitle} description={seoDescription} />
      <button onClick={handleBack} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to Predictions
      </button>

      {/* Match Header */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-8 shadow-sm">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmartLogo 
              urls={leagueLogos} 
              alt={league?.name} 
              className="w-6 h-6 object-contain"
              fallbackText={league?.name || 'L'}
            />
            <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {league?.name}
            </span>
          </div>
          <span className="text-sm text-slate-500 font-medium">
            {event_date ? format(new Date(event_date), 'EEEE, MMM d, yyyy • HH:mm') : '--:--'}
          </span>
        </div>

        <div className="p-8 md:p-12 flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 pointer-events-none"></div>
          
          <div className="flex flex-col items-center gap-4 w-1/3 relative z-10">
            <SmartLogo 
              urls={homeLogos} 
              alt={home_team?.name} 
              className="w-16 h-16 md:w-24 md:h-24 object-contain"
              fallbackText={home_team?.name || 'H'}
            />
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 text-center">{home_team?.name}</h2>
          </div>
          
          <div className="flex flex-col items-center justify-center w-1/3 relative z-10">
            {status === 'NS' ? (
              <div className="text-2xl md:text-4xl font-black text-slate-400 uppercase tracking-widest">VS</div>
            ) : (
              <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 shadow-inner">
                <span className="text-4xl md:text-5xl font-black text-slate-900">{home_score}</span>
                <span className="text-xl text-slate-400">-</span>
                <span className="text-4xl md:text-5xl font-black text-slate-900">{away_score}</span>
              </div>
            )}
            {status === 'LIVE' && (
              <span className="mt-4 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold uppercase tracking-widest rounded-full animate-pulse border border-red-200">
                Live Now
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 w-1/3 relative z-10">
            <SmartLogo 
              urls={awayLogos} 
              alt={away_team?.name} 
              className="w-16 h-16 md:w-24 md:h-24 object-contain"
              fallbackText={away_team?.name || 'A'}
            />
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 text-center">{away_team?.name}</h2>
          </div>
        </div>

        {/* Coaches and Referee */}
        {(eventDetails?.home_coach || eventDetails?.away_coach || eventDetails?.referee) && (
          <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
            <div className="flex-1 text-center sm:text-left">
              {eventDetails?.home_coach && (
                <span className="font-medium"><span className="text-slate-400">Coach:</span> {eventDetails.home_coach.name || eventDetails.home_coach}</span>
              )}
            </div>
            
            <div className="flex-1 text-center flex items-center justify-center gap-2">
              {eventDetails?.referee && (
                <>
                  <span className="font-medium"><span className="text-slate-400">Ref:</span> {eventDetails.referee.name || eventDetails.referee}</span>
                  {(eventDetails.referee.yellow_cards !== undefined || eventDetails.referee.red_cards !== undefined) && (
                    <div className="flex items-center gap-1 ml-2">
                      {eventDetails.referee.yellow_cards > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                          <span className="w-2 h-3 bg-yellow-400 rounded-sm"></span> {eventDetails.referee.yellow_cards}
                        </span>
                      )}
                      {eventDetails.referee.red_cards > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                          <span className="w-2 h-3 bg-red-500 rounded-sm"></span> {eventDetails.referee.red_cards}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex-1 text-center sm:text-right">
              {eventDetails?.away_coach && (
                <span className="font-medium"><span className="text-slate-400">Coach:</span> {eventDetails.away_coach.name || eventDetails.away_coach}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <AdPlacement position="in-article" />

      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Main Prediction */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Match Prediction</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-slate-500 mb-1">Predicted Result</span>
                  <span className="text-2xl font-bold text-slate-900">{getResultLabel(prediction.predicted_result)}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-slate-500 mb-1">Confidence</span>
                  <div className={clsx("px-3 py-1 rounded-full text-sm font-bold border mt-1", getConfidenceColor(prediction.confidence))}>
                    {Math.round(prediction.confidence)}%
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Win Probabilities</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="w-24 text-sm font-medium text-slate-900">Home Win</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full mx-4 overflow-hidden border border-slate-200">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.round(prediction.prob_home_win)}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-green-600">{Math.round(prediction.prob_home_win)}%</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-sm font-medium text-slate-900">Draw</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full mx-4 overflow-hidden border border-slate-200">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.round(prediction.prob_draw)}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-yellow-600">{Math.round(prediction.prob_draw)}%</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-sm font-medium text-slate-900">Away Win</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full mx-4 overflow-hidden border border-slate-200">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round(prediction.prob_away_win)}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-blue-600">{Math.round(prediction.prob_away_win)}%</span>
                </div>
              </div>

              {/* Odds */}
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-8 mb-4">Match Odds (1X2)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-slate-500 mb-1">1 (Home)</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {event.odds_home || (prediction.prob_home_win ? (100 / prediction.prob_home_win).toFixed(2) : '---')}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-slate-500 mb-1">X (Draw)</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {event.odds_draw || (prediction.prob_draw ? (100 / prediction.prob_draw).toFixed(2) : '---')}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-slate-500 mb-1">2 (Away)</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {event.odds_away || (prediction.prob_away_win ? (100 / prediction.prob_away_win).toFixed(2) : '---')}
                  </span>
                </div>
              </div>

              {!event.odds_home && !prediction.prob_home_win && (
                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-amber-600 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-amber-900">Odds are Warming Up!</h5>
                    <p className="text-xs text-amber-700">Our bookmakers are currently crunching the numbers. Real-time odds will appear here as soon as they're live.</p>
                  </div>
                </div>
              )}

              {(event.odds_over_25 || event.odds_btts_yes || event.odds_over_15 || event.odds_over_35) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block text-center">Over/Under 1.5 Odds</span>
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Over</span>
                        <span className="text-lg font-bold text-slate-900">{event.odds_over_15 || '---'}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Under</span>
                        <span className="text-lg font-bold text-slate-900">{event.odds_under_15 || '---'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block text-center">Over/Under 2.5 Odds</span>
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Over</span>
                        <span className="text-lg font-bold text-slate-900">{event.odds_over_25 || '---'}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Under</span>
                        <span className="text-lg font-bold text-slate-900">{event.odds_under_25 || '---'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block text-center">Over/Under 3.5 Odds</span>
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Over</span>
                        <span className="text-lg font-bold text-slate-900">{event.odds_over_35 || '---'}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Under</span>
                        <span className="text-lg font-bold text-slate-900">{event.odds_under_35 || '---'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block text-center">BTTS Odds</span>
                    <div className="flex justify-between">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">Yes</span>
                        <span className="text-lg font-bold text-slate-900">{event.odds_btts_yes || '---'}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-400">No</span>
                        <span className="text-lg font-bold text-slate-900">{event.odds_btts_no || '---'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                  <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400 font-medium">Secondary markets (O/U, BTTS) are taking a breather. <br/> They'll be back on the field shortly!</p>
                </div>
              )}
            </div>

            {/* AI Analysis */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-green-600" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">AI Analysis Overview</h3>
              </div>
              
              {analyzing ? (
                <div className="flex flex-col items-center py-8 gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                  <p className="text-sm text-slate-500 animate-pulse">Generating expert insights...</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none prose-sm md:prose-base prose-p:leading-relaxed prose-headings:mb-2 prose-headings:mt-4">
                  <ReactMarkdown>
                    {aiAnalysis}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Match Stats */}
            {(match.stats || eventDetails?.statistics) && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-slate-900 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Match Stats</h3>
                </div>
                <div className="space-y-6">
                  <StatBar 
                    label="Possession" 
                    home={match.stats?.possession?.home || eventDetails?.statistics?.possession?.home || 0} 
                    away={match.stats?.possession?.away || eventDetails?.statistics?.possession?.away || 0} 
                  />
                  <StatBar 
                    label="Shots on Target" 
                    home={match.stats?.shots_on_target?.home || eventDetails?.statistics?.shots_on_target?.home || 0} 
                    away={match.stats?.shots_on_target?.away || eventDetails?.statistics?.shots_on_target?.away || 0} 
                    type="count"
                  />
                  <StatBar 
                    label="Total Shots" 
                    home={match.stats?.total_shots?.home || eventDetails?.statistics?.total_shots?.home || 0} 
                    away={match.stats?.total_shots?.away || eventDetails?.statistics?.total_shots?.away || 0} 
                    type="count"
                  />
                  <StatBar 
                    label="Corners" 
                    home={match.stats?.corners?.home || eventDetails?.statistics?.corners?.home || 0} 
                    away={match.stats?.corners?.away || eventDetails?.statistics?.corners?.away || 0} 
                    type="count"
                  />
                  <StatBar 
                    label="Fouls" 
                    home={match.stats?.fouls?.home || eventDetails?.statistics?.fouls?.home || 0} 
                    away={match.stats?.fouls?.away || eventDetails?.statistics?.fouls?.away || 0} 
                    type="count"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Goals & Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Goals Market</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-600">Over 1.5 Goals</span>
                  <span className="font-bold text-slate-900">{Math.round(prediction.prob_over_15 || 0)}%</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-600">Over 2.5 Goals</span>
                  <span className="font-bold text-slate-900">{Math.round(prediction.prob_over_25 || 0)}%</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-600">Over 3.5 Goals</span>
                  <span className="font-bold text-slate-900">{Math.round(prediction.prob_over_35 || 0)}%</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-600">Both Teams to Score</span>
                  <span className="font-bold text-slate-900">{Math.round(prediction.prob_btts_yes || 0)}%</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-600">Most Likely Score</span>
                  <span className="font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded">{prediction.most_likely_score}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Expected Goals (xG)</h3>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {eventDetails?.home_xg_live != null ? Number(eventDetails.home_xg_live).toFixed(2) : (prediction.expected_home_goals != null ? Number(prediction.expected_home_goals).toFixed(2) : '---')}
                  </span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Home xG</span>
                </div>
                <div className="h-12 w-px bg-slate-200 mb-2"></div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {eventDetails?.away_xg_live != null ? Number(eventDetails.away_xg_live).toFixed(2) : (prediction.expected_away_goals != null ? Number(prediction.expected_away_goals).toFixed(2) : '---')}
                  </span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Away xG</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Sections */}
      <div className="mt-8 space-y-8">
        {eventDetails?.home_form || eventDetails?.away_form ? (
          <TeamForm 
            homeTeam={home_team?.name} 
            awayTeam={away_team?.name} 
            homeForm={eventDetails.home_form} 
            awayForm={eventDetails.away_form} 
          />
        ) : null}

        {eventDetails?.head_to_head ? (
          <HeadToHead 
            h2h={eventDetails.head_to_head} 
            homeTeam={home_team?.name} 
            awayTeam={away_team?.name} 
          />
        ) : null}

        {eventDetails?.lineups ? (
          <MatchLineups 
            lineups={eventDetails.lineups} 
            homeTeam={home_team?.name} 
            awayTeam={away_team?.name} 
          />
        ) : (
          <PredictedLineup lineup={predictedLineup} />
        )}

        <MatchSpatialData event={eventDetails} />
        <PlayerStatsTable stats={playerStats} />
        <OddsComparison odds={oddsCompare} />
      </div>

    </div>
  );
}
