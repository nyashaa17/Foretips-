import { useState, useEffect } from 'react';
import { getLeagues } from '../services/api';
import LeagueCard from '../components/LeagueCard';
import { Trophy } from 'lucide-react';
import SEO from '../components/SEO';

export default function Leagues() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        const data = await getLeagues();
        setLeagues(data);
      } catch (err) {
        setError('Failed to load leagues.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO 
        title="Football Leagues" 
        description="Browse football predictions, betting tips, and match stats by league."
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Football Leagues</h1>
          </div>
          <p className="text-slate-500">Browse predictions and stats by league.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-4 animate-pulse shadow-sm">
                <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
                <div className="w-24 h-4 bg-slate-200 rounded"></div>
                <div className="w-16 h-3 bg-slate-200 rounded mt-1"></div>
              </div>
            ))
          ) : leagues.length > 0 ? (
            leagues.map((league, index) => (
              <LeagueCard key={`${league.id}-${index}`} league={league} />
            ))
          ) : (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-lg">No leagues found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
