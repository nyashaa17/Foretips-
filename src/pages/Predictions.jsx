import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPredictions } from '../services/bsdApi';
import { getLeagues, getMemoryCache, getPredictionsCacheKey } from '../services/api';
import PredictionCard from '../components/PredictionCard';
import { AdPlacement } from '../components/AdPlacement';
import { PredictionSkeleton } from '../components/LoadingSkeleton';
import { ChevronRight, Zap, TrendingUp, CalendarDays, Search, ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import clsx from 'clsx';
import React from 'react';
import FilterSelector from '../components/FilterSelector';

export default function Predictions() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New "Professional" Controls
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'high_confidence', 'league', 'date_range'
  const [showFilterSelector, setShowFilterSelector] = useState(false);
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [dateFilter, setDateFilter] = useState('today'); // 'yesterday', 'today', 'tomorrow', 'custom'
  const [searchQuery, setSearchQuery] = useState(''); // Search by team name
  
  // Custom Date Range
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Leagues
  const [leagues, setLeagues] = useState([]);

  const filterOptions = [
    { value: 'all', label: 'All Predictions' },
    { value: 'high_confidence', label: 'High Confidence' },
    { value: 'date_range', label: 'Date Range' },
    { value: 'league', label: 'By League' },
  ];

  const handleFilterSelect = (value) => {
    setFilterBy(value);
    if (value === 'date_range') setDateFilter('custom');
    else if (dateFilter === 'custom') setDateFilter('today');
    setShowFilterSelector(false);
  };

  useEffect(() => {
    const loadLeagues = async () => {
      try {
        const data = await getLeagues();
        setLeagues(data || []);
      } catch (err) {
        console.error('Failed to load leagues', err);
      }
    };
    loadLeagues();
  }, []);

  const fetchPredictions = async (filter, forceRefresh = false) => {
    try {
      let params = {};
      
      if (filter === 'custom' && customDateFrom && customDateTo) {
        params = { date_from: customDateFrom, date_to: customDateTo };
        // If the custom date range is entirely in the past, set upcoming to false
        if (new Date(customDateTo) < new Date(new Date().setHours(0,0,0,0))) {
          params.upcoming = false;
        }
      } else if (filter !== 'custom') {
        const date = new Date();
        if (filter === 'yesterday') {
          date.setDate(date.getDate() - 1);
        } else if (filter === 'tomorrow') {
          date.setDate(date.getDate() + 1);
        }
        const dateStr = date.toISOString().split('T')[0];
        
        params = { date_from: dateStr, date_to: dateStr };
      } else {
        // If custom but dates not set, just fetch today
        const dateStr = new Date().toISOString().split('T')[0];
        params = { date_from: dateStr, date_to: dateStr };
      }

      const cacheKey = getPredictionsCacheKey(params);
      const cached = getMemoryCache(cacheKey);
      
      if (!cached || forceRefresh) {
        setLoading(true);
      }
      setError(null);
      
      const response = await getPredictions(params);
      setPredictions(response?.results || []);
    } catch (err) {
      setError('Failed to load predictions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter === 'custom' && (!customDateFrom || !customDateTo)) {
      return; // Wait for both dates
    }
    fetchPredictions(dateFilter);
  }, [dateFilter, customDateFrom, customDateTo]);

  const handleLeagueSelect = (leagueId) => {
    setShowLeagueSelector(false);
    
    const league = leagues.find(l => l.id.toString() === leagueId);
    if (league) {
      const slug = league.name.toLowerCase().replace(/\s+/g, '-') + '-predictions';
      navigate(`/${slug}`);
    }
  };

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

    // Apply "Filter By"
    if (filterBy === 'high_confidence') {
      result = result.filter(p => p.confidence >= 75);
    }

    // Sort by date descending
    result.sort((a, b) => new Date(b.event?.start_time || b.event?.event_date || 0) - new Date(a.event?.start_time || a.event?.event_date || 0));

    return result;
  }, [predictions, filterBy, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO 
        title="Football Predictions & Tips Today | Foretips" 
        description="Get the latest AI-powered football predictions, betting tips, and live scores for today's matches on Foretips."
        keywords="football predictions, betting tips, soccer predictions, match analysis, live scores"
      />
      
      <Breadcrumbs />

      <div className="text-center mb-10 relative">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">Match Predictions</h1>
        <div className="w-20 h-1.5 bg-green-500 mx-auto rounded-full mb-4"></div>
      </div>

      {/* Professional Controls */}
      <div className="flex flex-col gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                onClick={() => setDateFilter('yesterday')}
                className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap", dateFilter === 'yesterday' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
              >
                Yesterday
              </button>
              <button 
                onClick={() => setDateFilter('today')}
                className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap", dateFilter === 'today' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
              >
                Today
              </button>
              <button 
                onClick={() => setDateFilter('tomorrow')}
                className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap", dateFilter === 'tomorrow' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
              >
                Tomorrow
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-sm font-bold text-slate-500 uppercase whitespace-nowrap">Filter By:</span>
            <button 
              onClick={() => setShowFilterSelector(true)}
              className="bg-slate-100 text-slate-900 text-sm rounded-lg p-2 outline-none font-bold flex items-center justify-between w-full md:w-48"
            >
              {filterOptions.find(o => o.value === filterBy)?.label}
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {showFilterSelector && (
          <FilterSelector
            options={filterOptions}
            selected={filterBy}
            onSelect={handleFilterSelect}
            onClose={() => setShowFilterSelector(false)}
          />
        )}

        {/* Conditional Filter Controls */}
        {filterBy === 'date_range' && (
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">From:</span>
              <input 
                type="date" 
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">To:</span>
              <input 
                type="date" 
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-green-500"
              />
            </div>
          </div>
        )}

        {filterBy === 'league' && (
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-600">Select League:</span>
            <button 
              onClick={() => setShowLeagueSelector(true)}
              className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-green-500 w-full sm:w-64 text-left flex items-center justify-between"
            >
              {selectedLeague ? leagues.find(l => l.id.toString() === selectedLeague)?.name : 'Choose a league...'}
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}

        {showLeagueSelector && (
          <FilterSelector
            options={leagues.map(l => ({ value: l.id.toString(), label: l.name }))}
            selected={selectedLeague}
            onSelect={handleLeagueSelect}
            onClose={() => setShowLeagueSelector(false)}
          />
        )}
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => <PredictionSkeleton key={i} />)
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
