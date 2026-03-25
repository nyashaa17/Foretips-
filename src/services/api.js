import { subHours, isAfter } from 'date-fns';
import { supabase } from '../supabaseClient';

const API_BASE_URL = '/api';
const API_KEY = '547990004a7c3d23bd07d54928c11d0fdaf36610';

const headers = {
  'Authorization': `Token ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Helper to fetch from API with Supabase caching
async function fetchFromApi(endpoint, cacheKey = null, retries = 2) {
  const normalizePrediction = (p) => {
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
        // Try to reduce goals. If BTTS is likely, 2-1 is the lowest possible.
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

  // 1. Try to get from Supabase Cache first
  if (cacheKey && supabase) {
    try {
      const cachePromise = supabase
        .from('api_cache')
        .select('*')
        .eq('key', cacheKey)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase timeout')), 1500)
      );

      const { data: cached, error } = await Promise.race([cachePromise, timeoutPromise]);

      if (cached && !error) {
        const cacheAge = new Date(cached.created_at);
        const oneHourAgo = subHours(new Date(), 1);
        
        if (isAfter(cacheAge, oneHourAgo)) {
          console.log('Serving from Supabase cache:', cacheKey);
          return JSON.parse(cached.data);
        }
      }
    } catch (e) {
      console.warn('Supabase cache check failed or timed out:', e.message);
    }
  }

  const baseUrl = typeof window !== 'undefined' ? API_BASE_URL : 'https://sports.bzzoiro.com/api';
  const url = `${baseUrl}${endpoint}`;
  console.log('Fetching URL:', url);

  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch(url, { 
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 2000;
          console.warn(`API Rate limited (429). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }
        if (response.status === 404) {
          console.warn(`API endpoint not found: ${url}`);
          return null; // Return null for 404 errors
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('API Authentication failed. Please check your API key.');
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      let finalData;
      if (data && data.results) {
        finalData = data.results.map(normalizePrediction);
      } else if (Array.isArray(data)) {
        finalData = data.map(normalizePrediction);
      } else {
        finalData = normalizePrediction(data);
      }

      // 2. Save to Supabase Cache
      if (cacheKey && supabase && finalData) {
        try {
          await supabase.from('api_cache').upsert({
            key: cacheKey,
            data: JSON.stringify(finalData),
            created_at: new Date().toISOString()
          }, { onConflict: 'key' });
        } catch (e) {
          console.warn('Failed to update Supabase cache:', e.message);
        }
      }

      return finalData;
    } catch (error) {
      clearTimeout(timeoutId);
      
      const isLastRetry = i === retries;
      const isAbortError = error.name === 'AbortError' || error.message?.includes('aborted');
      const isNetworkError = error.message === 'Failed to fetch';

      if (isLastRetry) {
        console.error('API Fetch failed final attempt:', error.message || error);
        if (isAbortError) {
          throw new Error('The request timed out. The server is taking too long to respond.');
        }
        if (isNetworkError) {
          throw new Error('Network error: Could not connect to the prediction server. Please check your internet connection.');
        }
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      console.warn(`API Fetch failed (attempt ${i + 1}), retrying in ${delay}ms...`, error.message || error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}


export const getPredictions = async (params = {}) => {
  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {});
  
  const query = new URLSearchParams(sortedParams).toString();
  const endpoint = `/predictions${query ? `?${query}` : ''}`;
  const cacheKey = `preds_${query || 'all'}`;
  
  return fetchFromApi(endpoint, cacheKey);
};

export const getEvents = async (params = {}) => {
  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {});

  const query = new URLSearchParams(sortedParams).toString();
  const endpoint = `/events${query ? `?${query}` : ''}`;
  const cacheKey = `events_${query || 'all'}`;
  
  return fetchFromApi(endpoint, cacheKey);
};

export const getLiveMatches = async () => {
  return fetchFromApi('/live', 'live_matches');
};

export const getLeagues = async () => {
  return fetchFromApi('/leagues', 'leagues_list');
};

export const getMatchDetails = async (id) => {
  const cacheKey = `match_${id}`;
  return fetchFromApi(`/predictions/${id}`, cacheKey);
};

export const getTeamLogoUrl = (apiId) => {
  if (!apiId) return null;
  return `/img/team/${apiId}`;
};

export const getLeagueLogoUrl = (apiId) => {
  if (!apiId) return null;
  return `/img/league/${apiId}`;
};

// History Management
export const saveToHistory = (prediction) => {
  if (typeof window === 'undefined' || !prediction) return;
  try {
    const history = JSON.parse(localStorage.getItem('prediction_history') || '[]');
    // Remove if already exists to move to top
    const filtered = history.filter(p => p.id !== prediction.id);
    const newHistory = [prediction, ...filtered].slice(0, 50); // Keep last 50
    localStorage.setItem('prediction_history', JSON.stringify(newHistory));
  } catch (e) {
    console.error('Failed to save to history:', e);
  }
};

export const getHistory = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('prediction_history') || '[]');
  } catch (e) {
    return [];
  }
};

export const removeFromHistory = (id) => {
  if (typeof window === 'undefined') return;
  try {
    const history = JSON.parse(localStorage.getItem('prediction_history') || '[]');
    const newHistory = history.filter(p => p.id !== id);
    localStorage.setItem('prediction_history', JSON.stringify(newHistory));
  } catch (e) {
    console.error('Failed to remove from history:', e);
  }
};

export const clearHistory = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('prediction_history');
};
