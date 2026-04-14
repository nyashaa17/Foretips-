import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import MatchSelector from '../components/MatchSelector';

export default function SubmitTip() {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [showMatchSelector, setShowMatchSelector] = useState(false);
  const [fetchingMatches, setFetchingMatches] = useState(false);

  // ... (rest of the state)

  const handleMatchSelect = (eventId) => {
    setSelectedMatch(eventId);
    
    // Call the original logic to populate fields
    const e = { target: { value: eventId } };
    handleMatchChange(e);
  };

  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeTeamBadge, setHomeTeamBadge] = useState('');
  const [awayTeamBadge, setAwayTeamBadge] = useState('');
  const [kickoffTime, setKickoffTime] = useState('');
  const [market, setMarket] = useState('Home Win (1)');
  const [odds, setOdds] = useState('');
  const [bookmaker, setBookmaker] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const markets = [
    'Home Win (1)',
    'Away Win (2)',
    'Draw (X)',
    '1X (Home or Draw)',
    'X2 (Away or Draw)',
    '12 (Home or Away)',
    'Over 1.5 Goals',
    'Over 2.5 Goals',
    'Under 2.5 Goals',
    'BTTS - Yes',
    'BTTS - No',
    'Draw No Bet (Home)',
    'Draw No Bet (Away)',
  ];

  const bookmakers = [
    'Mwos',
    'Afribet',
    'Premierbet',
    'Bolabet',
    'Winnbucks'
  ];

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Error getting user:', error.message);
        }
        if (!user) {
          navigate('/signup', { state: { message: 'Please sign up to submit a tip.' } });
        }
      } catch (err) {
        console.warn('Exception getting user:', err);
        navigate('/signup', { state: { message: 'Please sign up to submit a tip.' } });
      }
    };
    checkUser();

    const fetchMatches = async () => {
      setFetchingMatches(true);
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 2);

        const formatDate = (date) => date.toISOString().split('T')[0];

        // Fetch matches for the next 3 days using TheSportsDB free tier (API key '123')
        const [resToday, resTomorrow, resDayAfter] = await Promise.all([
          fetch(`/sportsdb-api/eventsday.php?d=${formatDate(today)}&s=Soccer`),
          fetch(`/sportsdb-api/eventsday.php?d=${formatDate(tomorrow)}&s=Soccer`),
          fetch(`/sportsdb-api/eventsday.php?d=${formatDate(dayAfter)}&s=Soccer`)
        ]);

        const dataToday = await resToday.json();
        const dataTomorrow = await resTomorrow.json();
        const dataDayAfter = await resDayAfter.json();

        const combinedEvents = [
          ...(dataToday.events || []),
          ...(dataTomorrow.events || []),
          ...(dataDayAfter.events || [])
        ];

        // Filter out matches that have already started (using the 15 min buffer)
        const now = new Date();
        const bufferTime = new Date(now.getTime() + 15 * 60000);

        const upcomingMatches = combinedEvents.filter(event => {
          if (!event.strTimestamp) return false;
          const matchDate = new Date(event.strTimestamp);
          return matchDate > bufferTime;
        }).sort((a, b) => new Date(a.strTimestamp) - new Date(b.strTimestamp));

        setMatches(upcomingMatches);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setFetchingMatches(false);
      }
    };

    fetchMatches();
  }, []);

  const handleMatchChange = (e) => {
    const eventId = e.target.value;
    setSelectedMatch(eventId);
    
    if (eventId === 'custom' || eventId === '') {
      setHomeTeam('');
      setAwayTeam('');
      setHomeTeamBadge('');
      setAwayTeamBadge('');
      setKickoffTime('');
      setOdds('');
      return;
    }

    const match = matches.find(m => m.idEvent === eventId);
    if (match) {
      setHomeTeam(match.strHomeTeam);
      setAwayTeam(match.strAwayTeam);
      setHomeTeamBadge(match.strHomeTeamBadge || '');
      setAwayTeamBadge(match.strAwayTeamBadge || '');
      
      if (match.strTimestamp) {
        const date = new Date(match.strTimestamp);
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
        setKickoffTime(localISOTime);
      }
    }
  };

  const handleOddsChange = (e) => {
    const newOdds = e.target.value;
    setOdds(newOdds);
    
    // Automatically calculate confidence based on implied probability
    // Implied Probability = (1 / Decimal Odds) * 100
    const oddsValue = parseFloat(newOdds);
    if (!isNaN(oddsValue) && oddsValue > 0) {
      // Calculate raw probability
      let impliedProb = (1 / oddsValue) * 100;
      
      // Add a slight "tipster confidence boost" (users usually feel more confident than raw math)
      // Cap it at 99% so it doesn't look fake (100% is impossible in sports)
      let calculatedConfidence = Math.min(99, Math.round(impliedProb * 1.1));
      
      setConfidence(calculatedConfidence);
    } else {
      setConfidence(50); // Default fallback
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Kick-off Time Validation (1 hour buffer)
      const kickoffDate = new Date(kickoffTime);
      const now = new Date();
      const bufferTime = new Date(now.getTime() + 60 * 60000); // 60 minutes from now

      if (kickoffDate < bufferTime) {
        setMessage('Error: Kick-off time must be at least 1 hour in the future.');
        setLoading(false);
        return;
      }

      // 2. Minimum Odds Validation
      const oddsValue = parseFloat(odds);
      if (isNaN(oddsValue) || oddsValue < 1.20) {
        setMessage('Error: Minimum odds allowed are 1.20 to ensure fair competition.');
        setLoading(false);
        return;
      }

      // 3. Bookmaker Validation
      if (!bookmaker) {
        setMessage('Error: Please select a bookmaker for your odds.');
        setLoading(false);
        return;
      }

      let user;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        user = data.user;
      } catch (err) {
        console.warn('Error getting user:', err.message);
      }
      
      if (!user) {
        navigate('/signup', { state: { message: 'Please sign up to submit a tip.' } });
        return;
      }

      // 4. Daily Limit Validation (Max 5 per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count, error: countError } = await supabase
        .from('community_tips')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (countError) {
        setMessage('Error checking daily limits: ' + countError.message);
        setLoading(false);
        return;
      }

      if (count >= 5) {
        setMessage('Error: You have reached your daily limit of 5 tips. Please come back tomorrow!');
        setLoading(false);
        return;
      }

      // Ensure user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        const email = user.email || '';
        const username = user.user_metadata?.user_name || user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'user';
        
        await supabase
          .from('profiles')
          .upsert([{ id: user.id, username: username }]);
      }

      const matchId = `${homeTeam} vs ${awayTeam}`;
      const predictionData = JSON.stringify({
        homeTeam,
        awayTeam,
        homeTeamBadge,
        awayTeamBadge,
        kickoffTime,
        market,
        odds,
        bookmaker,
        reasoning,
        apiEventId: selectedMatch !== 'custom' ? selectedMatch : null
      });

      const { error } = await supabase
        .from('community_tips')
        .insert([{ user_id: user.id, match_id: matchId, prediction: predictionData, confidence }]);

      if (error) {
        setMessage('Error submitting tip: ' + error.message);
      } else {
        setMessage('Tip submitted successfully! Pending approval.');
        setSelectedMatch('');
        setHomeTeam('');
        setAwayTeam('');
        setHomeTeamBadge('');
        setAwayTeamBadge('');
        setKickoffTime('');
        setMarket('Home Win (1)');
        setOdds('');
        setBookmaker('');
        setReasoning('');
        setConfidence(50);
      }
    } catch (err) {
      setMessage('An unexpected error occurred: ' + (err.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const isCustom = selectedMatch === 'custom';

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <SEO title="Submit Tip" description="Submit your football tip" />
      <h1 className="text-3xl font-black text-slate-900 mb-4 text-center">Submit a Prediction</h1>
      
      {/* Anti-Cheat Rules Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold">
          <ShieldCheck className="w-5 h-5" />
          <h3>Fair Play Rules</h3>
        </div>
        <ul className="text-sm text-blue-700 space-y-1 ml-7 list-disc">
          <li>Maximum of <strong>5 tips</strong> per day per user.</li>
          <li>Minimum odds allowed are <strong>1.20</strong>.</li>
          <li>Tips must be submitted at least <strong>1 hour</strong> before kick-off.</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
            <span>Select Match</span>
            {fetchingMatches && <span className="text-xs text-blue-600 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Fetching live matches...</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowMatchSelector(true)}
            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none bg-white text-left flex items-center justify-between"
            disabled={fetchingMatches}
          >
            <span className={selectedMatch ? 'text-slate-900' : 'text-slate-500'}>
              {selectedMatch 
                ? (selectedMatch === 'custom' ? 'Custom Match (Manual Entry)' : matches.find(m => m.idEvent === selectedMatch)?.strEvent || 'Selected')
                : '-- Select an upcoming match --'}
            </span>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {showMatchSelector && (
          <MatchSelector
            matches={matches}
            selectedMatch={selectedMatch}
            onSelect={handleMatchSelect}
            onClose={() => setShowMatchSelector(false)}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Home Team</label>
            <div className="relative">
              {homeTeamBadge && (
                <img src={homeTeamBadge} alt={homeTeam} className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 object-contain" referrerPolicy="no-referrer" />
              )}
              <input
                type="text"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="e.g. Arsenal"
                className={`w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none ${!isCustom && selectedMatch ? 'bg-slate-50 text-slate-500' : ''} ${homeTeamBadge ? 'pl-11' : ''}`}
                required
                readOnly={!isCustom && selectedMatch !== ''}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Away Team</label>
            <div className="relative">
              {awayTeamBadge && (
                <img src={awayTeamBadge} alt={awayTeam} className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 object-contain" referrerPolicy="no-referrer" />
              )}
              <input
                type="text"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="e.g. Chelsea"
                className={`w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none ${!isCustom && selectedMatch ? 'bg-slate-50 text-slate-500' : ''} ${awayTeamBadge ? 'pl-11' : ''}`}
                required
                readOnly={!isCustom && selectedMatch !== ''}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Kick-off Time</label>
            <input
              type="datetime-local"
              value={kickoffTime}
              onChange={(e) => setKickoffTime(e.target.value)}
              className={`w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none ${!isCustom && selectedMatch ? 'bg-slate-50 text-slate-500' : ''}`}
              required
              readOnly={!isCustom && selectedMatch !== ''}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Market</label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none bg-white"
              required
            >
              {markets.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-3">Bookmaker</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-2">
            {bookmakers.map(bm => (
              <button
                key={bm}
                type="button"
                onClick={() => setBookmaker(bm)}
                className={`p-3 text-sm font-bold rounded-xl border transition-all ${
                  bookmaker === bm 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                {bm}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-2">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
            Verify exact odds on the official bookmaker site. Do not guess.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Odds (Min 1.20)</label>
            <input
              type="number"
              step="0.01"
              min="1.20"
              value={odds}
              onChange={handleOddsChange}
              placeholder="e.g. 1.85"
              className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Confidence (%)</label>
            <div className="relative">
              <input
                type="number"
                value={confidence}
                className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-500 outline-none pr-24"
                readOnly
              />
              {odds && (
                <div className="absolute right-2 top-2.5 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded uppercase tracking-wider">
                  Auto-Calculated
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">Reasoning (Optional)</label>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder="Why do you think this will happen?"
            rows="3"
            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none resize-none"
          ></textarea>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.includes('Error') && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <p className="text-sm font-bold">{message}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading || fetchingMatches}
          className="w-full p-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-70"
        >
          {loading ? 'Submitting...' : 'Submit Prediction'}
        </button>
      </form>
    </div>
  );
}
