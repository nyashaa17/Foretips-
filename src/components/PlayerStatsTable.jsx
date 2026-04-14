import React from 'react';

export default function PlayerStatsTable({ stats }) {
  if (!stats || stats.length === 0) return null;

  // Separate GK and field players
  const goalkeepers = stats.filter(p => p.position === 'G' || p.position === 'Goalkeeper');
  const fieldPlayers = stats.filter(p => p.position !== 'G' && p.position !== 'Goalkeeper');

  // Sort by rating descending
  const sortedFieldPlayers = [...fieldPlayers].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const sortedGKs = [...goalkeepers].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const getRatingColor = (rating) => {
    if (!rating) return 'bg-slate-100 text-slate-500';
    if (rating >= 8.0) return 'bg-green-100 text-green-700 font-bold';
    if (rating >= 7.0) return 'bg-blue-100 text-blue-700';
    if (rating < 6.0) return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
  };

  const renderTable = (players, isGK = false) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Player</th>
            <th className="px-4 py-3 text-center">Min</th>
            <th className="px-4 py-3 text-center">Rating</th>
            {isGK ? (
              <>
                <th className="px-4 py-3 text-center">Saves</th>
                <th className="px-4 py-3 text-center rounded-tr-lg">Conceded</th>
              </>
            ) : (
              <>
                <th className="px-4 py-3 text-center">G</th>
                <th className="px-4 py-3 text-center">A</th>
                <th className="px-4 py-3 text-center">xG</th>
                <th className="px-4 py-3 text-center">SoT</th>
                <th className="px-4 py-3 text-center">KP</th>
                <th className="px-4 py-3 text-center">Tck</th>
                <th className="px-4 py-3 text-center rounded-tr-lg">Cards</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {players.map((p, idx) => (
            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{p.player?.name || p.player_name}</div>
                <div className="text-xs text-slate-500">{p.team?.name || p.team_name}</div>
              </td>
              <td className="px-4 py-3 text-center text-slate-600">{p.minutes_played || '-'}</td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-1 rounded ${getRatingColor(p.rating)}`}>
                  {p.rating ? p.rating.toFixed(1) : '-'}
                </span>
              </td>
              {isGK ? (
                <>
                  <td className="px-4 py-3 text-center text-slate-600">{p.saves || 0}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{p.goals_conceded || 0}</td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3 text-center font-medium text-slate-900">{p.goals || 0}</td>
                  <td className="px-4 py-3 text-center font-medium text-slate-900">{p.assists || 0}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{p.xg ? p.xg.toFixed(2) : '-'}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{p.shots_on_target || 0}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{p.key_passes || 0}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{p.tackles_won || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {p.yellow_cards > 0 && <span className="w-3 h-4 bg-yellow-400 rounded-sm inline-block"></span>}
                      {p.red_cards > 0 && <span className="w-3 h-4 bg-red-500 rounded-sm inline-block"></span>}
                      {p.yellow_cards === 0 && p.red_cards === 0 && <span className="text-slate-300">-</span>}
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
      <h3 className="text-xl font-bold text-slate-900 mb-4">Player Statistics</h3>
      
      {sortedFieldPlayers.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Field Players</h4>
          {renderTable(sortedFieldPlayers)}
        </div>
      )}
      
      {sortedGKs.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Goalkeepers</h4>
          {renderTable(sortedGKs, true)}
        </div>
      )}
    </div>
  );
}
