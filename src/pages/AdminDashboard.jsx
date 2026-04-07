import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';
import { CheckCircle, XCircle, Clock, User, AlertCircle, TrendingUp, Trophy, Megaphone, LayoutDashboard, FileText, Star } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { Link } from 'react-router-dom';
import BlogManager from '../components/BlogManager';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('tips'); // 'tips', 'featured', 'blogs'
  const [tips, setTips] = useState([]);
  const [featuredMatches, setFeaturedMatches] = useState([]);
  const [newMatchId, setNewMatchId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending' or 'approved'
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [selectedTips, setSelectedTips] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === 'admin@foretips.co.zw') {
        setIsAdmin(true);
      }
    };
    checkAdmin();
    fetchTips();
    fetchFeaturedMatches();
  }, [filter]);

  const toggleTipSelection = (id) => {
    setSelectedTips(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (status) => {
    if (selectedTips.length === 0) return;
    
    setModal({
      isOpen: true,
      title: `Bulk ${status === 'delete' ? 'Delete' : status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Are you sure you want to ${status === 'delete' ? 'delete' : 'set status to ' + status} for ${selectedTips.length} tips?`,
      onConfirm: async () => {
        try {
          if (status === 'delete') {
            const { error } = await supabase.from('community_tips').delete().in('id', selectedTips);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('community_tips').update({ status }).in('id', selectedTips);
            if (error) throw error;
          }
          setSelectedTips([]);
          fetchTips();
          setModal({ ...modal, isOpen: false });
        } catch (err) {
          alert('Error performing bulk action: ' + err.message);
        }
      }
    });
  };

  const deleteTip = async (id) => {
    setModal({
      isOpen: true,
      title: 'Delete Tip',
      message: 'Are you sure you want to delete this tip? This cannot be undone.',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('community_tips').delete().eq('id', id);
          if (error) throw error;
          fetchTips();
          setModal({ ...modal, isOpen: false });
        } catch (err) {
          alert('Error deleting tip: ' + err.message);
        }
      }
    });
  };

  const fetchFeaturedMatches = async () => {
    const { data, error } = await supabase
      .from('featured_matches')
      .select('*')
      .eq('is_active', true);
    
    if (data) {
      // Fetch details for each match
      const matchesWithDetails = await Promise.all(data.map(async (m) => {
        try {
          const response = await fetch(`/football-api/matches/${m.match_id}`);
          const apiData = await response.json();
          if (apiData && apiData.id) {
            return { ...m, details: apiData };
          }
        } catch (e) {
          console.error("Error fetching match details", e);
        }
        return m;
      }));
      setFeaturedMatches(matchesWithDetails);
    }
  };

  const addFeaturedMatch = async (e) => {
    e.preventDefault();
    if (!newMatchId) return;
    const { error } = await supabase.from('featured_matches').insert({ match_id: newMatchId });
    if (error) alert('Error adding match: ' + error.message);
    else {
      setNewMatchId('');
      fetchFeaturedMatches();
    }
  };

  const removeFeaturedMatch = async (id) => {
    const { error } = await supabase.from('featured_matches').delete().eq('id', id);
    if (error) alert('Error removing match: ' + error.message);
    else fetchFeaturedMatches();
  };

  const resetAllPolls = async () => {
    setModal({
      isOpen: true,
      title: 'Reset All Polls',
      message: 'Are you sure you want to reset ALL poll votes? This cannot be undone.',
      onConfirm: async () => {
        const { error } = await supabase.from('match_polls').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) alert('Error resetting polls: ' + error.message);
        else alert('All polls reset successfully.');
      }
    });
  };

  const resetLeaderboard = async () => {
    if (!isAdmin) {
      alert('Unauthorized: Only admins can perform this action.');
      return;
    }
    
    setModal({
      isOpen: true,
      title: 'Reset Leaderboard',
      message: 'Are you sure you want to reset the leaderboard? This will clear all wins, tips, and success rates for every user. This cannot be undone.',
      onConfirm: async () => {
        try {
          // Since leaderboard is derived from community_tips, we delete all tips to reset stats
          const { error } = await supabase.from('community_tips').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          if (error) throw error;
          alert('Leaderboard has been reset successfully.');
          fetchTips();
          setModal({ ...modal, isOpen: false });
        } catch (err) {
          alert('Error resetting leaderboard: ' + err.message);
        }
      }
    });
  };

  const fetchTips = async () => {
    setLoading(true);
    try {
      console.log('Fetching tips with filter:', filter);
      const { data, error: fetchError } = await supabase
        .from('community_tips')
        .select('*, profiles(username)')
        .eq('status', filter)
        .order('created_at', { ascending: false });
        
      console.log('Fetch result:', { data, fetchError });
      if (fetchError) throw fetchError;
      if (data) setTips(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      const { error: updateError } = await supabase.from('community_tips').update({ status }).eq('id', id);
      if (updateError) throw updateError;
      setTips(tips.filter(t => t.id !== id));
    } catch (err) {
      alert('Error updating tip: ' + err.message);
    }
  };

  const autoSettleTips = async () => {
    setLoading(true);
    try {
      // 1. Fetch fixtures for today (or recent)
      const date = new Date().toISOString().split('T')[0];
      const response = await fetch(`/football-api/matches?dateFrom=${date}&dateTo=${date}`);
      const data = await response.json();
      
      if (!data.matches) throw new Error("No fixtures found.");

      // 2. Loop through active tips
      for (const tip of tips) {
        const details = parsePrediction(tip.prediction);
        
        // Find the corresponding match in the API results
        const match = data.matches.find(m => 
          (m.homeTeam.name === details.homeTeam && m.awayTeam.name === details.awayTeam) ||
          (m.homeTeam.shortName === details.homeTeam && m.awayTeam.shortName === details.awayTeam)
        );

        if (match && match.status === 'FINISHED') {
          // 3. Determine if they won or lost
          let status = 'lost';
          const homeScore = match.score.fullTime.home;
          const awayScore = match.score.fullTime.away;
          
          // Simplified logic: adjust based on market
          if (details.market === 'Home Win' && homeScore > awayScore) status = 'won';
          else if (details.market === 'Away Win' && awayScore > homeScore) status = 'won';
          else if (details.market === 'Draw' && homeScore === awayScore) status = 'won';

          // 4. Update Supabase
          await supabase
            .from('community_tips')
            .update({ status: status })
            .eq('id', tip.id);
        }
      }
      
      alert("Auto-settlement complete!");
      fetchTips(); // Refresh the list
    } catch (err) {
      console.error(err);
      alert("Error auto-settling: " + err.message);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
      <SEO title="Admin Dashboard" description="Manage community tips and blog content" />
      
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
          
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('tips')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tips' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Tips
            </button>
            <button 
              onClick={() => setActiveTab('featured')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'featured' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Star className="w-4 h-4" />
              Featured
            </button>
            <button 
              onClick={() => setActiveTab('blogs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'blogs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText className="w-4 h-4" />
              Blogs
            </button>
          </div>
        </div>

        {activeTab === 'blogs' && <BlogManager />}

        {activeTab === 'featured' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Manage Featured Matches</h2>
            <form onSubmit={addFeaturedMatch} className="flex flex-wrap gap-4 mb-6">
              <input 
                type="text" 
                value={newMatchId}
                onChange={(e) => setNewMatchId(e.target.value)}
                placeholder="Enter Match ID"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg"
              />
              <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Add Match</button>
            </form>
            <div className="space-y-2">
              {featuredMatches.map(m => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="font-mono text-sm">
                    {m.details?.homeTeam?.name ? `${m.details.homeTeam.name} vs ${m.details.awayTeam.name}` : m.match_id}
                  </span>
                  <button onClick={() => removeFeaturedMatch(m.id)} className="text-red-500 hover:text-red-700 font-bold text-sm">Remove</button>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200">
              <button onClick={resetAllPolls} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Reset All Poll Votes</button>
            </div>
          </div>
        )}

        {activeTab === 'tips' && (
          <>
            {/* Existing Tips Management */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Tips Moderation</h2>
                
                {/* Debug Info */}
                <div className="bg-yellow-100 p-2 text-xs rounded-lg mt-2 md:mt-0">
                  Filter: {filter}, Tips Count: {tips.length}, Loading: {loading ? 'Yes' : 'No'}
                  {error && <div className="text-red-600 font-bold mt-1">Error: {error}</div>}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedTips.length > 0 && (
                  <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg">
                    <span className="text-sm font-bold">{selectedTips.length} selected:</span>
                    {filter === 'pending' && (
                      <>
                        <button onClick={() => handleBulkAction('approved')} className="text-xs font-bold bg-green-600 px-2 py-1 rounded hover:bg-green-700">Approve</button>
                        <button onClick={() => handleBulkAction('rejected')} className="text-xs font-bold bg-red-600 px-2 py-1 rounded hover:bg-red-700">Reject</button>
                      </>
                    )}
                    {filter === 'approved' && (
                      <>
                        <button onClick={() => handleBulkAction('won')} className="text-xs font-bold bg-green-600 px-2 py-1 rounded hover:bg-green-700">Mark Won</button>
                        <button onClick={() => handleBulkAction('lost')} className="text-xs font-bold bg-red-600 px-2 py-1 rounded hover:bg-red-700">Mark Lost</button>
                      </>
                    )}
                    {(filter === 'won' || filter === 'lost' || filter === 'rejected') && (
                      <button onClick={() => handleBulkAction('pending')} className="text-xs font-bold bg-blue-600 px-2 py-1 rounded hover:bg-blue-700">Revert</button>
                    )}
                    <button onClick={() => handleBulkAction('delete')} className="text-xs font-bold bg-red-800 px-2 py-1 rounded hover:bg-red-900">Delete</button>
                  </div>
                )}
                <button 
                  onClick={autoSettleTips}
                  className="flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-green-600 text-white hover:bg-green-700"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Auto-Settle
                </button>
                <Link 
                  to="/admin/ads"
                  className="flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  Manage Ads
                </Link>
                {isAdmin && (
                  <button 
                    onClick={resetLeaderboard}
                    className="flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-colors bg-red-600 text-white hover:bg-red-700"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Reset Leaderboard
                  </button>
                )}
                <button 
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'pending' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Pending
                </button>
                <button 
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'approved' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setFilter('won')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'won' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Won
                </button>
                <button 
                  onClick={() => setFilter('lost')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'lost' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Lost
                </button>
                <button 
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'rejected' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Rejected
                </button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200 flex items-start">
                <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">Error loading tips</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <input 
                        type="checkbox" 
                        checked={tips.length > 0 && selectedTips.length === tips.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTips(tips.map(t => t.id));
                          } else {
                            setSelectedTips([]);
                          }
                        }}
                        className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Match</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Prediction</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reasoning</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-8 h-8 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
                          <p className="font-medium">Loading tips...</p>
                        </div>
                      </td>
                    </tr>
                  ) : tips.map((tip, index) => {
                    const details = parsePrediction(tip.prediction);
                    return (
                      <tr key={`${tip.id}-${index}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedTips.includes(tip.id)}
                            onChange={() => toggleTipSelection(tip.id)}
                            className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3 flex-shrink-0">
                              {tip.profiles?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{tip.profiles?.username || 'Unknown'}</div>
                              <div className="text-xs text-slate-500 flex items-center mt-0.5">
                                <TrendingUp className="w-3 h-3 mr-1" /> {tip.confidence}% Conf.
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {details.homeTeam && details.awayTeam ? (
                            <div>
                              <div className="text-sm font-bold text-slate-900">{details.homeTeam} vs {details.awayTeam}</div>
                              {details.kickoffTime && (
                                <div className="text-xs text-slate-500 flex items-center mt-1">
                                  <Clock className="w-3 h-3 mr-1" /> {formatDate(details.kickoffTime)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm font-medium text-slate-900">{tip.match_id}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">
                            {details.market}
                            {details.odds && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-md">
                                @{details.odds}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600 max-w-xs truncate" title={details.reasoning}>
                            {details.reasoning ? `"${details.reasoning}"` : <span className="text-slate-400 italic">No reasoning provided</span>}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {filter === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleAction(tip.id, 'approved')} 
                                  className="flex items-center text-green-700 font-bold text-sm px-3 py-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                                </button>
                                <button 
                                  onClick={() => handleAction(tip.id, 'rejected')} 
                                  className="flex items-center text-red-700 font-bold text-sm px-3 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" /> Reject
                                </button>
                              </>
                            )}
                            {filter === 'approved' && (
                              <>
                                <button 
                                  onClick={() => handleAction(tip.id, 'won')} 
                                  className="flex items-center text-green-700 font-bold text-sm px-3 py-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                  <Trophy className="w-4 h-4 mr-1.5" /> Mark Won
                                </button>
                                <button 
                                  onClick={() => handleAction(tip.id, 'lost')} 
                                  className="flex items-center text-red-700 font-bold text-sm px-3 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" /> Mark Lost
                                </button>
                              </>
                            )}
                            {(filter === 'won' || filter === 'lost' || filter === 'rejected') && (
                              <button 
                                onClick={() => handleAction(tip.id, 'pending')} 
                                className="flex items-center text-blue-700 font-bold text-sm px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                <Clock className="w-4 h-4 mr-1.5" /> Revert
                              </button>
                            )}
                            <button 
                              onClick={() => deleteTip(tip.id)}
                              className="flex items-center text-red-900 font-bold text-sm px-3 py-2 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-1.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && tips.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        <div className="bg-slate-50 rounded-xl p-8 max-w-sm mx-auto border border-slate-200 border-dashed">
                          <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="font-bold text-slate-700">All caught up!</p>
                          <p className="text-sm mt-1">No {filter} tips to review right now.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
              {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="font-medium text-slate-500">Loading tips...</p>
                </div>
              ) : tips.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700">All caught up!</p>
                  <p className="text-sm text-slate-500 mt-1">No {filter} tips to review.</p>
                </div>
              ) : (
                tips.map((tip, index) => {
                  const details = parsePrediction(tip.prediction);
                  return (
                    <div key={`${tip.id}-${index}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-5 border-b border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={selectedTips.includes(tip.id)}
                              onChange={() => toggleTipSelection(tip.id)}
                              className="w-5 h-5 text-green-600 rounded border-slate-300 focus:ring-green-500 mr-3"
                            />
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3">
                              {tip.profiles?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{tip.profiles?.username || 'Unknown'}</div>
                              <div className="text-xs text-slate-500 flex items-center mt-0.5">
                                <TrendingUp className="w-3 h-3 mr-1" /> {tip.confidence}% Confidence
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          {details.homeTeam && details.awayTeam ? (
                            <>
                              <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">
                                {details.homeTeam} vs {details.awayTeam}
                              </h3>
                              {details.kickoffTime && (
                                <div className="text-xs font-medium text-slate-500 flex items-center">
                                  <Clock className="w-3.5 h-3.5 mr-1.5" /> {formatDate(details.kickoffTime)}
                                </div>
                              )}
                            </>
                          ) : (
                            <h3 className="font-black text-slate-900 text-lg">{tip.match_id}</h3>
                          )}
                        </div>

                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prediction</div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{details.market}</span>
                            {details.odds && (
                              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">
                                @{details.odds}
                              </span>
                            )}
                          </div>
                        </div>

                        {details.reasoning && (
                          <div className="text-sm text-slate-600 italic bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            "{details.reasoning}"
                          </div>
                        )}
                      </div>
                      
                      <div className="flex p-3 gap-3 bg-slate-50">
                        {filter === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleAction(tip.id, 'rejected')} 
                              className="flex-1 flex justify-center items-center text-red-700 font-bold text-sm py-2.5 bg-red-100/50 rounded-xl hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-1.5" /> Reject
                            </button>
                            <button 
                              onClick={() => handleAction(tip.id, 'approved')} 
                              className="flex-1 flex justify-center items-center text-green-700 font-bold text-sm py-2.5 bg-green-200/50 rounded-xl hover:bg-green-200 transition-colors shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                            </button>
                          </>
                        )}
                        {filter === 'approved' && (
                          <>
                            <button 
                              onClick={() => handleAction(tip.id, 'lost')} 
                              className="flex-1 flex justify-center items-center text-red-700 font-bold text-sm py-2.5 bg-red-100/50 rounded-xl hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-4 h-4 mr-1.5" /> Mark Lost
                            </button>
                            <button 
                              onClick={() => handleAction(tip.id, 'won')} 
                              className="flex-1 flex justify-center items-center text-green-700 font-bold text-sm py-2.5 bg-green-200/50 rounded-xl hover:bg-green-200 transition-colors shadow-sm"
                            >
                              <Trophy className="w-4 h-4 mr-1.5" /> Mark Won
                            </button>
                          </>
                        )}
                        {(filter === 'won' || filter === 'lost' || filter === 'rejected') && (
                          <button 
                            onClick={() => handleAction(tip.id, 'pending')} 
                            className="flex-1 flex justify-center items-center text-blue-700 font-bold text-sm py-2.5 bg-blue-100/50 rounded-xl hover:bg-blue-100 transition-colors"
                          >
                            <Clock className="w-4 h-4 mr-1.5" /> Revert
                          </button>
                        )}
                        <button 
                          onClick={() => deleteTip(tip.id)}
                          className="flex-1 flex justify-center items-center text-red-900 font-bold text-sm py-2.5 bg-red-200/50 rounded-xl hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
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
