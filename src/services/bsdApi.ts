import { supabase } from '../supabaseClient';

export const API_BASE_URL = '/api';

export interface LiveMatch {
  id: number;
  home_team: string;
  away_team: string;
  home_team_obj?: any;
  away_team_obj?: any;
  home_score: number;
  away_score: number;
  current_minute: number;
  period: string;
  status: string;
  incidents: Array<{
    type: "goal" | "card" | "substitution";
    minute: number;
    player_name: string;
    is_home: boolean;
  }>;
  live_stats: {
    home: {
      ball_possession: number;
      total_shots: number;
      shots_on_target: number;
      corner_kicks: number;
      fouls: number;
      yellow_cards: number;
      red_cards: number;
      offsides: number;
    };
    away: {
      ball_possession: number;
      total_shots: number;
      shots_on_target: number;
      corner_kicks: number;
      fouls: number;
      yellow_cards: number;
      red_cards: number;
      offsides: number;
    };
  };
  league: {
    name: string;
    country: string;
    api_id?: number;
  };
  home_xg_live: number;
  away_xg_live: number;
  odds_home: number;
  odds_draw: number;
  odds_away: number;
  referee: {
    name: string;
    yellowCards: number;
    redCards: number;
  };
}

export interface Match {
  id: number;
  api_id: number;
  home_team: string;
  away_team: string;
  home_team_obj?: any;
  away_team_obj?: any;
  home_score: number;
  away_score: number;
  status: string;
  league: any;
  referee: {
    name: string;
    yellowCards: number;
    redCards: number;
  };
  home_coach: { name: string; shortName: string };
  away_coach: { name: string; shortName: string };
  odds_home: number;
  odds_draw: number;
  odds_away: number;
  odds_over_15: number;
  odds_over_25: number;
  odds_over_35: number;
  odds_btts_yes: number;
  odds_btts_no: number;
  actual_home_xg: number;
  actual_away_xg: number;
  home_xg_live: number;
  away_xg_live: number;
  shotmap: Array<{
    pos: { x: number; y: number };
    body_part: string;
    situation: string;
    xg: number;
    is_goal: boolean;
    is_save: boolean;
    is_off_target: boolean;
  }>;
  incidents: Array<any>;
  momentum: Array<{ minute: number; value: number }>;
  average_positions: {
    home: Array<{ player: string; pid: number; pos: { x: number; y: number }; number: number }>;
    away: Array<{ player: string; pid: number; pos: { x: number; y: number }; number: number }>;
  };
}

export interface Prediction {
  id: number;
  event: Match;
  most_likely_score: string;
  confidence: number;
  favorite: string;
  favorite_prob: number;
  favorite_recommend: boolean;
  over_15_recommend: boolean;
  over_25_recommend: boolean;
  over_35_recommend: boolean;
  btts_recommend: boolean;
  winner_recommend: boolean;
  prob_over_15: number;
  prob_over_25: number;
  prob_over_35: number;
  prob_btts_yes: number;
  expected_home_goals: number;
  expected_away_goals: number;
  prob_home_win: number;
  prob_draw: number;
  prob_away_win: number;
}

export interface PlayerStat {
  player: { name: string; api_id: number };
  minutes_played: number;
  rating: number;
  touches: number;
  goals: number;
  goal_assist: number;
  expected_goals: number;
  expected_assists: number;
  total_shots: number;
  shots_on_target: number;
  total_pass: number;
  accurate_pass: number;
  key_pass: number;
  total_cross: number;
  accurate_cross: number;
  duel_won: number;
  duel_lost: number;
  aerial_won: number;
  aerial_lost: number;
  total_tackle: number;
  won_tackle: number;
  total_clearance: number;
  interception: number;
  was_fouled: number;
  fouls: number;
  yellow_card: number;
  red_card: number;
  saves: number;
  goals_conceded: number;
}

export interface PredictedLineup {
  lineups: {
    home: {
      team: string;
      predicted_formation: string;
      confidence: number;
      starters: Array<{ name: string; position: string; jersey_number: number; ai_score: number }>;
      substitutes: Array<{ name: string; position: string; jersey_number: number; ai_score: number }>;
      unavailable: Array<{ name: string; reason: string }>;
    };
    away: {
      team: string;
      predicted_formation: string;
      confidence: number;
      starters: Array<{ name: string; position: string; jersey_number: number; ai_score: number }>;
      substitutes: Array<{ name: string; position: string; jersey_number: number; ai_score: number }>;
      unavailable: Array<{ name: string; reason: string }>;
    };
  };
}

