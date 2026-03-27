import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTeamSchedule, getTeamRoster } from '../services/sportsService';
import { Users, Calendar } from 'lucide-react';

export default function TeamDetails() {
  const { teamId } = useParams();
  const [roster, setRoster] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rosterData, scheduleData] = await Promise.all([
          getTeamRoster(teamId),
          getTeamSchedule(teamId)
        ]);
        setRoster(rosterData.player || []);
        setSchedule(scheduleData.matches || []);
      } catch (err) {
        console.error(err);
        // Handle error gracefully, e.g., by setting an error state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId]);

  if (loading) return <div>Loading...</div>;
  if (!roster.length && !schedule.length) return <div>No data found for this team.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Team Details</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-blue-600" />
            <h2 className="text-xl font-bold">Roster</h2>
          </div>
          <div className="space-y-2">
            {roster.map(player => (
              <Link key={player.idPlayer} to={`/player/${player.idPlayer}`} className="block p-2 border-b hover:bg-slate-50 transition-colors">
                {player.strPlayer} - {player.strPosition}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-green-600" />
            <h2 className="text-xl font-bold">Schedule</h2>
          </div>
          <div className="space-y-2">
            {schedule.map(match => (
              <div key={match.id} className="p-2 border-b">
                {match.homeTeam.name} vs {match.awayTeam.name} - {new Date(match.utcDate).toLocaleDateString()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
