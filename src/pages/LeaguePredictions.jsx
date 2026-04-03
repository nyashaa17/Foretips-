import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLeagues } from '../services/api';
import LeagueStandings from '../components/LeagueStandings';
import NotFound from './NotFound';
import { ChevronLeft, Trophy, List } from 'lucide-react';

export default function LeaguePredictions() {
  const { leagueSlug } = useParams();
  const navigate = useNavigate();
  const [leagueInfo, setLeagueInfo] = useState(null);
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
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Back to Leagues
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-blue-100 p-3 rounded-xl border border-blue-200">
          <Trophy className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 capitalize">
            {leagueInfo ? `${leagueInfo.name}` : 'League Details'}
          </h1>
          {leagueInfo && (
            <p className="text-slate-500 mt-1">{leagueInfo.country}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading standings...</div>
      ) : leagueInfo && (
        <LeagueStandings leagueName={leagueInfo.name} countryName={leagueInfo.country} />
      )}
    </div>
  );
}
