import { Trophy, CheckCircle2, BarChart3, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getPredictions } from '../services/api';

let cachedStatsData = null;
let lastStatsFetchTime = 0;
// We allow a background API force-refresh if data is older than 2 minutes
const STATS_API_THROTTLE = 2 * 60 * 1000; 

export default function RecentSuccess() {
  const [data, setData] = useState(() => {
    if (cachedStatsData) {
      return { ...cachedStatsData, loading: false };
    }
    return {
      winningStreak: [],
      winRateByMarket: [],
      yesterdaysResults: { played: 0, won: 0, lost: 0, accuracy: '0%' },
      loading: true
    };
  });

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch data for yesterday and today
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Force refresh bypassing memory and Supabase cache to get real-time stats 
      // if it's been more than 2 minutes since the last background update
      const shouldForceRefresh = Date.now() - lastStatsFetchTime > STATS_API_THROTTLE;
      
      const predictions = await getPredictions({ 
        date_from: yesterdayStr, 
        date_to: todayStr, 
        maxPages: 20 
      }, shouldForceRefresh);
      
      if (!predictions || predictions.length === 0) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }

      // 2. Process data
      const finishedMatches = predictions.filter(p => 
        ['finished', 'Finished', 'FT', 'AET', 'PEN'].includes(p.event?.status || p.status)
      );

      // Utility to check outcomes
      const getOutcomes = (r) => {
        let hScore = r.event?.home_score;
        let aScore = r.event?.away_score;
        if (hScore === undefined || aScore === undefined || hScore === null || aScore === null) return null;
        
        hScore = Number(hScore);
        aScore = Number(aScore);
        const totalGoals = hScore + aScore;
        const result = hScore > aScore ? 'H' : (aScore > hScore ? 'A' : 'D');
        
        return {
          totalGoals,
          result,
          btts: hScore > 0 && aScore > 0
        };
      };

      // Calculate stats for Markets
      const markets = [
        { key: 'Over 1.5 Goals', condition: (p) => p.prob_over_15 >= 60, isWon: (outcomes) => outcomes.totalGoals > 1.5 },
        { key: 'BTTS', condition: (p) => p.prob_btts_yes >= 55, isWon: (outcomes) => outcomes.btts },
        { key: 'Over 2.5 Goals', condition: (p) => p.prob_over_25 >= 55, isWon: (outcomes) => outcomes.totalGoals > 2.5 },
        { key: 'Over 3.5 Goals', condition: (p) => p.prob_over_35 >= 50, isWon: (outcomes) => outcomes.totalGoals > 3.5 },
        { key: 'Straight Win', condition: (p) => ['H', 'A'].includes(p.predicted_result), isWon: (outcomes, p) => outcomes.result === p.predicted_result }
      ];

      const winRateByMarket = markets.map(market => {
        const predictedMatches = finishedMatches.filter(p => market.condition(p));
        const wonMatches = predictedMatches.filter(p => {
          const outcomes = getOutcomes(p);
          return outcomes && market.isWon(outcomes, p);
        });
        const rate = predictedMatches.length > 0 ? ((wonMatches.length / predictedMatches.length) * 100).toFixed(0) + '%' : '0%';
        return { market: market.key, rate, count: predictedMatches.length };
      }).filter(m => m.count > 0); // Only show markets with predictions

      // Calculate Yesterday's Results
      let yPlayed = 0;
      let yWon = 0;

      finishedMatches.forEach(p => {
        const outcomes = getOutcomes(p);
        if (!outcomes) return;
        
        // Only count the match if the AI had a clear, confident prediction
        const isConfidentStraightWin = (p.prob_HW >= 55 || p.prob_AW >= 55);
        const isConfidentOver25 = (p.prob_over_25 >= 60);
        const isConfidentBTTS = (p.prob_btts_yes >= 60);
        
        if (!isConfidentStraightWin && !isConfidentOver25 && !isConfidentBTTS) {
            return; // Skip matches that were too close to call
        }
        
        // Check if the confident prediction hit
        let isWon = false;
        
        if (isConfidentStraightWin && p.predicted_result === outcomes.result) {
           isWon = true;
        } else if (isConfidentOver25 && outcomes.totalGoals > 2.5) {
           isWon = true; 
        } else if (isConfidentBTTS && outcomes.btts) {
           isWon = true;
        }
        
        yPlayed++;
        if (isWon) yWon++;
      });

      const yAccuracy = yPlayed > 0 ? ((yWon / yPlayed) * 100).toFixed(1) + '%' : '0%';

      // Winning Streak (Last 3 won matches)
      // Sort finished matches by date descending
      const sortedFinished = [...finishedMatches].sort((a, b) => {
        const dateA = new Date(a.event?.event_date || a.event?.start_time || a.start_time || 0);
        const dateB = new Date(b.event?.event_date || b.event?.start_time || b.start_time || 0);
        return dateB - dateA;
      });

      const winningStreak = [];
      for (const p of sortedFinished) {
        if (winningStreak.length >= 3) break;
        const outcomes = getOutcomes(p);
        if (!outcomes) continue;

        let wonMarket = null;
        if (p.predicted_result === outcomes.result && ['H', 'A'].includes(p.predicted_result)) {
           wonMarket = `${p.predicted_result === 'H' ? 'Home' : 'Away'} Win`;
        } else if (p.prob_over_25 >= 55 && outcomes.totalGoals > 2.5) {
           wonMarket = 'Over 2.5 Goals';
        } else if (p.prob_btts_yes >= 55 && outcomes.btts) {
           wonMarket = 'BTTS: Yes';
        } else if (p.prob_over_15 >= 60 && outcomes.totalGoals > 1.5) {
           wonMarket = 'Over 1.5 Goals';
        } else if (p.prob_over_35 >= 50 && outcomes.totalGoals > 3.5) {
           wonMarket = 'Over 3.5 Goals';
        }

        if (wonMarket) {
          const homeTeamData = p.event?.home_team || p.home_team;
          const awayTeamData = p.event?.away_team || p.away_team;
          
          const homeName = typeof homeTeamData === 'string' ? homeTeamData : (homeTeamData?.name || 'Home');
          const awayName = typeof awayTeamData === 'string' ? awayTeamData : (awayTeamData?.name || 'Away');
          
          winningStreak.push({
             match: `${homeName} vs ${awayName}`,
             result: wonMarket
          });
        }
      }

      const newData = {
        winningStreak,
        winRateByMarket,
        yesterdaysResults: { played: yPlayed, won: yWon, lost: yPlayed - yWon, accuracy: yAccuracy }
      };

      cachedStatsData = newData;
      lastStatsFetchTime = Date.now();

      setData({
        ...newData,
        loading: false
      });
    }

    fetchData();
  }, []);

  if (data.loading) {
    return (
      <div className="flex justify-center items-center p-12 mt-8 bg-white rounded-3xl border border-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      {/* Recent Winning Streak */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-bold text-slate-900">Recent Winning Streak</h3>
        </div>
        {data.winningStreak.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No recent wins.</p>
        ) : (
            <ul className="space-y-3">
            {data.winningStreak.map((item, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                <span>{item.match} — {item.result}</span>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                </li>
            ))}
            </ul>
        )}
        <p className="text-xs text-slate-400 mt-4">👉 Last 24 hours performance</p>
      </div>

      {/* Win Rate by Market */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-slate-900">Recent AI Performance <span className="text-sm font-normal text-slate-500">(Last 24 Hours)</span></h3>
        </div>
        <div className="space-y-3">
          {data.winRateByMarket.length === 0 ? (
            <p className="text-sm text-slate-500 italic">Not enough match data recently.</p>
          ) : (
             data.winRateByMarket.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{item.market}</span>
                <span className="font-bold text-green-600">{item.rate}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Yesterday's Results */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-slate-900">Results Breakdown <span className="text-sm font-normal text-slate-500">(Last 24 Hours)</span></h3>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 p-3 rounded-xl text-center">
            <p className="text-xs text-slate-500">Played</p>
            <p className="text-xl font-black">{data.yesterdaysResults.played}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl text-center">
            <p className="text-xs text-green-700">Won</p>
            <p className="text-xl font-black text-green-600">{data.yesterdaysResults.won}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Accuracy: <span className="text-green-600">{data.yesterdaysResults.accuracy}</span></p>
        </div>
      </div>
    </div>
  );
}
