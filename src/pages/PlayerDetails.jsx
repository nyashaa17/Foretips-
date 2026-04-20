import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerProfile, getPlayerMatchStats } from '../services/api';
import { User, Activity, ArrowRightLeft, Calendar, TrendingUp } from 'lucide-react';
import SmartLogo from '../components/SmartLogo';
import SEO from '../components/SEO';

export default function PlayerDetails() {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, statsData] = await Promise.all([
          getPlayerProfile(playerId),
          getPlayerMatchStats(playerId)
        ]);
        
        setPlayer(profileData);
        setStats(statsData || []);
      } catch (err) {
        console.error('Failed to fetch player details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [playerId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Player Not Found</h2>
          <p className="text-slate-500">We couldn't find the details for this player.</p>
        </div>
      </div>
    );
  }

  const latestStats = stats.length > 0 ? stats[0] : null;
  const photoUrl = `https://sports.bzzoiro.com/img/player/${playerId}/`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <SEO 
        title={`${player.name} Profile & Stats`} 
        description={`View ${player.name}'s latest football stats, transfer history, and performance analysis.`}
      />
      {/* Player Data Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Player Data</h2>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Info */}
            <div className="flex flex-col items-center text-center min-w-[150px]">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 mb-4 bg-slate-50">
                <img 
                  src={photoUrl} 
                  alt={player.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.name || 'Player') + '&background=f8fafc&color=94a3b8';
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{player.name}</h1>
              <p className="text-slate-500 capitalize">{player.position || 'Player'}</p>
            </div>

            {/* Key Info Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
                {player.team?.id ? (
                  <Link to={`/team/${player.team.id}`} className="text-sm font-bold text-slate-900 mb-1 hover:text-blue-600 hover:underline">
                    {player.team?.name || player.team_name || '---'}
                  </Link>
                ) : (
                  <span className="text-sm font-bold text-slate-900 mb-1">{player.team?.name || player.team_name || '---'}</span>
                )}
                <span className="text-xs text-slate-500">Club</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
                {player.national_team?.id ? (
                  <Link to={`/team/${player.national_team.id}?national=true`} className="text-sm font-bold text-blue-600 mb-1 hover:underline">
                    {player.national_team?.name || player.national_team || '---'}
                  </Link>
                ) : (
                  <span className="text-sm font-bold text-blue-600 mb-1">{player.national_team?.name || player.national_team || '---'}</span>
                )}
                <span className="text-xs text-slate-500">National Team</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold text-green-600 mb-1">{player.market_value ? `€${player.market_value}` : '---'}</span>
                <span className="text-xs text-slate-500">Market Value</span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold text-slate-900 mb-1">{player.height ? `${player.height} cm` : '---'}</span>
                <span className="text-xs text-slate-500">Height</span>
              </div>
            </div>
          </div>

          {/* Latest Match Stats */}
          {latestStats && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Latest Match Stats</h3>
              <div className="grid grid-cols-3 md:grid-cols-7 gap-4">
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-bold text-blue-600">{latestStats.rating || '---'}</span>
                  <span className="text-[10px] text-slate-500 uppercase mt-1">Rating</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-bold text-slate-900">{latestStats.goals ?? '---'}</span>
                  <span className="text-[10px] text-slate-500 uppercase mt-1">Goals</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-bold text-slate-900">{latestStats.assists ?? '---'}</span>
                  <span className="text-[10px] text-slate-500 uppercase mt-1">Assists</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-bold text-slate-900">{latestStats.shots ?? '---'}</span>
                  <span className="text-[10px] text-slate-500 uppercase mt-1">Shots</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-bold text-slate-900">{latestStats.key_passes ?? '---'}</span>
                  <span className="text-[10px] text-slate-500 uppercase mt-1">Key Pass</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-bold text-slate-900">
                    {latestStats.passes_completed != null && latestStats.passes_total != null 
                      ? `${latestStats.passes_completed}/${latestStats.passes_total}` 
                      : '---'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase mt-1">Pass Acc</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-bold text-slate-900">{latestStats.minutes_played ? `${latestStats.minutes_played}'` : '---'}</span>
                  <span className="text-[10px] text-slate-500 uppercase mt-1">Min</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transfer History Section */}
      {player.transfers && player.transfers.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Transfer History</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={photoUrl} 
                alt={player.name} 
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.name || 'Player') + '&background=f8fafc&color=94a3b8';
                }}
              />
              <div>
                <h3 className="font-bold text-slate-900">{player.name}</h3>
                <p className="text-xs text-slate-500">{player.preferred_foot ? `${player.preferred_foot} foot` : '---'}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">From</th>
                    <th className="pb-3 pr-4">To</th>
                    <th className="pb-3 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {player.transfers.map((transfer, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      <td className="py-4 pr-4 text-slate-500 whitespace-nowrap">
                        {transfer.date ? new Date(transfer.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '---'}
                      </td>
                      <td className="py-4 pr-4 font-medium text-slate-900">{transfer.from_team?.name || transfer.from_team || '---'}</td>
                      <td className="py-4 pr-4 font-bold text-slate-900">{transfer.to_team?.name || transfer.to_team || '---'}</td>
                      <td className="py-4 text-right font-bold text-green-600 whitespace-nowrap">
                        {transfer.fee ? (transfer.fee === 'Free' || transfer.fee === 'Loan' ? <span className="text-slate-500 font-normal">{transfer.fee}</span> : transfer.fee) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Matches Stats */}
      {stats && stats.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Recent Matches</h2>
          </div>
          
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Match</th>
                  <th className="pb-3 pr-4 text-center">Min</th>
                  <th className="pb-3 pr-4 text-center">Rating</th>
                  <th className="pb-3 pr-4 text-center">G</th>
                  <th className="pb-3 pr-4 text-center">A</th>
                  <th className="pb-3 pr-4 text-center">Shots</th>
                  <th className="pb-3 pr-4 text-center">Key Pass</th>
                  <th className="pb-3 text-center">Passes</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats.slice(0, 10).map((matchStat, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">
                      {matchStat.event?.start_time ? new Date(matchStat.event.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900 whitespace-nowrap">
                      {matchStat.event?.home_team?.name || 'Home'} vs {matchStat.event?.away_team?.name || 'Away'}
                    </td>
                    <td className="py-3 pr-4 text-center text-slate-600">{matchStat.minutes_played || '-'}</td>
                    <td className="py-3 pr-4 text-center font-bold text-blue-600">{matchStat.rating || '-'}</td>
                    <td className="py-3 pr-4 text-center text-slate-900">{matchStat.goals ?? '-'}</td>
                    <td className="py-3 pr-4 text-center text-slate-900">{matchStat.assists ?? '-'}</td>
                    <td className="py-3 pr-4 text-center text-slate-900">{matchStat.shots ?? '-'}</td>
                    <td className="py-3 pr-4 text-center text-slate-900">{matchStat.key_passes ?? '-'}</td>
                    <td className="py-3 text-center text-slate-600">
                      {matchStat.passes_completed != null && matchStat.passes_total != null 
                        ? `${matchStat.passes_completed}/${matchStat.passes_total}` 
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
