import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLeagues, getPredictions } from '../services/api';
import LeagueStandings from '../components/LeagueStandings';
import PredictionCard from '../components/PredictionCard';
import { PredictionSkeleton } from '../components/LoadingSkeleton';
import NotFound from './NotFound';
import { ChevronLeft, Trophy, CalendarDays } from 'lucide-react';
import React from 'react';
import SEO from '../components/SEO';

export default function LeaguePredictions() {
  const { leagueSlug } = useParams();
  const navigate = useNavigate();
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeagueData = async () => {
      try {
        setLoading(true);
        // First find the league ID from the slug
        const leagues = await getLeagues();
        const leagueName = leagueSlug.replace(/-predictions$/, '').replace(/-/g, ' ');
        
        const foundLeague = leagues.find(l => l.name.toLowerCase() === leagueName.toLowerCase());
        
        if (!foundLeague) {
          setError('League not found.');
          setLoading(false);
          return;
        }

        setLeagueInfo(foundLeague);

        // Fetch predictions for this league
        const preds = await getPredictions({ league: foundLeague.id });
        setPredictions(preds || []);

      } catch (err) {
        setError('Failed to load league data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [leagueSlug]);

  if (error) {
    return <NotFound />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO 
        title={leagueInfo ? `${leagueInfo.name} Predictions` : 'League Predictions'} 
        description={`Latest AI football predictions, betting tips, and analysis for ${leagueInfo ? leagueInfo.name : 'this league'}.`}
      />
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-100 p-3 rounded-xl border border-blue-200">
          <Trophy className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 capitalize">
            {leagueInfo ? `${leagueInfo.name} Predictions` : 'League Predictions'}
          </h1>
          {leagueInfo && (
            <p className="text-slate-500 mt-1">{leagueInfo.country}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-slate-400" />
            Upcoming Matches
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <PredictionSkeleton key={i} />)
            ) : predictions.length > 0 ? (
              predictions.map((prediction, index) => (
                <PredictionCard key={`${prediction.id}-${index}`} prediction={prediction} />
              ))
            ) : (
              <div className="col-span-full bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-lg">No predictions available for this league right now.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading standings...</div>
          ) : leagueInfo && (
            <LeagueStandings leagueName={leagueInfo.name} countryName={leagueInfo.country} />
          )}
        </div>
      </div>
    </div>
  );
}
