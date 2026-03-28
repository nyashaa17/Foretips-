import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { getPredictions, getTeamLogoUrl } from '../services/api';
import SmartLogo from './SmartLogo';

export default function MatchPollCarousel() {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState('Initializing...');
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setDebugInfo('Fetching predictions...');
        // Fetch predictions for major leagues
        const data = await getPredictions({ limit: 50 });
        
        if (!data || data.length === 0) {
          setDebugInfo('No matches found.');
        } else {
          setDebugInfo(`Loaded ${data.length} matches`);
        }
        
        // Relaxed filtering: if no matches found, show all
        let filteredMatches = data || [];
        
        const majorLeagues = [
          'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 
          'Brasileirão Serie A', 'Liga Portugal Betclic', 'Eredivisie', 'Championship',
          'Primeira Liga', 'Major League Soccer'
        ];
        
        const sortMatches = (arr) => {
          return arr.sort((a, b) => {
            const maxProbA = Math.max(a.prob_home_win || 0, a.prob_away_win || 0);
            const maxProbB = Math.max(b.prob_home_win || 0, b.prob_away_win || 0);
            return maxProbB - maxProbA;
          });
        };

        const prioritized = (data || []).filter(m => {
          const leagueName = m.league?.name || m.league_name || m.event?.league?.name;
          return majorLeagues.includes(leagueName);
        });
        
        if (prioritized.length > 0) {
          filteredMatches = sortMatches(prioritized);
        } else {
          filteredMatches = sortMatches(filteredMatches);
        }
        
        // Prioritize and take the first 5
        setMatches(filteredMatches.slice(0, 5));
      } catch (error) {
        setDebugInfo(`Error: ${error.message}`);
        console.error('Error fetching matches:', error);
      }
    };
    fetchMatches();
  }, []);

  const [pollResults, setPollResults] = useState({ total_votes: 0, home_pct: 0, draw_pct: 0, away_pct: 0 });
  const [userVote, setUserVote] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch poll results and user's vote
  const fetchData = async () => {
    if (matches.length === 0) return;
    const matchId = matches[currentIndex].id;

    // 1. Fetch aggregated results
    let results = null;
    let resultsError = null;
    try {
      const res = await supabase
        .from('match_poll_results')
        .select('*')
        .eq('match_id', matchId)
        .maybeSingle();
      results = res.data;
      resultsError = res.error;
    } catch (err) {
      resultsError = err;
    }
    
    if (resultsError) {
      const errorMsg = resultsError.message || String(resultsError);
      if (errorMsg.includes('Failed to fetch')) {
        console.warn('Supabase connection failed. Using local state for polls.');
      } else {
        console.error(`Error fetching results: ${errorMsg}`);
      }
    }
    
    setPollResults(results || { total_votes: 0, home_pct: 0, draw_pct: 0, away_pct: 0 });

    // 2. Fetch current user's vote
    if (user) {
      let voteData = null;
      let voteError = null;
      try {
        const res = await supabase
          .from('match_polls')
          .select('vote')
          .eq('match_id', matchId)
          .eq('user_id', user.id)
          .maybeSingle();
        voteData = res.data;
        voteError = res.error;
      } catch (err) {
        voteError = err;
      }
        
      if (voteError) {
        const errorMsg = voteError.message || String(voteError);
        if (!errorMsg.includes('Failed to fetch')) {
          console.error(`Error fetching user vote: ${errorMsg}`);
        }
      }
      
      const localVote = localStorage.getItem(`vote_${matchId}`);
      setUserVote(voteData?.vote || localVote || null);
      
      // If we have a local vote but no DB vote, optimistically add it to the results
      if (!voteData?.vote && localVote) {
        setPollResults(prev => {
          const currentTotal = prev.total_votes || 0;
          const newTotal = currentTotal + 1;
          
          let newHomeVotes = (prev.home_percent || 0) / 100 * currentTotal;
          let newDrawVotes = (prev.draw_percent || 0) / 100 * currentTotal;
          let newAwayVotes = (prev.away_percent || 0) / 100 * currentTotal;
          
          if (localVote === 'home') newHomeVotes++;
          if (localVote === 'draw') newDrawVotes++;
          if (localVote === 'away') newAwayVotes++;
          
          return {
            ...prev,
            total_votes: newTotal,
            home_percent: (newHomeVotes / newTotal) * 100,
            draw_percent: (newDrawVotes / newTotal) * 100,
            away_percent: (newAwayVotes / newTotal) * 100,
          };
        });
      }
    }
  };

  useEffect(() => {
    fetchData();

    // 3. Setup Realtime subscription
    const channel = supabase
      .channel('poll_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'match_polls',
        filter: `match_id=eq.${matches[currentIndex]?.id}` 
      }, (payload) => {
        console.log('[MatchPoll] Realtime update received:', payload);
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentIndex, matches, user]);

  const totalVotes = pollResults.total_votes;
  
  const match = matches[currentIndex];
  const event = match?.event || {};
  
  const rawHome = event?.home_team_obj || event?.home_team;
  const home_team = typeof rawHome === 'string' 
    ? { name: rawHome, id: rawHome } 
    : (rawHome ? { ...rawHome, id: rawHome.id || rawHome.team_id, api_id: rawHome.api_id } : { name: 'Home Team' });
    
  const rawAway = event?.away_team_obj || event?.away_team;
  const away_team = typeof rawAway === 'string' 
    ? { name: rawAway, id: rawAway } 
    : (rawAway ? { ...rawAway, id: rawAway.id || rawAway.team_id, api_id: rawAway.api_id } : { name: 'Away Team' });

  const homeLogos = [getTeamLogoUrl(home_team?.api_id)];
  const awayLogos = [getTeamLogoUrl(away_team?.api_id)];

  // Blend user votes with base probabilities to prevent 0% or 100% jumps on first few votes
  // We treat the base probability as "10 virtual votes" to anchor the initial state
  const VIRTUAL_VOTES = 10;
  const totalWeight = VIRTUAL_VOTES + totalVotes;
  
  const baseHome = match?.prob_home_win || 33;
  const baseDraw = match?.prob_draw || 33;
  const baseAway = match?.prob_away_win || (100 - baseHome - baseDraw);

  const actualHomeVotes = totalVotes > 0 ? (pollResults.home_percent || pollResults.home_pct || 0) / 100 * totalVotes : 0;
  const actualDrawVotes = totalVotes > 0 ? (pollResults.draw_percent || pollResults.draw_pct || 0) / 100 * totalVotes : 0;
  const actualAwayVotes = totalVotes > 0 ? (pollResults.away_percent || pollResults.away_pct || 0) / 100 * totalVotes : 0;

  const homePercentage = Math.round(((baseHome / 100 * VIRTUAL_VOTES) + actualHomeVotes) / totalWeight * 100);
  const drawPercentage = Math.round(((baseDraw / 100 * VIRTUAL_VOTES) + actualDrawVotes) / totalWeight * 100);
  const awayPercentage = 100 - homePercentage - drawPercentage;
  

  const handleVote = async (vote) => {
    if (!user) {
      navigate('/signup');
      return;
    }
    
    setIsVoting(true);
    const matchId = matches[currentIndex].id;
    
    // Try insert first, then update if it fails (in case upsert is failing due to missing unique constraint)
    const { data: existingVote } = await supabase
      .from('match_polls')
      .select('id')
      .eq('match_id', matchId)
      .eq('user_id', user.id)
      .maybeSingle();

    let error;
    if (existingVote) {
      const { error: updateError } = await supabase
        .from('match_polls')
        .update({ vote })
        .eq('id', existingVote.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('match_polls')
        .insert({ match_id: matchId, user_id: user.id, vote });
      error = insertError;
    }

    if (error) {
      const errorMsg = error.message || String(error);
      if (errorMsg.includes('row-level security') || errorMsg.includes('Failed to fetch')) {
        setDebugInfo(errorMsg.includes('Failed to fetch') ? 'Connection Error: Vote saved locally.' : 'RLS Error: Vote saved locally. Please configure Supabase RLS.');
        // Fallback to local storage so the user can see it working
        localStorage.setItem(`vote_${matchId}`, vote);
        setUserVote(vote);
        
        // Optimistically update the UI
        setPollResults(prev => {
          const currentTotal = prev.total_votes || 0;
          const newTotal = currentTotal + 1;
          
          let newHomeVotes = (prev.home_percent || 0) / 100 * currentTotal;
          let newDrawVotes = (prev.draw_percent || 0) / 100 * currentTotal;
          let newAwayVotes = (prev.away_percent || 0) / 100 * currentTotal;
          
          if (vote === 'home') newHomeVotes++;
          if (vote === 'draw') newDrawVotes++;
          if (vote === 'away') newAwayVotes++;
          
          return {
            ...prev,
            total_votes: newTotal,
            home_percent: (newHomeVotes / newTotal) * 100,
            draw_percent: (newDrawVotes / newTotal) * 100,
            away_percent: (newAwayVotes / newTotal) * 100,
          };
        });
        
        if (errorMsg.includes('Failed to fetch')) {
          alert('Vote saved locally! We could not connect to the database. Please check your internet connection or Supabase configuration.');
        } else {
          alert('Vote saved locally! To save permanently, you must configure Row Level Security (RLS) in your Supabase dashboard.');
        }
      } else {
        alert('Error voting: ' + errorMsg);
      }
    } else {
      setUserVote(vote);
      // Manually trigger a fetch just in case realtime is slow or failing
      fetchData();
    }
    setIsVoting(false);
  };

  const next = () => setCurrentIndex((prev) => (prev + 1) % matches.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length);

  if (matches.length === 0) {
    return (
      <section className="py-8 text-center">
        <div className="w-full max-w-lg mx-auto h-64 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 text-xs p-4">
          {debugInfo}
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Match Poll of the Day</h2>      <div className="relative flex items-center justify-center px-4">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={matches[currentIndex].id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-[#1e293b] p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden"
            >
              <button onClick={prev} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full text-slate-900 hover:bg-slate-100 transition-all shadow-lg"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={next} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full text-slate-900 hover:bg-slate-100 transition-all shadow-lg"><ChevronRight className="w-6 h-6" /></button>
              
              {/* Header: Time and League */}
              <div className="flex justify-between items-center text-slate-400 text-sm sm:text-base font-medium mb-8 px-2">
                <span>{match?.event?.event_date ? new Date(match.event.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '21:45'}</span>
                <span className="truncate">{match?.event?.league?.name || 'Serie A'}</span>
              </div>

              {/* Matchup: Logos, Names, and Score */}
              <div className="flex justify-between items-center mb-10 px-4">
                <div className="flex flex-col items-center text-center w-1/3">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center">
                    <SmartLogo 
                      urls={homeLogos} 
                      alt={home_team?.name} 
                      className="w-full h-full object-contain drop-shadow-md"
                      fallbackText={home_team?.name || 'H'}
                    />
                  </div>
                  <span className="font-bold text-sm sm:text-base leading-tight text-white">{home_team?.name}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center w-1/3">
                  <div className="text-4xl sm:text-5xl font-black text-white">
                    -
                  </div>
                </div>

                <div className="flex flex-col items-center text-center w-1/3">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center">
                    <SmartLogo 
                      urls={awayLogos} 
                      alt={away_team?.name} 
                      className="w-full h-full object-contain drop-shadow-md"
                      fallbackText={away_team?.name || 'A'}
                    />
                  </div>
                  <span className="font-bold text-sm sm:text-base leading-tight text-white">{away_team?.name}</span>
                </div>
              </div>

              {/* Fan Votes */}
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium mb-6">
                {totalVotes} Fans voted
              </div>

              {/* Percentage Bars */}
              <div className="space-y-4 mb-10 px-2">
                <div className="flex justify-between text-sm font-bold text-white mb-2">
                  <span>{home_team?.name} {homePercentage}%</span>
                  <span>Draw {drawPercentage}%</span>
                  <span>{away_team?.name} {awayPercentage}%</span>
                </div>
                <div className="flex h-3.5 rounded-full overflow-hidden bg-slate-700">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${homePercentage}%` }} className="bg-[#e11d48]" />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${drawPercentage}%` }} className="bg-[#64748b]" />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${awayPercentage}%` }} className="bg-[#0891b2]" />
                </div>
              </div>

              {/* Vote Buttons */}
              <div className="flex justify-center gap-3 sm:gap-4 px-2">
                <button onClick={() => handleVote('home')} disabled={isVoting} className={`flex-1 py-3 sm:py-4 bg-[#e11d48] text-white rounded-xl font-bold text-sm sm:text-base hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${userVote === 'home' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e293b]' : ''}`}>Home</button>
                <button onClick={() => handleVote('draw')} disabled={isVoting} className={`flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-xl font-bold text-sm sm:text-base hover:bg-slate-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${userVote === 'draw' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e293b]' : ''}`}>Draw</button>
                <button onClick={() => handleVote('away')} disabled={isVoting} className={`flex-1 py-3 sm:py-4 bg-[#0891b2] text-white rounded-xl font-bold text-sm sm:text-base hover:bg-cyan-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${userVote === 'away' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e293b]' : ''}`}>Away</button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
