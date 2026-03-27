import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPlayerDetails } from '../services/sportsService';
import { User, Activity, Trophy } from 'lucide-react';

export default function PlayerDetails() {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getPlayerDetails(playerId);
        setPlayer(data.players ? data.players[0] : null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [playerId]);

  if (loading) return <div>Loading...</div>;
  if (!player) return <div>Player not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          {player.strThumb && <img src={player.strThumb} alt={player.strPlayer} className="w-32 h-32 rounded-full object-cover" />}
          <div>
            <h1 className="text-4xl font-bold">{player.strPlayer}</h1>
            <p className="text-slate-500 text-lg">{player.strPosition} | {player.strTeam}</p>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 rounded-xl">
            <h3 className="font-bold text-slate-500">Nationality</h3>
            <p className="text-xl">{player.strNationality}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <h3 className="font-bold text-slate-500">Height</h3>
            <p className="text-xl">{player.strHeight}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <h3 className="font-bold text-slate-500">Weight</h3>
            <p className="text-xl">{player.strWeight}</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Biography</h2>
          <p className="text-slate-700 leading-relaxed">{player.strDescriptionEN}</p>
        </div>
      </div>
    </div>
  );
}
