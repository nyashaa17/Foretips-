import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';
import { Activity, Trophy, TrendingUp, Clock, CheckCircle, XCircle, Trash2, History, ChevronRight, LayoutDashboard, Shield } from 'lucide-react';
import { getHistory, removeFromHistory, clearHistory } from '../services/api';
import { hapticFeedback } from '../utils/haptics';
import ConfirmationModal from '../components/ConfirmationModal';
import { getTeamLogoUrl } from '../services/api';
import SmartLogo from '../components/SmartLogo';
import AdminDashboard from './AdminDashboard';

function HistoryItem({ item, onDelete }) {
  const event = item.event || item;
  
  const rawHome = event.home_team_obj || event.home_team;
  const home = typeof rawHome === 'string' 
    ? { name: rawHome, id: rawHome } 
    : (rawHome ? { ...rawHome, id: rawHome.id || rawHome.team_id, api_id: rawHome.api_id } : { name: 'Home Team' });
  
  const rawAway = event.away_team_obj || event.away_team;
  const away = typeof rawAway === 'string' 
    ? { name: rawAway, id: rawAway } 
    : (rawAway ? { ...rawAway, id: rawAway.id || rawAway.team_id, api_id: rawAway.api_id } : { name: 'Away Team' });
  
  const homeLogos = [getTeamLogoUrl(home?.api_id)];
  const awayLogos = [getTeamLogoUrl(away?.api_id)];

  return (
    <Link 
      to={`/match/${item.id}`}
      state={{ prediction: item }}
      className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-green-500 transition-all relative"
    >
      <button 
        onClick={(e) => onDelete(e, item.id)}
        className="absolute top-2 right-2 p-1.5 bg-white text-slate-300 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 shadow-sm"
        title="Remove from history"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col items-center gap-1 w-[40%]">
          <SmartLogo 
            urls={homeLogos} 
            alt={home?.name} 
            className="w-6 h-6 object-contain"
            fallbackText={home?.name || 'H'}
          />
          <span className="text-[10px] font-bold text-slate-900 text-center line-clamp-1">{home?.name}</span>
        </div>
        <span className="text-[8px] font-black text-slate-300">VS</span>
        <div className="flex flex-col items-center gap-1 w-[40%]">
          <SmartLogo 
            urls={awayLogos} 
            alt={away?.name} 
            className="w-6 h-6 object-contain"
            fallbackText={away?.name || 'A'}
          />
          <span className="text-[10px] font-bold text-slate-900 text-center line-clamp-1">{away?.name}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <span className="text-[10px] font-black text-green-600">{item.predicted_result}</span>
        <span className="text-[10px] font-bold text-slate-400">{item.most_likely_score}</span>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tips, setTips] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, won: 0, lost: 0, rank: 'Unranked' });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [activeView, setActiveView] = useState('personal'); // 'personal' or 'admin'
  const navigate = useNavigate();

  useEffect(() => {
    // If this is a popup window (e.g., from OAuth), close it and notify the parent
    if (window.opener && window.opener !== window) {
      window.close();
      return;
    }

    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signin');
        return;
      }
      
      setUser(session.user);

      // Fetch user profile
      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (!profileData) {
        const email = session.user.email || '';
        const username = session.user.user_metadata?.user_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0] || 'user';
        
        const { data: newProfile } = await supabase.from('profiles').upsert([{ 
          id: session.user.id, 
          username: username
        }]).select().maybeSingle();
        
        profileData = newProfile;
      }
        
      if (profileData) setProfile(profileData);

      // Fetch user's tips
      const { data: tipsData, error: tipsError } = await supabase
        .from('community_tips')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      console.log('Tips data:', tipsData);
      console.log('Tips error:', tipsError);

      if (tipsData) {
        setTips(tipsData);
        
        const won = tipsData.filter(t => t.status === 'won').length;
        const lost = tipsData.filter(t => t.status === 'lost').length;
        
        // Fetch leaderboard to calculate rank
        const { data: allTips } = await supabase
          .from('community_tips')
          .select('user_id, status')
          .eq('status', 'won');
          
        let rank = 'Unranked';
        if (allTips && won > 0) {
          // Group by user_id and count wins
          const scores = allTips.reduce((acc, tip) => {
            acc[tip.user_id] = (acc[tip.user_id] || 0) + 1;
            return acc;
          }, {});
          
          // Sort scores
          const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
          const userRankIndex = sortedScores.findIndex(([id]) => id === session.user.id);
          
          if (userRankIndex !== -1) {
            rank = `#${userRankIndex + 1}`;
          }
        }

        setStats({
          total: tipsData.length,
          won,
          lost,
          rank
        });
      }

      setLoading(false);
    };
    
    fetchDashboardData();
    setHistory(getHistory());
  }, [navigate]);

  const handleClearHistory = () => {
    setModal({
      isOpen: true,
      title: 'Clear History',
      message: 'Are you sure you want to clear your prediction history?',
      onConfirm: () => {
        clearHistory();
        setHistory([]);
        hapticFeedback('medium');
      }
    });
  };

  const handleDeleteHistoryItem = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromHistory(id);
    setHistory(getHistory());
    hapticFeedback('light');
  };

  const handleDeleteTip = async (id) => {
    setModal({
      isOpen: true,
      title: 'Delete Tip',
      message: 'Are you sure you want to delete this tip? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('community_tips')
            .delete()
            .eq('id', id);

          if (error) throw error;

          setTips(prevTips => prevTips.filter(tip => tip.id !== id));
          hapticFeedback('medium');
          setModal({ ...modal, isOpen: false });
        } catch (err) {
          console.error('Error deleting tip:', err);
          setModal({
            ...modal,
            title: 'Error',
            message: 'Failed to delete tip. Please try again later.',
            onConfirm: () => setModal({ ...modal, isOpen: false })
          });
        }
      }
    });
  };

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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const successRate = stats.won + stats.lost > 0 
    ? Math.round((stats.won / (stats.won + stats.lost)) * 100) 
    : 0;

  const isAdmin = user?.email === 'admin@foretips.co.zw';

  if (activeView === 'admin' && isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 pt-8 md:pt-12">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-fit">
            <button 
              onClick={() => setActiveView('personal')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-500 hover:text-slate-700"
            >
              <Activity className="w-4 h-4" />
              Personal Dashboard
            </button>
            <button 
              onClick={() => setActiveView('admin')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-slate-900 text-white shadow-sm"
            >
              <Shield className="w-4 h-4" />
              Admin Dashboard
            </button>
          </div>
        </div>
        <div className="-mt-4 md:-mt-8">
          <AdminDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="Dashboard" description="Your personal dashboard" />
      
      {isAdmin && (
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-fit mb-8">
          <button 
            onClick={() => setActiveView('personal')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-slate-900 text-white shadow-sm"
          >
            <Activity className="w-4 h-4" />
            Personal Dashboard
          </button>
          <button 
            onClick={() => setActiveView('admin')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-500 hover:text-slate-700"
          >
            <Shield className="w-4 h-4" />
            Admin Dashboard
          </button>
        </div>
      )}

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back, {profile?.username || user?.email.split('@')[0]}!</h1>
          <p className="text-slate-600">Track your prediction performance</p>
        </div>
        <button 
          onClick={() => navigate('/submit-tip')}
          className="hidden md:block px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
        >
          Submit New Tip
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Total Tips</p>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Success Rate</p>
            <p className="text-2xl font-black text-slate-900">{successRate}%</p>
            <p className="text-xs text-slate-500">{stats.won} Won, {stats.lost} Lost</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-yellow-100 p-3 rounded-xl">
            <Trophy className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Leaderboard Rank</p>
            <p className="text-2xl font-black text-slate-900">{stats.rank}</p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg">
              <History className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Recently Viewed Predictions</h2>
          </div>
          {history.length > 0 && (
            <button 
              onClick={handleClearHistory}
              className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-slate-500 font-medium">Your recently viewed predictions will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {history.map((item, index) => (
              <HistoryItem 
                key={`${item.id}-${index}`} 
                item={item} 
                onDelete={handleDeleteHistoryItem} 
              />
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Submitted Tips</h2>
        
        {tips.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Ready to make your first prediction?</h2>
            <p className="text-slate-600 mb-6">Head over to the Submit Tip page to share your football knowledge with the community.</p>
            <button 
              onClick={() => navigate('/submit-tip')}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit a Tip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, index) => {
              const details = parsePrediction(tip.prediction);
              
              let statusColor = "bg-slate-100 text-slate-700";
              let StatusIcon = Clock;
              let statusText = "Pending";
              
              if (tip.status === 'approved') {
                statusColor = "bg-blue-100 text-blue-700";
                statusText = "Active";
              } else if (tip.status === 'rejected') {
                statusColor = "bg-red-100 text-red-700";
                StatusIcon = XCircle;
                statusText = "Rejected";
              } else if (tip.status === 'won') {
                statusColor = "bg-green-100 text-green-700";
                StatusIcon = CheckCircle;
                statusText = "Won";
              } else if (tip.status === 'lost') {
                statusColor = "bg-red-100 text-red-700";
                StatusIcon = XCircle;
                statusText = "Lost";
              }

              return (
                <div key={`${tip.id}-${index}`} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 pr-4">
                      {details.homeTeam && details.awayTeam ? (
                        <div className="flex items-center gap-3 mb-2 min-w-0">
                          <div className="flex items-center gap-2 w-full min-w-0">
                            {details.homeTeamBadge && details.homeTeamBadge.trim() !== "" ? (
                              <img src={details.homeTeamBadge} alt={details.homeTeam} className="w-6 h-6 object-contain shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] border border-slate-200 shrink-0">
                                {details.homeTeam.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-slate-900 text-sm truncate">{details.homeTeam}</span>
                            <span className="text-xs font-black text-slate-300 mx-1 shrink-0">v</span>
                            <span className="font-bold text-slate-900 text-sm truncate">{details.awayTeam}</span>
                            {details.awayTeamBadge && details.awayTeamBadge.trim() !== "" ? (
                              <img src={details.awayTeamBadge} alt={details.awayTeam} className="w-6 h-6 object-contain shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] border border-slate-200 shrink-0">
                                {details.awayTeam.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">
                          {tip.match_id}
                        </h3>
                      )}
                      
                      {details.kickoffTime && (
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(details.kickoffTime)}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusColor} shrink-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusText}
                    </div>
                    <button 
                      onClick={() => handleDeleteTip(tip.id)}
                      className="ml-2 p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                      title="Delete Tip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prediction</span>
                      {details.odds && (
                        <div className="flex items-center gap-2">
                          {details.bookmaker && (
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {details.bookmaker}
                            </span>
                          )}
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                            @{details.odds}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-900 font-bold text-lg">{details.market}</p>
                  </div>
                  
                  <div className="text-xs text-slate-400 text-right">
                    Submitted on {formatDate(tip.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="md:hidden mt-8">
        <button 
          onClick={() => navigate('/submit-tip')}
          className="w-full px-6 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
        >
          Submit New Tip
        </button>
      </div>
      <ConfirmationModal 
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}
