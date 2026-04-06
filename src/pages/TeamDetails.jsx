import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getSquad } from '../services/api';
import { Users, Calendar } from 'lucide-react';

export default function TeamDetails() {
  const { teamId } = useParams();
  const [searchParams] = useSearchParams();
  const isNational = searchParams.get('national') === 'true';
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const rosterData = await getSquad(teamId, isNational);
        setRoster(rosterData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId, isNational]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!roster.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Squad Found</h2>
          <p className="text-slate-500">We couldn't find the roster for this team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Team Squad</h1>
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Roster</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {roster.map(player => (
              <Link 
                key={player.id} 
                to={`/player/${player.id}`} 
                className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                  <img 
                    src={`https://sports.bzzoiro.com/img/player/${player.id}/`} 
                    alt={player.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.name || 'Player') + '&background=f8fafc&color=94a3b8';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{player.name}</p>
                  <p className="text-xs text-slate-500 capitalize truncate">{player.position}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
