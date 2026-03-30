import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { MotionCard } from '../components/MotionCard';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Fetch all profiles and their won tips
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            username,
            community_tips (
              id,
              status
            )
          `);

        if (error) throw error;

        if (data) {
          // Calculate score based on 'won' tips
          const scoredUsers = data.map(profile => {
            const wonTips = profile.community_tips.filter(tip => tip.status === 'won').length;
            const totalTips = profile.community_tips.length;
            const successRate = totalTips > 0 ? Math.round((wonTips / totalTips) * 100) : 0;
            
            return {
              id: profile.id,
              username: profile.username || 'Unknown User',
              score: wonTips,
              totalTips,
              successRate
            };
          });

          // Sort by score (won tips) descending, then by success rate
          let sorted = scoredUsers
            .sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return b.successRate - a.successRate;
            });

          // Pad to at least 3 users
          while (sorted.length < 3) {
            sorted.push({
              id: `placeholder-${sorted.length}`,
              username: 'Available Spot',
              score: 0,
              totalTips: 0,
              successRate: 0,
              isPlaceholder: true
            });
          }

          setLeaderboard(sorted);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-slate-500 font-bold text-lg w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <SEO title="Leaderboard" description="See the top community tipsters" />
      
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Top Tipsters</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Rankings are based on the total number of winning predictions. 
          Submit your tips and climb to the top of the leaderboard!
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-medium text-slate-500">Loading rankings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Rankings Yet</h3>
            <p className="text-slate-500">Be the first to submit a winning tip!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider w-20">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Tipster</th>
                  <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase tracking-wider hidden sm:table-cell">Success Rate</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Won Tips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`transition-colors hover:bg-slate-50 ${index < 3 ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm">
                        {getRankIcon(index)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0 ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-slate-400' : 
                          index === 2 ? 'bg-amber-600' : 'bg-slate-800'
                        }`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-base font-bold text-slate-900">{user.username}</div>
                          <div className="text-xs text-slate-500 sm:hidden flex items-center mt-1">
                            <TrendingUp className="w-3 h-3 mr-1" /> {user.successRate}% Success
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center hidden sm:table-cell">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">
                        {user.successRate}%
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{user.totalTips} total tips</div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="text-2xl font-black text-slate-900">{user.score}</div>
                      <div className="text-xs font-bold text-green-600 uppercase tracking-wide">Wins</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
