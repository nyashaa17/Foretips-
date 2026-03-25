import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function LeagueStandings({ leagueName, countryName }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      console.log('Fetching standings for:', leagueName);
      if (!leagueName) return;
      
      try {
        setLoading(true);
        setError(null);

        const headers = {
          'X-Auth-Token': '51a8a6b9ed214f5dbc1be28a6733f5af'
        };

        // 1. Search for the league to get its ID
        const searchRes = await fetch(`/football-api/competitions`);
        if (!searchRes.ok) {
          throw new Error('API request failed. Please try again later.');
        }
        const searchData = await searchRes.json();
        console.log('Search data:', searchData);

        // Try to match by name
        let matchedLeague = searchData.competitions.find(
          l => l.name.toLowerCase() === leagueName.toLowerCase() || 
               l.code.toLowerCase() === leagueName.toLowerCase()
        );

        // If no exact match, try partial match
        if (!matchedLeague) {
          matchedLeague = searchData.competitions.find(
            l => l.name.toLowerCase().includes(leagueName.toLowerCase())
          );
        }

        if (!matchedLeague) {
          throw new Error('Standings are not available for this league. Only major leagues are supported.');
        }

        const leagueId = matchedLeague.id;
        
        if (matchedLeague.type === 'CUP') {
          throw new Error(`${matchedLeague.name} is a cup competition and does not have traditional standings.`);
        }
        
        const standingsRes = await fetch(`/football-api/competitions/${leagueId}/standings?season=2025`);
        if (!standingsRes.ok) {
          const errorText = await standingsRes.text();
          console.error('Standings API error details:', errorText);
          throw new Error(`Standings data not available (Status: ${standingsRes.status}). Details: ${errorText.substring(0, 50)}`);
        }

        const standingsData = await standingsRes.json();
        
        if (!standingsData.standings || standingsData.standings.length === 0) {
          throw new Error('Standings not available for this league.');
        }

        // The response contains an array of standings (e.g. TOTAL, HOME, AWAY)
        // We want the TOTAL standings
        const totalStandings = standingsData.standings.find(s => s.type === 'TOTAL');
        if (!totalStandings || !totalStandings.table) {
          throw new Error('Total standings not available for this league.');
        }

        const formattedStandings = totalStandings.table.map(team => ({
          rank: team.position,
          team: {
            id: team.team.id,
            name: team.team.shortName || team.team.name,
            logo: team.team.crest
          },
          points: team.points,
          goalsDiff: team.goalDifference,
          form: team.form,
          all: {
            played: team.playedGames,
            win: team.won,
            draw: team.draw,
            lose: team.lost,
            goals: {
              for: team.goalsFor,
              against: team.goalsAgainst
            }
          }
        }));

        setStandings(formattedStandings);

      } catch (err) {
        console.error('Error fetching standings:', err);
        setError(err.message || 'Failed to load standings.');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueName, countryName]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <p className="text-slate-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center shadow-sm">
        <p className="text-slate-500 text-lg">No standings available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-center w-12">#</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3 text-center w-12" title="Played">MP</th>
              <th className="px-4 py-3 text-center w-12" title="Won">W</th>
              <th className="px-4 py-3 text-center w-12" title="Drawn">D</th>
              <th className="px-4 py-3 text-center w-12" title="Lost">L</th>
              <th className="px-4 py-3 text-center w-16 hidden sm:table-cell" title="Goals For">GF</th>
              <th className="px-4 py-3 text-center w-16 hidden sm:table-cell" title="Goals Against">GA</th>
              <th className="px-4 py-3 text-center w-16" title="Goal Difference">GD</th>
              <th className="px-4 py-3 text-center w-16 font-bold">Pts</th>
              <th className="px-4 py-3 hidden md:table-cell">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {standings.map((team) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={team.team.id} 
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 text-center">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    team.rank <= 4 ? 'bg-blue-100 text-blue-700' : 
                    team.rank >= standings.length - 3 ? 'bg-red-100 text-red-700' : 
                    'text-slate-600'
                  }`}>
                    {team.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={team.team.logo} alt={team.team.name} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                    <span className="font-semibold text-slate-900">{team.team.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{team.all.played}</td>
                <td className="px-4 py-3 text-center text-slate-600">{team.all.win}</td>
                <td className="px-4 py-3 text-center text-slate-600">{team.all.draw}</td>
                <td className="px-4 py-3 text-center text-slate-600">{team.all.lose}</td>
                <td className="px-4 py-3 text-center text-slate-500 hidden sm:table-cell">{team.all.goals.for}</td>
                <td className="px-4 py-3 text-center text-slate-500 hidden sm:table-cell">{team.all.goals.against}</td>
                <td className="px-4 py-3 text-center font-medium text-slate-700">{team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-900">{team.points}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    {team.form?.split('').map((result, idx) => (
                      <span 
                        key={idx} 
                        className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white ${
                          result === 'W' ? 'bg-emerald-500' : 
                          result === 'D' ? 'bg-slate-400' : 
                          'bg-red-500'
                        }`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
