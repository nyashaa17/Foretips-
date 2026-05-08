import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPredictions, getLeagues } from '../services/api';
import PredictionCard from '../components/PredictionCard';
import LeagueCard from '../components/LeagueCard';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [leagues, setLeagues] = useState([]);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setPredictions([]);
        setLeagues([]);
        return;
      }

      setLoading(true);
      
      try {
        // Fetch data
        const [predsData, leaguesData] = await Promise.all([
          getPredictions({ search: query, page_size: 50, maxPages: 2, ordering: '-event__event_date' }),
          getLeagues({ search: query })
        ]);

        setPredictions(predsData || []);
        setLeagues(leaguesData || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for "{query}"
      </h1>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Matches ({predictions.length})</h2>
            {predictions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {predictions.map(pred => (
                  <PredictionCard key={pred.id} prediction={pred} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No matches found.</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Leagues ({leagues.length})</h2>
            {leagues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {leagues.map(league => (
                  <LeagueCard key={league.id || league.name} league={league} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No leagues found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
