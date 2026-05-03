import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Users } from 'lucide-react';
import { getPredictions, getTeamLogoUrl, getMemoryCache, getPredictionsCacheKey } from '../services/api';
import SmartLogo from './SmartLogo';

export default function MatchPollCarousel() {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState('Initializing...');
  
  // Initialize from cache if available
  const [matches, setMatches] = useState(() => {
    const cacheKey = getPredictionsCacheKey({ limit: 50 });
    const cachedData = getMemoryCache(cacheKey);
    if (!cachedData) return [];
    
    const cached = Array.isArray(cachedData) ? cachedData : (cachedData.results || []);
    
    let filteredMatches = cached || [];
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

    const prioritized = (cached || []).filter(m => {
      const leagueName = m.league?.name || m.league_name || m.event?.league?.name;
      return majorLeagues.includes(leagueName);
    });
    
    if (prioritized.length > 0) {
      filteredMatches = sortMatches(prioritized);
    } else {
      filteredMatches = sortMatches(filteredMatches);
    }
    
    return filteredMatches.slice(0, 5);
  });
  
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      // Skip fetch if we already loaded from cache
      if (matches.length > 0) return;
      
      try {
        setDebugInfo('Fetching predictions...');
        // Fetch predictions for major leagues
        const rawData = await getPredictions({ limit: 50 });
        const data = Array.isArray(rawData) ? rawData : (rawData?.results || []);
        
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
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.warn('Error getting user:', error.message);
      }
      setUser(user);
    }).catch(err => {
      console.warn('Exception getting user:', err);
    });
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

  const homeLogos = [getTeamLogoUrl(home_team?.id)];
  const awayLogos = [getTeamLogoUrl(away_team?.id)];

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
    
    // Automatically advance to the next poll after a short delay
    setTimeout(() => {
      next();
    }, 1000);
  };

  const next = () => setCurrentIndex((prev) => (prev + 1) % matches.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length);

  if (matches.length === 0) {
    return (
      <section className="py-12">
        <div className="w-full max-w-xl mx-auto aspect-square bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-bold text-lg">Loading predictions...</p>
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
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x;
                if (swipe < -10000 || offset.x < -50) {
                  next();
                } else if (swipe > 10000 || offset.x > 50) {
                  prev();
                }
              }}
              className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl text-slate-900 border border-slate-200 relative overflow-hidden min-h-[420px] flex flex-col justify-between cursor-grab active:cursor-grabbing"
            >
              
              {/* Header: Date, Time and League */}
              <div className="flex justify-between items-center text-slate-500 text-xs sm:text-sm font-medium px-1 mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span>{match?.event?.event_date ? new Date(match.event.event_date).toLocaleDateString([], {day: 'numeric', month: 'short'}) : 'Today'}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span>{match?.event?.event_date ? new Date(match.event.event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '21:45'}</span>
                </div>
                <span className="truncate ml-2">{match?.event?.league?.name || 'Unknown League'}</span>
              </div>

              {/* Matchup: Logos, Names, and Score */}
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col items-center text-center w-1/3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mb-1 sm:mb-2 flex items-center justify-center">
                    <SmartLogo 
                      urls={homeLogos} 
                      alt={home_team?.name} 
                      className="w-full h-full object-contain drop-shadow-sm"
                      fallbackText={home_team?.name || 'H'}
                    />
                  </div>
                  <span className="font-bold text-xs sm:text-sm leading-tight text-slate-900 line-clamp-2">{home_team?.name}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center w-1/3">
                  <div className="text-2xl sm:text-4xl font-black text-slate-300">
                    -
                  </div>
                </div>

                <div className="flex flex-col items-center text-center w-1/3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mb-1 sm:mb-2 flex items-center justify-center">
                    <SmartLogo 
                      urls={awayLogos} 
                      alt={away_team?.name} 
                      className="w-full h-full object-contain drop-shadow-sm"
                      fallbackText={away_team?.name || 'A'}
                    />
                  </div>
                  <span className="font-bold text-xs sm:text-sm leading-tight text-slate-900 line-clamp-2">{away_team?.name}</span>
                </div>
              </div>

              {/* Fan Votes */}
              <div className="flex items-center justify-center gap-2 text-slate-500 text-xs sm:text-sm font-medium">
                {totalVotes} Fans voted
              </div>

              {/* Percentage Bars */}
              <div className="space-y-1 sm:space-y-2 px-1">
                <div className="flex justify-between text-[10px] sm:text-sm font-bold text-slate-700 gap-1 mb-1 sm:mb-2">
                  <span className="truncate flex-1 text-left">{home_team?.name} {homePercentage}%</span>
                  <span className="truncate flex-1 text-center">Draw {drawPercentage}%</span>
                  <span className="truncate flex-1 text-right">{away_team?.name} {awayPercentage}%</span>
                </div>
                <div className="flex h-2 sm:h-3.5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${homePercentage}%` }} className="bg-[#e11d48]" />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${drawPercentage}%` }} className="bg-[#64748b]" />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${awayPercentage}%` }} className="bg-[#0891b2]" />
                </div>
              </div>

              {/* Vote Buttons */}
              <div className="flex justify-center gap-2 sm:gap-4 px-1">
                <button onClick={() => handleVote('home')} disabled={isVoting} className={`flex-1 py-2 sm:py-3 bg-[#e11d48] text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${userVote === 'home' ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}>Home</button>
                <button onClick={() => handleVote('draw')} disabled={isVoting} className={`flex-1 py-2 sm:py-3 bg-[#64748b] text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${userVote === 'draw' ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}>Draw</button>
                <button onClick={() => handleVote('away')} disabled={isVoting} className={`flex-1 py-2 sm:py-3 bg-[#0891b2] text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-cyan-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${userVote === 'away' ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}>Away</button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