export interface OddsComparison {
  best_odds: number;
  best_bookmaker: string;
  ai_probability: number;
  bookmakers: Record<string, { decimal: number; fractional: string; movement: "up" | "down" | null }>;
}

export interface Standing {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  xgf: number;
  xga: number;
  xgd: number;
  xg_games: number;
  form: string;
  live: boolean;
}

export interface Referee {
  name: string;
  event_count: number;
  yellowCards: number;
  redCards: number;
}

export interface SpatialData {
  shotmap: Match['shotmap'];
  momentum: Match['momentum'];
  average_positions: Match['average_positions'];
}

export const normalizePrediction = (p: any) => {
  if (!p || !p.most_likely_score) return p;
  
  let [h, a] = p.most_likely_score.split('-').map(Number);
  if (isNaN(h) || isNaN(a)) return p;

  // 1. Ensure most_likely_score matches predicted_result
  if (p.predicted_result === 'H' && h <= a) {
    h = a + 1;
  } else if (p.predicted_result === 'A' && a <= h) {
    a = h + 1;
  } else if (p.predicted_result === 'D' && h !== a) {
    h = Math.max(h, a);
    a = h;
  }

  // 2. Adjust for Over 2.5 and BTTS contradictions
  let totalGoals = h + a;

  // If Over 2.5 is very unlikely (< 45%), but score is high
  if (p.prob_over_25 < 45 && totalGoals >= 3) {
    if (p.predicted_result === 'H') {
      if (p.prob_btts_yes >= 50) { h = 2; a = 1; }
      else { h = Math.min(h, 2); a = 0; if (h === 0) h = 1; }
    } else if (p.predicted_result === 'A') {
      if (p.prob_btts_yes >= 50) { h = 1; a = 2; }
      else { h = 0; a = Math.min(a, 2); if (a === 0) a = 1; }
    } else if (p.predicted_result === 'D') {
      if (p.prob_btts_yes >= 50) { h = 1; a = 1; }
      else { h = 0; a = 0; }
    }
  } 
  // If Over 2.5 is very likely (> 55%), but score is low
  else if (p.prob_over_25 > 55 && totalGoals < 3) {
    if (p.predicted_result === 'H') {
      if (p.prob_btts_yes >= 50) { h = Math.max(h, 2); a = Math.max(a, 1); }
      else { h = Math.max(h, 3); a = 0; }
    } else if (p.predicted_result === 'A') {
      if (p.prob_btts_yes >= 50) { h = Math.max(h, 1); a = Math.max(a, 2); }
      else { h = 0; a = Math.max(a, 3); }
    } else if (p.predicted_result === 'D') {
      h = Math.max(h, 2); a = h; // 2-2 is the lowest over 2.5 draw
    }
  }

  // 3. Adjust for BTTS contradictions if Over 2.5 didn't already fix it
  let isBtts = h > 0 && a > 0;

  if (p.prob_btts_yes > 55 && !isBtts) {
    if (p.predicted_result === 'H') { h = Math.max(h, 2); a = 1; }
    else if (p.predicted_result === 'A') { h = 1; a = Math.max(a, 2); }
    else if (p.predicted_result === 'D') { h = Math.max(h, 1); a = h; }
  } else if (p.prob_btts_yes < 45 && isBtts) {
    if (p.predicted_result === 'H') { a = 0; }
    else if (p.predicted_result === 'A') { h = 0; }
    else if (p.predicted_result === 'D') { h = 0; a = 0; }
  }

  // 4. Final sanity check to ensure result still matches
  if (p.predicted_result === 'H' && h <= a) h = a + 1;
  if (p.predicted_result === 'A' && a <= h) a = h + 1;
  if (p.predicted_result === 'D' && h !== a) { h = Math.max(h, a); a = h; }

  p.most_likely_score = `${h}-${a}`;

  // 5. Boost confidence for strong favorites (odds < 1.50)
  const event = p.event || p;
  const oddsHome = Number(event.odds_home) || (p.prob_home_win ? (100 / p.prob_home_win) : null);
  const oddsAway = Number(event.odds_away) || (p.prob_away_win ? (100 / p.prob_away_win) : null);

  if (p.predicted_result === 'H' && oddsHome && oddsHome < 1.50) {
    if (!p.confidence || p.confidence < 80) {
      p.confidence = Math.max(80, Math.min(99, Math.round(100 - (oddsHome - 1) * 40)));
    }
  } else if (p.predicted_result === 'A' && oddsAway && oddsAway < 1.50) {
    if (!p.confidence || p.confidence < 80) {
      p.confidence = Math.max(80, Math.min(99, Math.round(100 - (oddsAway - 1) * 40)));
    }
  }

  return p;
};

