import React, { useState, useEffect, useMemo } from 'react';
import { trackAndResolveSignals, getSignalStats, clearLiveSignalsHistory } from '../utils/signalsEngine';
import { Zap, Clock, Target, AlertTriangle, ChevronRight, Sparkles, CheckCircle2, XCircle, ChevronDown, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

const getSignalIcon = (type) => {
  switch(type) {
    case 'GOAL_EXPECTED': return <Target className="w-5 h-5 text-red-600" />;
    case 'MOMENTUM_HOME':
    case 'MOMENTUM_AWAY': return <Zap className="w-5 h-5 text-emerald-600" />;
    case 'LATE_DRAMA': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    case 'UNDERDOG_SCORED': return <Zap className="w-5 h-5 text-red-600" />;
    case 'UNDER_GOALS': return <Zap className="w-5 h-5 text-slate-600" />;
    default: return <Zap className="w-5 h-5 text-indigo-500" />;
  }
};

const getSignalBg = (color, status) => {
  if (status === 'WON') return 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-500 group relative overflow-hidden';
  if (status === 'LOST') return 'bg-red-50/50 border-red-200 hover:border-red-400 group relative overflow-hidden opacity-80';
  
  switch(color) {
    case 'blue': return 'bg-blue-50/50 border-blue-200 hover:border-blue-400 group relative overflow-hidden';
    case 'red': return 'bg-red-50/50 border-red-200 hover:border-red-400 group relative overflow-hidden';
    case 'green': return 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 group relative overflow-hidden';
    case 'orange': return 'bg-orange-50/50 border-orange-200 hover:border-orange-400 group relative overflow-hidden';
    default: return 'bg-slate-50 border-slate-200 hover:border-slate-300 group relative overflow-hidden';
  }
};

const ConfidenceBadge = ({ percent, urgency }) => {
  let color = 'text-slate-600 bg-slate-100 border-slate-200';
  let dot = 'bg-slate-400';
  let text = urgency;
  
  if (percent >= 80) {
    color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    dot = 'bg-emerald-500';
    text = '🔥 HIGH';
  } else if (percent >= 60) {
    color = 'text-amber-700 bg-amber-50 border-amber-200';
    dot = 'bg-amber-500';
    text = 'MEDIUM';
  } else {
    color = 'text-red-700 bg-red-50 border-red-200';
    dot = 'bg-red-500';
    text = 'LOW';
  }

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className={`flex items-center w-fit gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider border shadow-sm ${color}`}>
        <span className="relative flex h-2 w-2">
          {percent >= 80 && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dot}`}></span>}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`}></span>
        </span>
        {text} ({percent}%)
      </div>
      {percent >= 80 && (
         <div className="text-[10px] text-red-600 font-bold ml-1 animate-pulse flex items-center gap-1">
           Pressure building...
         </div>
      )}
    </div>
  );
};

const StatBarCompact = ({ label, homeValue, awayValue }) => {
  const max = Math.max(Number(homeValue) || 0, Number(awayValue) || 0, 1);
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 line-clamp-1 truncate px-1">
         <span className="text-slate-700">{homeValue}</span>
         <span>{label}</span>
         <span className="text-slate-700">{awayValue}</span>
      </div>
      <div className="flex gap-1 h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
         <div className="bg-[#0F172A] rounded-l-full transition-all" style={{ width: `${Math.max(2, (Number(homeValue) / (Number(homeValue)+Number(awayValue)||1))*100)}%` }} />
         <div className="bg-blue-500 rounded-r-full transition-all" style={{ width: `${Math.max(2, (Number(awayValue) / (Number(homeValue)+Number(awayValue)||1))*100)}%` }} />
      </div>
    </div>
  );
};

const aiCache = new Map();

