import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

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

        const espnLeagueMap = {
          'premier league': 'eng.1',
          'championship': 'eng.2',
          'la liga': 'esp.1',
          'serie a': 'ita.1',
          'bundesliga': 'ger.1',
          'ligue 1': 'fra.1',
          'eredivisie': 'ned.1',
          'primeira liga': 'por.1',
          'liga portugal betclic': 'por.1',
          'champions league': 'uefa.champions',
          'europa league': 'uefa.europa',
          'mls': 'usa.1',
          'brasileirão serie a': 'bra.1',
          'liga mx apertura': 'mex.1',
          'liga mx clausura': 'mex.1',
          'pro league': 'bel.1',
          'scottish premiership': 'sco.1',
          'super league': 'sui.1',
          'trendyol super lig': 'tur.1',
          'saudi pro league': 'ksa.1',
          'allsvenskan': 'swe.1',
          'superliga': 'rou.1',
          'stoiximan super league': 'gre.1',
          'nigeria premier football league': 'nga.1',
          'africa cup of nations 2025': 'caf.nations',
          'caf champions league': 'caf.champions',
          'world cup 2026': 'fifa.world'
        };

        const leagueCode = espnLeagueMap[leagueName.toLowerCase()];

        if (!leagueCode) {
          throw new Error('Standings are not available for this league. Only major leagues are supported.');
        }

        const standingsRes = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${leagueCode}/standings`);
        if (!standingsRes.ok) {
          const errorText = await standingsRes.text();
          console.error('Standings API error details:', errorText);
          throw new Error(`Standings data not available (Status: ${standingsRes.status}). Details: ${errorText.substring(0, 50)}`);
        }

        const standingsData = await standingsRes.json();
        
        let entries = standingsData.children?.[0]?.standings?.entries;

        if (!entries || entries.length === 0) {
          // Try fetching previous seasons if current is not available
          const currentYear = new Date().getFullYear();
          for (let year = currentYear; year >= currentYear - 2; year--) {
            try {
              const fallbackRes = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${leagueCode}/standings?season=${year}`);
              if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json();
                const fallbackEntries = fallbackData.children?.[0]?.standings?.entries;
                if (fallbackEntries && fallbackEntries.length > 0) {
                  entries = fallbackEntries;
                  break;
                }
              }
            } catch (fallbackErr) {
              console.error(`Failed to fetch fallback standings for year ${year}`, fallbackErr);
            }
          }
        }

        if (!entries || entries.length === 0) {
          throw new Error('Standings not available for this league.');
        }

        const getStat = (stats, name) => {
          const stat = stats.find(s => s.name === name);
          return stat ? stat.value : 0;
        };

        const formattedStandings = entries.map(team => ({
          rank: getStat(team.stats, 'rank'),
          team: {
            id: team.team.id,
            name: team.team.displayName || team.team.name,
            logo: team.team.logos?.[0]?.href || ''
          },
          points: getStat(team.stats, 'points'),
          goalsDiff: getStat(team.stats, 'pointDifferential'),
          form: '', // ESPN API doesn't provide form directly in this endpoint
          all: {
            played: getStat(team.stats, 'gamesPlayed'),
            win: getStat(team.stats, 'wins'),
            draw: getStat(team.stats, 'ties'),
            lose: getStat(team.stats, 'losses'),
            goals: {
              for: getStat(team.stats, 'pointsFor'),
              against: getStat(team.stats, 'pointsAgainst')
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
                    {team.team.logo && <img src={team.team.logo} alt={team.team.name} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />}
                    <Link to={`/team/${team.team.id}`} className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">{team.team.name}</Link>
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
