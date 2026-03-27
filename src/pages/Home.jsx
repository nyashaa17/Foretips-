import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPredictions } from '../services/api';
import PredictionCard from '../components/PredictionCard';
import { PredictionSkeleton } from '../components/LoadingSkeleton';
import CommunityTipsPreview from '../components/CommunityTipsPreview';
import LeaderboardPreview from '../components/LeaderboardPreview';
import News from '../components/News';
import MatchPollCarousel from '../components/MatchPollCarousel';
import { TrendingUp, Activity, ChevronRight, Star, Calendar, Trophy, MessageCircle, Zap, Users, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { hapticFeedback } from '../utils/haptics';
import SEO from '../components/SEO';
import clsx from 'clsx';

import { AdPlacement } from '../components/AdPlacement';

export default function Home() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'confidence'
  const [filterType, setFilterType] = useState('all'); // 'all', 'high_confidence'

  const processedPredictions = useMemo(() => {
    if (!Array.isArray(predictions)) return [];
    let result = [...predictions];

    // Apply Filter
    if (filterType === 'high_confidence') {
      result = result.filter(p => p.confidence >= 70);
    }

    // Apply Sort
    if (sortBy === 'confidence') {
      result.sort((a, b) => b.confidence - a.confidence);
    } else {
      result.sort((a, b) => new Date(a.event.event_date) - new Date(b.event.event_date));
    }

    return result;
  }, [predictions, sortBy, filterType]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      const preds = await getPredictions({ 
        upcoming: true
      });
      console.log('Predictions loaded:', preds);
      
      setPredictions(preds || []);
    } catch (err) {
      setError(err.message || 'Failed to load data. Please try again later.');
      console.error('Error loading predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <SEO 
        title="Data-Driven Football Predictions & Betting Tips" 
        description="Get accurate football match predictions, advanced analysis, and data-driven insights to help you make smarter bets."
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
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.03, 0.05, 0.03]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-24 -right-24 w-96 h-96 bg-green-500 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              opacity: [0.02, 0.04, 0.02]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"
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
            Data-Driven <br />
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
            Daily football tips, advanced match analysis, and data-driven insights to help you make smarter bets.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex justify-center"
          >
            <a 
              href="https://whatsapp.com/channel/0029Vb7MXnXKLaHohHn7do3q" 
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticFeedback('medium')}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-500/25 flex items-center gap-3 scale-100 hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-6 h-6" />
              Join WhatsApp Channel
            </a>
          </motion.div>
        </div>
      </motion.div>
      
      <MatchPollCarousel />

      {/* Controls */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setFilterType('all')}
              className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-colors", filterType === 'all' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
            >
              All Matches
            </button>
            <button 
              onClick={() => setFilterType('high_confidence')}
              className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors", filterType === 'high_confidence' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
            >
              <Zap className="w-4 h-4" />
              High Confidence
            </button>
            
            {/* Quick Navigation Buttons */}
            <div className="hidden md:block w-px h-6 bg-slate-200 mx-2"></div>
            
            <button 
              onClick={() => {
                document.getElementById('community-tips')?.scrollIntoView({ behavior: 'smooth' });
                hapticFeedback('light');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Users className="w-4 h-4" />
              Community Tips
            </button>
            <button 
              onClick={() => {
                document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });
                hapticFeedback('light');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
            >
              <Medal className="w-4 h-4" />
              Leaderboard
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500 uppercase">Sort By:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-100 text-slate-900 text-sm rounded-lg p-2 outline-none font-bold"
            >
              <option value="date">Date</option>
              <option value="confidence">Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Predictions Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Featured Predictions
            </h2>
          </div>
          <Link to="/predictions" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
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
              ) : processedPredictions.length > 0 ? (
                processedPredictions.map((prediction, index) => [
                  <PredictionCard key={`${prediction.id}-${index}`} prediction={prediction} />,
                  index === 0 && <AdPlacement key="ad-inline" position="header" className="col-span-full" />
                ])
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No predictions available for this date/filter.</p>
                </div>
              )}
            </div>
            
          </>
        )}
      </section>

      <CommunityTipsPreview />
      <LeaderboardPreview />
      <News />
    </div>
  );
}