export const fetchBsdApi = async (endpoint: string, options: RequestInit = {}) => {
  // Always append ?tz=Africa/Harare
  const urlObj = new URL(endpoint, window.location.origin);
  urlObj.searchParams.set('tz', 'Africa/Harare');
  
  const response = await fetch(urlObj.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export const getLiveMatches = async (): Promise<LiveMatch[]> => {
  const data = await fetchBsdApi('/api/live/');
  return data?.results || data || [];
};

export const getEventDetails = async (id: number | string): Promise<Match | null> => {
  return fetchBsdApi(`/api/events/${id}/`);
};

const enrichWithPregameOdds = async (items: any[]) => {
  if (!supabase || !items || !items.length) return items;
  try {
    const ids = items.map(i => i.id).filter(id => id);
    if (!ids.length) return items;
    
    // Fetch stored prediction_data where we preserved pregame odds
    const { data: dbData } = await supabase
      .from('predictions')
      .select('id, prediction_data')
      .in('id', ids);
      
    if (dbData && dbData.length > 0) {
      const dbMap: Record<string, any> = {};
      dbData.forEach(r => { dbMap[r.id] = r.prediction_data; });
      
      return items.map(p => {
        const dbP = dbMap[p.id];
        if (dbP) {
          if (dbP.pregame_odds_home) {
            p.pregame_odds_home = dbP.pregame_odds_home;
            p.pregame_odds_draw = dbP.pregame_odds_draw;
            p.pregame_odds_away = dbP.pregame_odds_away;
          } else if (dbP.event && !['finished', 'Finished', 'FT', 'AET', 'PEN'].includes(dbP.event.status) && dbP.event.odds_home) {
            p.pregame_odds_home = dbP.event.odds_home;
            p.pregame_odds_draw = dbP.event.odds_draw;
            p.pregame_odds_away = dbP.event.odds_away;
          }
        }
        return p;
      });
    }
  } catch (e) {
    console.error('Failed to enrich predictions with pregame odds:', e);
  }
  return items;
};

export const getPredictionDetails = async (id: number | string): Promise<Prediction | null> => {
  const data = await fetchBsdApi(`/api/predictions/${id}/`);
  if (!data) return null;
  const enriched = await enrichWithPregameOdds([data]);
  return normalizePrediction(enriched[0]);
};

export const getPredictions = async (params: Record<string, any> = {}): Promise<{ results: Prediction[] }> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  const url = `/api/predictions/${queryString ? `?${queryString}` : ''}`;
  const data = await fetchBsdApi(url);
  if (data && data.results) {
    const enriched = await enrichWithPregameOdds(data.results);
    data.results = enriched.map(normalizePrediction);
  }
  return data;
};

export const getPredictionByEventId = async (eventId: number | string): Promise<Prediction | null> => {
  const data = await fetchBsdApi(`/api/predictions/?event=${eventId}`);
  const result = data?.results?.[0] || null;
  if (!result) return null;
  const enriched = await enrichWithPregameOdds([result]);
  return normalizePrediction(enriched[0]);
};

export const getPlayerStats = async (eventId: number | string): Promise<{ results: PlayerStat[] }> => {
  return fetchBsdApi(`/api/player-stats/?event=${eventId}`);
};

export const getPredictedLineup = async (eventApiId: number | string): Promise<PredictedLineup | null> => {
  return fetchBsdApi(`/api/predicted-lineup/${eventApiId}/`);
};

export const getOddsCompare = async (eventId: number | string): Promise<{ results: any[] } | null> => {
  return fetchBsdApi(`/api/odds/compare/?event=${eventId}`);
};

export const getImageUrl = (type: 'team' | 'league' | 'player', id: number | string): string => {
  if (!id) return '';
  return `/img/${type}/${id}/`;
};

export const isValueBet = (aiProb: number, decimalOdds: number): boolean => {
  if (!aiProb || !decimalOdds) return false;
  return aiProb > (1 / decimalOdds) + 0.05;
};

export const getConfidenceLabel = (confidence: number): 'Low' | 'Medium' | 'High' => {
  if (confidence < 0.5) return 'Low';
  if (confidence <= 0.75) return 'Medium';
  return 'High';
};

export const formatMinute = (minute: number, period: string): string => {
  if (!minute) return period || '';
  let periodLabel = '';
  if (period === '1T') periodLabel = ' (1st Half)';
  else if (period === 'HT') periodLabel = ' (HT)';
  else if (period === '2T') periodLabel = ' (2nd Half)';
  else if (period === 'FT') periodLabel = ' (FT)';
  return `${minute}'${periodLabel}`;
};
