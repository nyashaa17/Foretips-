import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { getEvents } from '../services/api';
import { getTeamLogoUrl } from '../services/api';
import SmartLogo from './SmartLogo';
import { Progress } from "@/components/ui/progress";

export default function MatchPollCarousel() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      // 1. Try fetching featured matches
      const { data: featured, error } = await supabase
        .from('featured_matches')
        .select('match_id')
        .eq('is_active', true);
      
      let finalMatches = [];
      
      if (!error && featured && featured.length > 0) {
        const matchIds = featured.map(f => f.match_id);
        // Fetch details for these match IDs (assuming getEvents can take IDs or we filter)
        const allEvents = await getEvents({ limit: 100 });
        finalMatches = (allEvents || []).filter(m => matchIds.includes(m.id));
      }

      // 2. Fallback to major leagues if no featured matches
      if (finalMatches.length === 0) {
        const data = await getEvents({ limit: 50 });
        const majorLeagues = [
          'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 
          'Brasileirão Serie A', 'Liga Portugal Betclic', 'Eredivisie', 'Championship',
          'Primeira Liga', 'Major League Soccer'
        ];
        finalMatches = (data || []).filter(m => {
          const leagueName = m.league?.name || m.league_name;
          return majorLeagues.includes(leagueName);
        });
        
        // 3. Ultimate fallback: just take the first 5 matches
        if (finalMatches.length === 0 && data && data.length > 0) {
          finalMatches = data.slice(0, 5);
        }
      }
      
      setMatches(finalMatches.slice(0, 5));
    };
    fetchMatches();
  }, []);

  const [votes, setVotes] = useState({ home: 0, draw: 0, away: 0 });

  useEffect(() => {
    const fetchVotes = async () => {
      if (matches.length === 0) return;
      const { data } = await supabase
        .from('match_polls')
        .select('vote')
        .eq('match_id', matches[currentIndex].id);
      
      const home = data?.filter(v => v.vote === 'home').length || 0;
      const draw = data?.filter(v => v.vote === 'draw').length || 0;
      const away = data?.filter(v => v.vote === 'away').length || 0;
      setVotes({ home, draw, away });
    };
    fetchVotes();
  }, [currentIndex, matches]);

  const totalVotes = votes.home + votes.draw + votes.away;
  
  const match = matches[currentIndex];
  
  const rawHome = match?.home_team_obj || match?.home_team;
  const home_team = typeof rawHome === 'string' 
    ? { name: rawHome, id: rawHome } 
    : (rawHome ? { ...rawHome, id: rawHome.id || rawHome.team_id, api_id: rawHome.api_id } : { name: 'Home Team' });
    
  const rawAway = match?.away_team_obj || match?.away_team;
  const away_team = typeof rawAway === 'string' 
    ? { name: rawAway, id: rawAway } 
    : (rawAway ? { ...rawAway, id: rawAway.id || rawAway.team_id, api_id: rawAway.api_id } : { name: 'Away Team' });

  const homeLogos = [getTeamLogoUrl(home_team?.api_id)];
  const awayLogos = [getTeamLogoUrl(away_team?.api_id)];

  const oddsHome = match ? parseFloat(match.odds_home) : 0;
  const oddsDraw = match ? parseFloat(match.odds_draw) : 0;
  const oddsAway = match ? parseFloat(match.odds_away) : 0;
  
  let oddsProbHome = 0, oddsProbDraw = 0, oddsProbAway = 0;
  if (oddsHome > 0 && oddsDraw > 0 && oddsAway > 0) {
    const sumInvOdds = (1/oddsHome) + (1/oddsDraw) + (1/oddsAway);
    oddsProbHome = (1/oddsHome) / sumInvOdds;
    oddsProbDraw = (1/oddsDraw) / sumInvOdds;
    oddsProbAway = (1/oddsAway) / sumInvOdds;
  } else {
    oddsProbHome = 0.33;
    oddsProbDraw = 0.33;
    oddsProbAway = 0.34;
  }

  let baseHome = oddsProbHome;
  let baseDraw = oddsProbDraw;
  let baseAway = oddsProbAway;
  
  // If we have votes, blend them 50/50 with odds
  if (totalVotes > 0) {
    const voteHome = votes.home / totalVotes;
    const voteDraw = votes.draw / totalVotes;
    const voteAway = votes.away / totalVotes;
    
    baseHome = (baseHome + voteHome) / 2;
    baseDraw = (baseDraw + voteDraw) / 2;
    baseAway = (baseAway + voteAway) / 2;
  }
  
  const homePercentage = Math.round(baseHome * 100);
  const drawPercentage = Math.round(baseDraw * 100);
  const awayPercentage = 100 - homePercentage - drawPercentage;

  const handleVote = async (vote) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signup');
        return;
      }

      const { error } = await supabase
        .from('match_polls')
        .upsert({ match_id: matches[currentIndex].id, user_id: user.id, vote }, { onConflict: 'match_id, user_id' });

      if (error) {
        alert('Error voting: ' + error.message);
      } else {
        const { data } = await supabase
          .from('match_polls')
          .select('vote')
          .eq('match_id', matches[currentIndex].id);
        const home = data?.filter(v => v.vote === 'home').length || 0;
        const draw = data?.filter(v => v.vote === 'draw').length || 0;
        const away = data?.filter(v => v.vote === 'away').length || 0;
        setVotes({ home, draw, away });
      }
    } catch (err) {
      console.error('Vote error:', err);
      alert('An error occurred while voting. Please try again.');
    }
  };

  const next = () => setCurrentIndex((prev) => (prev + 1) % matches.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length);

  if (matches.length === 0) {
    return (
      <section className="py-8">
        <div className="w-full max-w-lg mx-auto h-64 bg-slate-100 rounded-2xl animate-pulse"></div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Match Poll of the Day</h2>
      <div className="relative flex items-center justify-center px-4">
        <div className="w-full max-w-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={matches[currentIndex].id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-slate-900 relative"
            >
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all shadow-sm"><ChevronRight className="w-5 h-5" /></button>
              
              {/* Header: Time and League */}
              <div className="flex justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-8 px-8">
                <span>{matches[currentIndex].event_date ? new Date(matches[currentIndex].event_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                <span>{matches[currentIndex].league?.name || matches[currentIndex].league_name}</span>
              </div>

              {/* Matchup: Logos, Names, and Score */}
              <div className="grid grid-cols-3 items-center gap-4 mb-10 px-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl p-3 mb-3 flex items-center justify-center border border-slate-100">
                    <SmartLogo 
                      urls={homeLogos} 
                      alt={home_team?.name} 
                      className="w-full h-full object-contain"
                      fallbackText={home_team?.name || 'H'}
                    />
                  </div>
                  <span className="font-bold text-sm leading-tight line-clamp-2 h-10 text-slate-800">{home_team?.name}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className="text-3xl font-black tracking-tighter bg-gradient-to-b from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    {matches[currentIndex].home_score ?? 0} - {matches[currentIndex].away_score ?? 0}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Full Time</div>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl p-3 mb-3 flex items-center justify-center border border-slate-100">
                    <SmartLogo 
                      urls={awayLogos} 
                      alt={away_team?.name} 
                      className="w-full h-full object-contain"
                      fallbackText={away_team?.name || 'A'}
                    />
                  </div>
                  <span className="font-bold text-sm leading-tight line-clamp-2 h-10 text-slate-800">{away_team?.name}</span>
                </div>
              </div>

              {/* Fan Votes */}
              <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">
                <Users className="w-3 h-3" />
                {totalVotes} Fans voted
              </div>

              {/* Percentage Bars */}
              <div className="space-y-6 mb-8 px-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span className="text-rose-600">{homePercentage}%</span>
                    <span className="text-slate-400">DRAW {drawPercentage}%</span>
                    <span className="text-cyan-600">{awayPercentage}%</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${homePercentage}%` }} className="bg-rose-500" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${drawPercentage}%` }} className="bg-slate-300" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${awayPercentage}%` }} className="bg-cyan-500" />
                  </div>
                </div>
              </div>

              {/* Vote Buttons */}
              <div className="flex justify-center gap-3 px-4">
                <button onClick={() => handleVote('home')} className="flex-1 py-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95">Home</button>
                <button onClick={() => handleVote('draw')} className="flex-1 py-3 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-600 hover:text-white transition-all active:scale-95">Draw</button>
                <button onClick={() => handleVote('away')} className="flex-1 py-3 bg-cyan-50 border border-cyan-100 text-cyan-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-600 hover:text-white transition-all active:scale-95">Away</button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
