import { useState, useEffect, useMemo } from 'react';
import { getPredictions } from '../services/api';
import PredictionCard from '../components/PredictionCard';
import { AdPlacement } from '../components/AdPlacement';
import { PredictionSkeleton } from '../components/LoadingSkeleton';
import { ChevronRight, Zap, TrendingUp, CalendarDays, Search } from 'lucide-react';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import clsx from 'clsx';
import React from 'react';

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New "Professional" Controls
  const [sortBy, setSortBy] = useState('date'); // 'date', 'confidence'
  const [filterType, setFilterType] = useState('all'); // 'all', 'high_confidence'
  const [searchQuery, setSearchQuery] = useState(''); // Search by team name

  const fetchPredictions = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      // Fetch more predictions to ensure we get all of them, including upcoming matches
      const preds = await getPredictions({ upcoming: true }, forceRefresh);
      setPredictions(preds || []);
    } catch (err) {
      setError('Failed to load predictions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const processedPredictions = useMemo(() => {
    if (!Array.isArray(predictions)) return [];
    let result = [...predictions];

    // Apply Search Filter
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => {
        const event = p.event || p;
        const rawHome = event.home_team_obj || event.home_team;
        const homeName = typeof rawHome === 'string' ? rawHome : (rawHome?.name || '');
        const rawAway = event.away_team_obj || event.away_team;
        const awayName = typeof rawAway === 'string' ? rawAway : (rawAway?.name || '');
        
        return homeName.toLowerCase().includes(lowerQuery) || awayName.toLowerCase().includes(lowerQuery);
      });
    }

    // Apply Filter
    if (filterType === 'high_confidence') {
      result = result.filter(p => p.confidence >= 0.7);
    }

    // Apply Sort
    if (sortBy === 'confidence') {
      result.sort((a, b) => b.confidence - a.confidence);
    } else {
      result.sort((a, b) => new Date(b.event.event_date) - new Date(a.event.event_date));
    }

    return result;
  }, [predictions, sortBy, filterType, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO 
        title="Expert Football Predictions & Betting Tips | Match Analysis" 
        description="Get accurate football predictions, expert betting tips, and deep match analysis. Boost your betting strategy with our data-driven insights."
      />
      
      <Breadcrumbs />

      <div className="text-center mb-10 relative">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">Match Predictions</h1>
        <div className="w-20 h-1.5 bg-green-500 mx-auto rounded-full mb-4"></div>
      </div>

      {/* Professional Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button 
              onClick={() => setFilterType('all')}
              className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap", filterType === 'all' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
            >
              All Matches
            </button>
            <button 
              onClick={() => setFilterType('high_confidence')}
              className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap", filterType === 'high_confidence' ? "bg-green-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
            >
              <Zap className="w-4 h-4" />
              High Confidence
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
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

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <PredictionSkeleton key={i} />)
          ) : processedPredictions.length > 0 ? (
            processedPredictions.map((prediction, index) => (
              <React.Fragment key={`${prediction.id}-${index}`}>
                <PredictionCard prediction={prediction} />
                {(index + 1) % 3 === 0 && (
                  <div className="col-span-full">
                    <AdPlacement position="predictions_list" />
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-lg">No predictions found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
