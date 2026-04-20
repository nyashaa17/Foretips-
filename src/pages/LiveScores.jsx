import { useState, useEffect } from 'react';
import { getLiveMatches } from '../services/bsdApi';
import LiveMatchCard from '../components/LiveMatchCard';
import { MatchSkeleton } from '../components/LoadingSkeleton';
import { Activity, RefreshCw } from 'lucide-react';
import SEO from '../components/SEO';

export default function LiveScores() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchLive = async () => {
    try {
      setLoading(true);
      const data = await getLiveMatches();
      setMatches(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load live scores.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();

    const interval = setInterval(() => {
      fetchLive();
    }, 30000); // Auto refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO 
        title="Live Football Tips Today" 
        description="Live AI-powered football predictions and real-time match tips updated daily on Foretips." 
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
          <h1 className="text-3xl font-bold text-slate-900">Live Scores</h1>
          </div>
          <p className="text-slate-500">Real-time match updates, stats, and incidents.</p>
        </div>

        <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-green-600' : ''}`} />
            <span>Auto-updates every 30s</span>
          </div>
          <div className="h-4 w-px bg-slate-200"></div>
          <span className="text-xs text-slate-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && matches.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => <MatchSkeleton key={i} />)
          ) : matches.length > 0 ? (
            matches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Activity className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Live Matches</h3>
              <p className="text-slate-500">There are currently no live matches being played.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
