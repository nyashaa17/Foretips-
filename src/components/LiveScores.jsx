import { useState, useEffect } from 'react';
import { getLiveMatches } from '../services/sportsService';
import { Clock } from 'lucide-react';

export default function LiveScores() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const data = await getLiveMatches();
        setMatches(data.matches || []);
      } catch (err) {
        setError('Failed to fetch live scores');
      } finally {
        setLoading(false);
      }
    };
    fetchLive();
  }, []);

  if (loading) return <div>Loading live scores...</div>;
  if (error) return <div>{error}</div>;
  if (matches.length === 0) return <div>No live matches at the moment.</div>;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Live Scores</h2>
      <div className="space-y-4">
        {matches.map(match => (
          <div key={match.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{match.homeTeam.name}</span>
              <span className="text-slate-400">vs</span>
              <span className="font-semibold">{match.awayTeam.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{match.score.fullTime.home} - {match.score.fullTime.away}</span>
              <span className="text-xs text-slate-500 bg-red-100 px-2 py-1 rounded-full flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {match.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
