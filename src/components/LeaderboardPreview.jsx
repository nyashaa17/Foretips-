import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Trophy, Medal, Award, ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import BettingBanner from './BettingBanner';

export default function LeaderboardPreview() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('username, community_tips(id, status)')
          .eq('community_tips.status', 'won');

        if (data) {
          let sorted = data
            .map(p => {
              const wonTips = p.community_tips.filter(tip => tip.status === 'won').length;
              const totalTips = p.community_tips.length;
              const successRate = totalTips > 0 ? Math.round((wonTips / totalTips) * 100) : 0;
              
              return {
                username: p.username || 'Unknown User',
                score: wonTips,
                successRate
              };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
            
          // Pad to at least 3 users
          while (sorted.length < 3) {
            sorted.push({
              username: 'Available Spot',
              score: 0,
              successRate: 0,
              isPlaceholder: true
            });
          }
            
          setLeaderboard(sorted);
        }
      } catch (error) {
        console.error("Error fetching leaderboard preview:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-500 font-bold text-sm">{index + 1}</span>;
  };

  return (
    <section id="leaderboard" className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 p-2 rounded-lg shadow-sm shadow-yellow-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Top Tipsters
          </h2>
        </div>
        <Link 
          to="/leaderboard" 
          className="hidden md:flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          View Full Rankings <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-medium text-slate-500">Loading rankings...</p>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {leaderboard.map((user, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className={`flex items-center justify-between p-4 sm:p-5 transition-colors hover:bg-slate-50 ${index < 3 ? 'bg-slate-50/30' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-500 shadow-md shadow-yellow-500/20' : 
                      index === 1 ? 'bg-slate-400 shadow-md shadow-slate-400/20' : 
                      index === 2 ? 'bg-amber-600 shadow-md shadow-amber-600/20' : 'bg-slate-800'
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{user.username}</span>
                      <div className="text-xs text-slate-500 flex items-center mt-0.5">
                        <TrendingUp className="w-3 h-3 mr-1" /> {user.successRate}% Success
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-slate-900 block">{user.score}</span>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Wins</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No winning tips yet. Be the first!</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <Link 
          to="/leaderboard" 
          className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors"
        >
          View Full Rankings <ChevronRight className="w-5 h-5" />
        </Link>
        <div className="md:hidden">
          <BettingBanner />
        </div>
      </div>
    </section>
  );
}
