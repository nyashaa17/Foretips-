import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MessageCircle, Clock, TrendingUp, Users, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function CommunityTipsPreview() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTips = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('community_tips')
          .select('*, profiles(username)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(3);
        if (data) setTips(data);
      } catch (error) {
        console.error("Error fetching community tips:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTips();
  }, []);

  const parsePrediction = (predictionStr) => {
    try {
      return JSON.parse(predictionStr);
    } catch (e) {
      return { market: predictionStr };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <section id="community-tips" className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg shadow-sm shadow-blue-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Expert Tips
          </h2>
        </div>
        <Link 
          to="/submit-tip" 
          className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-md shadow-slate-900/10"
        >
          <MessageCircle className="w-4 h-4" />
          Share Your Tip
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 h-64 animate-pulse flex flex-col justify-between">
              <div>
                <div className="h-6 bg-slate-200 rounded-md w-3/4 mb-4"></div>
                <div className="h-20 bg-slate-100 rounded-xl mb-4"></div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tips.map((tip, index) => {
            const details = parsePrediction(tip.prediction);
            
            return (
              <motion.div 
                key={`${tip.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
              >
                {/* Decorative background element */}
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="mb-5">
                    {details.homeTeam && details.awayTeam ? (
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col items-center gap-2 w-2/5">
                          {details.homeTeamBadge && details.homeTeamBadge.trim() !== "" ? (
                            <img src={details.homeTeamBadge} alt={details.homeTeam} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200">
                              {details.homeTeam.substring(0, 3).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-slate-900 text-sm text-center line-clamp-2 leading-tight">{details.homeTeam}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center w-1/5">
                          <span className="text-xs font-black text-slate-300 bg-slate-50 px-2 py-1 rounded-md">VS</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-2/5">
                          {details.awayTeamBadge && details.awayTeamBadge.trim() !== "" ? (
                            <img src={details.awayTeamBadge} alt={details.awayTeam} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-200">
                              {details.awayTeam.substring(0, 3).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-slate-900 text-sm text-center line-clamp-2 leading-tight">{details.awayTeam}</span>
                        </div>
                      </div>
                    ) : (
                      <h3 className="font-black text-slate-900 text-xl leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                        {tip.match_id}
                      </h3>
                    )}
                    
                    {details.kickoffTime && (
                      <div className="flex items-center justify-center text-xs font-medium text-slate-500 bg-slate-100 w-fit mx-auto px-3 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {formatDate(details.kickoffTime)}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 mb-5 border border-slate-200/60 flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Prediction</span>
                      {details.odds && (
                        <div className="flex items-center gap-2">
                          {details.bookmaker && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {details.bookmaker}
                            </span>
                          )}
                          <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                            @{details.odds}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-900 font-black text-lg">{details.market}</p>
                    
                    {details.reasoning && (
                      <div className="mt-4 pt-4 border-t border-slate-200/60">
                        <p className="text-sm text-slate-600 line-clamp-3 italic font-medium">
                          "{details.reasoning}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm border border-blue-200">
                      {tip.profiles?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="font-bold text-slate-700 text-sm">{tip.profiles?.username || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-black text-xs border border-emerald-100">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {tip.confidence}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No expert tips yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Be the first to share your expert football knowledge and predictions.</p>
          <Link 
            to="/submit-tip" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <MessageCircle className="w-5 h-5" />
            Submit a Tip Now
          </Link>
        </div>
      )}

      <div className="mt-8 flex justify-center md:hidden">
        <Link 
          to="/submit-tip" 
          className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Share Your Tip
        </Link>
      </div>
    </section>
  );
}