export default function LiveSignalsAlerts({ matches }) {
  const [aiInsights, setAiInsights] = useState({});
  const [stats, setStats] = useState({ total: 0, won: 0, lost: 0, accuracy: 0, pending: 0 });
  const [dbLoaded, setDbLoaded] = useState(false);
  
  useEffect(() => {
    const loadDb = async () => {
      const { fetchLiveSignals } = await import('../services/liveSignalsService');
      const dbSignals = await fetchLiveSignals();
      
      try {
        const stored = localStorage.getItem('tracked_signals');
        let localSignals = stored ? JSON.parse(stored) : {};
        
        // Merge DB signals into local, preferring newer timestamps if conflicts
        Object.keys(dbSignals).forEach(key => {
           if (!localSignals[key] || dbSignals[key].timestamp > localSignals[key].timestamp) {
              localSignals[key] = dbSignals[key];
           }
        });
        
        localStorage.setItem('tracked_signals', JSON.stringify(localSignals));
      } catch(e) {}
      
      setDbLoaded(true);
    };
    loadDb();
  }, []);

  const allSignals = useMemo(() => {
    // If DB isn't loaded yet, we can use local storage immediately
    console.log('Live matches total:', matches?.length);
    if (matches && matches.length > 0) {
      console.log('Sample match:', matches[0]?.home_team, matches[0]?.live_stats, 'min:', matches[0]?.current_minute);
    }
    return trackAndResolveSignals(matches || []);
  }, [matches]);

  const activeSignals = useMemo(() => allSignals.filter(item => item.signal.status === 'PENDING'), [allSignals]);
  const pastSignals = useMemo(() => allSignals.filter(item => item.signal.status !== 'PENDING').slice(0, 12), [allSignals]);


  useEffect(() => {
    setStats(getSignalStats());
  }, [matches, activeSignals]);

  useEffect(() => {
    let _isMounted = true;
    const fetchAiInsights = async () => {
      const newInsights = { ...aiInsights };
      let updated = false;

      for (const item of activeSignals) {
        if (!_isMounted) break;
        const { match, signal } = item;
        const cacheKey = `${match.id}-${Math.floor(match.current_minute / 20)}`; // Cache for 20 mins to save quota
        
        if (!aiCache.has(cacheKey)) {
          // If we recently hit a rate limit, use fallback directly
          if (window._aiRateLimitedUntil && Date.now() < window._aiRateLimitedUntil) {
             aiCache.set(cacheKey, signal.description);
             newInsights[`${match.id}-${signal.type}`] = signal.description;
             updated = true;
             continue;
          }

          try {
            await new Promise(r => setTimeout(r, 500)); // Small delay to avoid burst limits
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
            
            const liveStatsText = match.live_stats ? `
              Home Possession: ${match.live_stats.home?.ball_possession}%
              Away Possession: ${match.live_stats.away?.ball_possession}%
              Home Shots on Target: ${match.live_stats.home?.shots_on_target}
              Away Shots on Target: ${match.live_stats.away?.shots_on_target}
              Home xG: ${match.home_xg_live}
              Away xG: ${match.away_xg_live}
            ` : 'No live stats';

            const prompt = `You are a concise football analyst. Match: ${match.home_team} ${match.home_score} - ${match.away_score} ${match.away_team} at minute ${match.current_minute}.
Stats: ${liveStatsText}
Signal reason: ${signal.title}.
Output exactly 3 bullet points with ✔ starting each line explaining why this is a good bet based on stats. Max 6 words per line. Do not include intro/outro text. Prefix with "AI Insight: " before the first point.`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-1.5-flash', // More stable quota
              contents: prompt
            });

            const text = response.text;
            aiCache.set(cacheKey, text);
            newInsights[`${match.id}-${signal.type}`] = text;
            updated = true;
          } catch (e) {
            // Check if it's a rate limit / quota exceeded error
            const errStr = String(e);
            if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
               window._aiRateLimitedUntil = Date.now() + (5 * 60 * 1000); // 5 minutes cool-off
               console.warn('AI Insight Quota Exceeded. Pausing AI requests for 5 minutes.');
            } else {
               console.warn('AI Insight error (non-quota):', e.message || e);
            }
            aiCache.set(cacheKey, signal.description); 
            newInsights[`${match.id}-${signal.type}`] = signal.description;
            updated = true;
          }
        } else {
          const cachedText = aiCache.get(cacheKey);
          if (newInsights[`${match.id}-${signal.type}`] !== cachedText) {
             newInsights[`${match.id}-${signal.type}`] = cachedText;
             updated = true;
          }
        }
      }

      if (updated && _isMounted) {
        setAiInsights(newInsights);
      }
    };

    if (activeSignals.length > 0) {
      fetchAiInsights();
    }
    
    return () => { _isMounted = false; };
  }, [activeSignals]);

  if (activeSignals.length === 0 && pastSignals.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-1.5 rounded-lg">
            <Zap className="w-5 h-5 text-amber-600" fill="currentColor" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">In-Match Signals</h2>
          <span className="bg-red-500/10 text-red-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ml-1 flex items-center">
            <Sparkles className="w-3 h-3 inline-block mr-1 text-red-600 mb-0.5" />
            AI Powered
          </span>
          <span className="text-[10px] text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
            Live/Stats: {matches?.length || 0}/{matches?.filter(m => m.live_stats).length || 0}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tracker Accuracy Stats */}
          {(stats.won > 0 || stats.lost > 0) && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Accuracy</span>
                <span className="text-sm font-black text-slate-900">{stats.accuracy}%</span>
              </div>
              <div className="w-px h-8 bg-slate-100 mx-1"></div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {stats.won}
                </div>
                <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-100">
                  <XCircle className="w-3.5 h-3.5" /> {stats.lost}
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={clearLiveSignalsHistory}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            title="Clear Signal History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {activeSignals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSignals.map((item, idx) => {
            const { match, signal } = item;
            const homeName = typeof match.home_team === 'string' ? match.home_team : (match.home_team?.name || 'Home');
            const awayName = typeof match.away_team === 'string' ? match.away_team : (match.away_team?.name || 'Away');
            const slug = `${homeName}-vs-${awayName}-${match.id}`.toLowerCase().replace(/ /g, '-');
            const insight = aiInsights[`${match.id}-${signal.type}`];

            return (
              <Link 
                key={idx}
              to={`/event/${slug}?tab=events`}
              className={`block rounded-2xl border p-4 transition-all duration-300 ${getSignalBg(signal.color, signal.status)}`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    {getSignalIcon(signal.type)}
                    <span className="font-bold text-slate-900">{signal.title}</span>
                  </div>
                  {signal.confidencePercent && (
                    <ConfidenceBadge percent={signal.confidencePercent} urgency={signal.urgency} />
                  )}
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm border border-slate-200 relative">
                    {match.status === 'live' || match.current_minute > 0 ? (
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {match.current_minute}' <span className="text-[10px] text-red-600 animate-pulse ml-0.5">LIVE</span>
                  </div>
                  {signal.firedMinute && (
                    <span className="text-[10px] text-slate-500 mt-1 font-bold mr-1">Signal at {signal.firedMinute}'</span>
                  )}
                </div>
              </div>
              
              {/* Match Teams / Score */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="font-bold text-[15px] text-slate-900 truncate pr-2">
                  {homeName} vs {awayName}
                </div>
                <div className="font-bold text-[15px] bg-[#0F172A] text-white px-2.5 py-0.5 rounded-md tabular-nums shrink-0 shadow-sm border border-slate-700">
                  {match.home_score} - {match.away_score}
                </div>
              </div>

              {/* Stats & Insight */}
              <div className="bg-white/60 p-3 rounded-lg border border-slate-200/50 mb-4 relative z-10 shadow-sm">
                
                {/* Visual Stats */}
                {signal.stats && (
                   <div className="mb-3">
                      <StatBarCompact label="Dangerous Attacks" homeValue={signal.stats.hdang} awayValue={signal.stats.adang} />
                      <StatBarCompact label="Shots on Target" homeValue={signal.stats.hsot} awayValue={signal.stats.asot} />
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 bg-white/50 px-2 py-1.5 rounded-md border border-slate-100 mt-2">
                         <span>Possession: {signal.stats.hposs}% - {signal.stats.aposs}%</span>
                         <span>xG: {signal.stats.hxg} - {signal.stats.axg}</span>
                      </div>
                   </div>
                )}

                {/* AI Insight */}
                {insight ? (
                  <div className="text-[12px] text-slate-700 leading-relaxed">
                    <strong className="text-indigo-600 mb-1 flex items-center text-[11px]"><Sparkles className="w-3.5 h-3.5 inline mr-1" /> AI LIVE INSIGHT</strong>
                    <div className="whitespace-pre-line text-sm font-medium">
                        {insight.replace(/^AI Insight:\s*/i, '').trim()}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-600 line-clamp-2 leading-relaxed animate-pulse">
                    Analyzing match state...
                  </p>
                )}
              </div>
              
              {/* Recommendation Footer */}
              <div className="flex items-center justify-between bg-white/80 p-3 rounded-xl border border-white relative z-10 shadow-sm mt-auto">
                <div className="flex-1">
                  <div className="text-[13px] font-black text-slate-900 flex items-center gap-2">
                    {signal.recommendation}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform text-slate-400 group-hover:text-amber-500 shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Status Overlay */}
              {signal.status === 'WON' && (
                <div className="absolute inset-0 border-2 border-emerald-400/50 rounded-2xl pointer-events-none transition-all z-20"></div>
              )}
              {signal.status === 'LOST' && (
                <div className="absolute inset-0 bg-slate-50/50 rounded-2xl pointer-events-none transition-all z-20"></div>
              )}
              {signal.status === 'WON' && (
                <div className="absolute -right-12 top-6 rotate-45 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-1 px-12 shadow-sm pointer-events-none z-30">
                  SUCCESS
                </div>
              )}
              {signal.status === 'LOST' && (
                <div className="absolute -right-12 top-6 rotate-45 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest py-1 px-14 shadow-sm pointer-events-none z-30 opacity-90">
                  LOST
                </div>
              )}
            </Link>
          );
        })}
      </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
           <Zap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
           <div className="text-sm font-bold text-slate-600 mb-1">No Active Signals</div>
           <div className="text-xs text-slate-500">Waiting for high-probability situations in live matches...</div>
        </div>
      )}

      {/* Signal History */}
      {pastSignals.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Signal History</h3>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastSignals.map((item, idx) => {
              const { match, signal } = item;
              const homeName = typeof match.home_team === 'string' ? match.home_team : (match.home_team?.name || 'Home');
              const awayName = typeof match.away_team === 'string' ? match.away_team : (match.away_team?.name || 'Away');
              const slug = `${homeName}-vs-${awayName}-${match.id}`.toLowerCase().replace(/ /g, '-');
              
              return (
                <Link 
                  key={`history-${idx}`}
                  to={`/event/${slug}?tab=events`}
                  className={`block rounded-2xl border p-3 flex flex-col gap-2 transition-all ${signal.status === 'WON' ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' : 'bg-slate-50 border-slate-100 hover:border-slate-300 opacity-75'}`}
                >
                   <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                         {homeName} vs {awayName}
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${signal.status === 'WON' ? 'bg-emerald-200/50 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                         {signal.status === 'WON' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                         {signal.status}
                      </div>
                   </div>
                   
                   <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                         {getSignalIcon(signal.type)}
                         <span className="truncate">{signal.recommendation?.replace('⚡ LIVE EDGE: ', '')?.replace('🔥 BET NOW: ', '')?.replace('📉 BET NOW: ', '')?.replace(/ @ .*/, '')}</span>
                      </div>
                      
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 border border-slate-200 bg-white/50 px-1.5 py-0.5 rounded">
                           <Clock className="w-3 h-3" /> {signal.firedMinute || '?'}': {signal.homeScoreAtFire}-{signal.awayScoreAtFire}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="font-medium text-slate-700 bg-white/50 border border-slate-200 px-1.5 py-0.5 rounded">
                           {['FT', 'Finished', 'Ended'].includes(match.status) ? 'FT:' : `${match.current_minute}':`} {match.home_score}-{match.away_score}
                        </span>
                      </div>
                   </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
