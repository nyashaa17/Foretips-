import { useState, useEffect, useMemo, lazy, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getPredictions, getMemoryCache, getPredictionsCacheKey } from '../services/api';
import { getLiveMatches } from '../services/bsdApi';
import { filterYesterdayMatches, filterTodayMatches, filterTomorrowMatches } from '../utils/dateFilters';
import PredictionCard from '../components/PredictionCard';
import { PredictionSkeleton } from '../components/LoadingSkeleton';
import FAQSection from '../components/FAQSection';
import { TrendingUp, Activity, ChevronRight, Star, Calendar, Trophy, MessageCircle, Zap, Users, Medal, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { hapticFeedback } from '../utils/haptics';
import SEO from '../components/SEO';
import clsx from 'clsx';
import { MotionCard } from '../components/MotionCard';

const LiveSignalsAlerts = lazy(() => import('../components/LiveSignalsAlerts'));

export default function Home() {
  const [dateFilter, setDateFilter] = useState('today'); // 'yesterday', 'today', 'tomorrow'
  
  const [predictions, setPredictions] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const predictionsRef = useRef(null);

  const fetchLive = async () => {
    try {
      const data = await getLiveMatches();
      setLiveMatches(data);
    } catch (err) {
      console.error('Error fetching live matches:', err);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(() => {
      fetchLive();
    }, 30000); // Auto refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);


  const loadPredictions = async (filter) => {
    try {
      const date = new Date();
      if (filter === 'yesterday') {
        date.setDate(date.getDate() - 1);
      } else if (filter === 'tomorrow') {
        date.setDate(date.getDate() + 1);
      }
      const dateStr = date.toISOString().split('T')[0];
      
      const params = { date_from: dateStr, date_to: dateStr, maxPages: 2 };

      const cacheKey = getPredictionsCacheKey(params);
      const cached = getMemoryCache(cacheKey);
      
      // Only show loading state if we don't have cached data
      if (!cached) {
        setLoading(true);
      }
      setError(null);

      const predsData = await getPredictions(params);
      setPredictions(predsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load data. Please try again later.');
      console.error('Error loading predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions(dateFilter);
  }, [dateFilter]);

  const featuredPredictions = useMemo(() => {
    if (!Array.isArray(predictions)) return [];
    let result = [...predictions];

    // Sort by Major Leagues and High Confidence
    const MAJOR_LEAGUES = ['premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'champions league', 'europa league', 'world cup'];
    
    result.sort((a, b) => {
      const getLeagueName = (match) => {
        const l = match.event?.league || match.league;
        if (typeof l === 'string') return l.toLowerCase();
        if (l && typeof l === 'object' && l.name) return String(l.name).toLowerCase();
        return String(l || '').toLowerCase();
      };

      const aLeague = getLeagueName(a);
      const bLeague = getLeagueName(b);
      const aIsMajor = MAJOR_LEAGUES.some(l => aLeague.includes(l)) ? 1 : 0;
      const bIsMajor = MAJOR_LEAGUES.some(l => bLeague.includes(l)) ? 1 : 0;
      
      // Boost major leagues (+15), then sort by confidence
      const aScore = (a.confidence || 0) + (aIsMajor * 15);
      const bScore = (b.confidence || 0) + (bIsMajor * 15);
      
      return bScore - aScore;
    });

    // Take top 10 featured matches
    return result.slice(0, 10);
  }, [predictions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <SEO 
        title="Data-Driven Football Predictions & Betting Tips" 
        description="Get accurate football match predictions, advanced analysis, and data-driven insights to help you make smarter bets."
        keywords="football predictions, betting tips, soccer predictions, match analysis, data-driven football, sports betting, live scores, football stats"
      />
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-none border border-slate-100"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating Orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-24 -right-24 w-96 h-96 bg-green-400 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, -50, 0],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-400 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              x: [0, 30, 0],
              y: [0, -30, 0],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-blue-300 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-6 border border-green-100"
          >
            <Star className="w-4 h-4" />
            <span>#1 Football Prediction Platform</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight"
          >
            Free AI-Powered <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
              Football Tips
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg text-slate-600 mb-8 max-w-xl mx-auto"
          >
            Free daily AI football predictions, advanced match analysis, and data-driven insights to help you make smarter bets.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap justify-center items-center gap-2 sm:gap-3 w-full max-w-xs sm:max-w-none mx-auto"
          >
            <span className="bg-slate-50 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-700 border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" /> Daily Free tips
            </span>
            <span className="bg-slate-50 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-700 border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" /> Instant updates
            </span>
            <span className="bg-slate-50 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-700 border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" /> AI powered
            </span>
            <span className="bg-slate-50 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-700 border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap">
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" /> Low data usage
            </span>
          </motion.div>
        </div>
      </motion.div>
      
      <Suspense fallback={<div className="w-full max-w-xl mx-auto aspect-square bg-slate-100 animate-pulse rounded-[2rem] my-12"></div>}>
        <LiveSignalsAlerts matches={liveMatches} />
      </Suspense>

      
      <section ref={predictionsRef}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-xl shrink-0 shadow-sm">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Featured Predictions
            </h2>
          </div>
          <Link to="/predictions" className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1 shrink-0 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Controls */}
        <div className="mb-8 flex justify-center w-full">
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto overflow-x-auto">
            <button 
              onClick={() => setDateFilter('yesterday')}
              className={clsx("flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl text-sm sm:text-base font-bold transition-all whitespace-nowrap", dateFilter === 'yesterday' ? "bg-slate-900 text-white shadow-md" : "bg-transparent text-slate-600 hover:bg-slate-100")}
            >
              Yesterday
            </button>
            <button 
              onClick={() => setDateFilter('today')}
              className={clsx("flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl text-sm sm:text-base font-bold transition-all whitespace-nowrap", dateFilter === 'today' ? "bg-slate-900 text-white shadow-md" : "bg-transparent text-slate-600 hover:bg-slate-100")}
            >
              Today
            </button>
            <button 
              onClick={() => setDateFilter('tomorrow')}
              className={clsx("flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl text-sm sm:text-base font-bold transition-all whitespace-nowrap", dateFilter === 'tomorrow' ? "bg-slate-900 text-white shadow-md" : "bg-transparent text-slate-600 hover:bg-slate-100")}
            >
              Tomorrow
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => <PredictionSkeleton key={i} />)
              ) : featuredPredictions.length > 0 ? (
                featuredPredictions.map((prediction, index) => (
                  <PredictionCard key={`${prediction.id}-${index}`} prediction={prediction} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No featured predictions available for this date.</p>
                </div>
              )}
            </div>
            
            {/* View All Predictions Button */}
            {!loading && (
              <div className="flex justify-center mt-10">
                <Link 
                  to="/predictions" 
                  onClick={() => hapticFeedback('medium')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  View All Predictions <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FAQSection />
      </section>
    </div>
  );
}
