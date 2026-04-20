import { subHours, isAfter } from 'date-fns';
import { supabase } from '../supabaseClient';

const API_BASE_URL = '/api';

// In-memory cache to prevent annoying reloads on navigation
const memoryCache = new Map();
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to fetch from API with Supabase caching
async function fetchFromApi(endpoint, cacheKey = null, retries = 2, forceRefresh = false) {
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

  // 0. Try to get from in-memory cache first
  if (cacheKey && !forceRefresh) {
    const cached = memoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < MEMORY_CACHE_TTL)) {
      console.log('[fetchFromApi] Serving from memory cache:', cacheKey);
      return cached.data;
    }
  }

  // 1. Try to get from Supabase Cache first
  if (cacheKey && supabase && !forceRefresh) {
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
          const parsedData = JSON.parse(cached.data);
          memoryCache.set(cacheKey, { data: parsedData, timestamp: Date.now() });
          return parsedData;
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
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 2000;
          console.warn(`[fetchFromApi] API Rate limited (429). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }
        if (response.status === 404) {
          // 404s are expected for some endpoints (e.g., checking if a match is live, or if a prediction exists)
          // We return null and let the calling code handle the fallback gracefully.
          return null; 
        }
        if (response.status === 401 || response.status === 403) {
          console.error(`[fetchFromApi] API Authentication failed (${response.status}). Please check your API key for ${url}`);
          throw new Error('API Authentication failed. Please check your API key.');
        }
        
        // Log other errors robustly
        const errorText = await response.text().catch(() => 'No error text');
        console.error(`[fetchFromApi] API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      let finalData;
      let hasPagination = false;
      let nextUrl = null;

      if (data && data.results) {
        finalData = data.results.map(normalizePrediction);
        hasPagination = true;
        nextUrl = data.next;
      } else if (Array.isArray(data)) {
        finalData = data.map(normalizePrediction);
      } else {
        finalData = normalizePrediction(data);
      }

      const resultToCache = hasPagination ? { results: finalData, next: nextUrl } : finalData;

      // Save to memory cache
      if (cacheKey) {
        memoryCache.set(cacheKey, { data: resultToCache, timestamp: Date.now() });
      }

      // 2. Save to Supabase Cache
      if (cacheKey && supabase && resultToCache) {
        try {
          await supabase.from('api_cache').upsert({
            key: cacheKey,
            data: JSON.stringify(resultToCache),
            created_at: new Date().toISOString()
          }, { onConflict: 'key' });
        } catch (e) {
          console.warn('Failed to update Supabase cache:', e.message);
        }
      }

      return resultToCache;
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


export const getMemoryCache = (cacheKey) => {
  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < MEMORY_CACHE_TTL)) {
    return cached.data;
  }
  return null;
};

// Sync predictions to Supabase
const syncPredictionsToSupabase = async (predictions) => {
  if (!supabase) return;
  
  // Fetch existing predictions to preserve pregame odds
  const { data: existingData } = await supabase
    .from('predictions')
    .select('id, prediction_data')
    .in('id', predictions.map(p => p.id));
    
  const existingMap = {};
  if (existingData) {
    existingData.forEach(e => {
       existingMap[e.id] = e.prediction_data;
    });
  }

  // Ensure items are enriched with pregame odds in-memory too so UI gets them immediately
  predictions.forEach(p => {
    const existingP = existingMap[p.id];
    const isFinished = p.event && ['finished', 'Finished', 'FT', 'AET', 'PEN'].includes(p.event.status);
    
    if (existingP && existingP.pregame_odds_home) {
      p.pregame_odds_home = existingP.pregame_odds_home;
      p.pregame_odds_draw = existingP.pregame_odds_draw;
      p.pregame_odds_away = existingP.pregame_odds_away;
    } else if (existingP && existingP.event && !['finished', 'Finished', 'FT', 'AET', 'PEN'].includes(existingP.event.status) && existingP.event.odds_home) {
      p.pregame_odds_home = existingP.event.odds_home;
      p.pregame_odds_draw = existingP.event.odds_draw;
      p.pregame_odds_away = existingP.event.odds_away;
    } else if (!isFinished && p.event && p.event.odds_home) {
      p.pregame_odds_home = p.event.odds_home;
      p.pregame_odds_draw = p.event.odds_draw;
      p.pregame_odds_away = p.event.odds_away;
    }
  });

  // Upsert predictions into the 'predictions' table
  const { error } = await supabase
    .from('predictions')
    .upsert(predictions.map(p => {
      let savedData = { ...p };
      return {
        id: p.id,
        match_id: p.match_id || p.id,
        home_team: p.home_team || (p.event ? p.event.home_team : null),
        away_team: p.away_team || (p.event ? p.event.away_team : null),
        prediction_data: savedData,
        updated_at: new Date().toISOString()
      };
    }));
    
  if (error) console.error('Error syncing predictions to Supabase:', error);
};

export const getPredictionsCacheKey = (params = {}) => {
  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    if (key !== 'paginate' && key !== 'maxPages') {
      acc[key] = params[key];
    }
    return acc;
  }, {});
  
  const query = new URLSearchParams(sortedParams).toString();
  return `preds_${query || 'all'}`;
};

export const getPredictions = async (params = {}, forceRefresh = false) => {
  console.log(`[getPredictions] Called with params:`, params, `forceRefresh:`, forceRefresh);
  
  // If no data in Supabase, data is stale, or forceRefresh is true, fetch from API
  const cacheKey = getPredictionsCacheKey(params);
  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    if (key !== 'paginate' && key !== 'maxPages') {
      acc[key] = params[key];
    }
    return acc;
  }, {});
  const query = new URLSearchParams(sortedParams).toString();
  const endpoint = `/predictions/${query ? `?${query}` : ''}`;
  
  console.log(`[getPredictions] Fetching from API endpoint: ${endpoint}`);
  
  try {
    let result = await fetchFromApi(endpoint, cacheKey, 2, forceRefresh);
    console.log('[getPredictions] API result:', result);
    let allResults = [];
    
    if (result && result.results) {
      if (params.paginate) {
        // If pagination is explicitly requested, return the paginated result
        // Sync to Supabase in background
        syncPredictionsToSupabase(result.results).catch(console.error);
        return result;
      }

      allResults = [...result.results];
      let nextUrl = result.next;
      
      // Loop to fetch all pages
      let pageCount = 0;
      let maxPages = params.maxPages || 20;
      while (nextUrl && pageCount < maxPages) {
        pageCount++;
        console.log(`[getPredictions] Fetching page ${pageCount + 1}...`);
        // Extract the query string from the nextUrl
        const nextQuery = nextUrl.includes('?') ? nextUrl.split('?')[1] : '';
        const nextEndpoint = `/predictions/${nextQuery ? `?${nextQuery}` : ''}`;
        const nextCacheKey = `preds_${nextQuery || 'page'}`;
        
        const nextResult = await fetchFromApi(nextEndpoint, nextCacheKey, 2, forceRefresh);
        if (nextResult && nextResult.results) {
          allResults = [...allResults, ...nextResult.results];
          if (nextResult.next === nextUrl) {
            console.warn('[getPredictions] API returned same next URL, breaking loop to prevent infinite loop');
            break;
          }
          nextUrl = nextResult.next;
        } else {
          nextUrl = null;
        }
      }
      
      console.log(`[getPredictions] Successfully fetched ${allResults.length} predictions from API. Syncing to Supabase...`);
      // Sync to Supabase
      await syncPredictionsToSupabase(allResults);
      return allResults;
    }
    
    console.log(`[getPredictions] API returned non-paginated result or empty results.`);
    return result;
  } catch (err) {
    console.error(`[getPredictions] Fatal error fetching predictions from API:`, err);
    throw err;
  }
};

export const getEvents = async (params = {}, forceRefresh = false) => {
  const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {});

  const query = new URLSearchParams(sortedParams).toString();
  const endpoint = `/events/${query ? `?${query}` : ''}`;
  const cacheKey = `events_${query || 'all'}`;
  
  let result = await fetchFromApi(endpoint, cacheKey, 2, forceRefresh);
  let allResults = [];
  
  if (result && result.results) {
    allResults = [...result.results];
    let nextUrl = result.next;
    
    // Loop to fetch all pages
    let pageCount = 0;
    while (nextUrl && pageCount < 20) {
      pageCount++;
      // Extract the query string from the nextUrl
      const nextQuery = nextUrl.includes('?') ? nextUrl.split('?')[1] : '';
      const nextEndpoint = `/events/${nextQuery ? `?${nextQuery}` : ''}`;
      const nextCacheKey = `events_${nextQuery || 'page'}`;
      
      const nextResult = await fetchFromApi(nextEndpoint, nextCacheKey, 2, forceRefresh);
      if (nextResult && nextResult.results) {
        allResults = [...allResults, ...nextResult.results];
        if (nextResult.next === nextUrl) break;
        nextUrl = nextResult.next;
      } else {
        nextUrl = null;
      }
    }
    return allResults;
  }
  
  return result;
};

export const getLiveMatches = async () => {
  let result = await fetchFromApi('/live/', 'live_matches');
  let allResults = [];
  
  if (result && result.results) {
    allResults = [...result.results];
    let nextUrl = result.next;
    
    let pageCount = 0;
    while (nextUrl && pageCount < 20) {
      pageCount++;
      const nextQuery = nextUrl.includes('?') ? nextUrl.split('?')[1] : '';
      const nextEndpoint = `/live/${nextQuery ? `?${nextQuery}` : ''}`;
      const nextCacheKey = `live_matches_${nextQuery || 'page'}`;
      
      const nextResult = await fetchFromApi(nextEndpoint, nextCacheKey);
      if (nextResult && nextResult.results) {
        allResults = [...allResults, ...nextResult.results];
        if (nextResult.next === nextUrl) break;
        nextUrl = nextResult.next;
      } else {
        nextUrl = null;
      }
    }
    return allResults;
  }
  
  return result;
};

export const getLeagues = async () => {
  let result = await fetchFromApi('/leagues/', 'leagues_list');
  let allResults = [];
  
  if (result && result.results) {
    allResults = [...result.results];
    let nextUrl = result.next;
    
    let pageCount = 0;
    while (nextUrl && pageCount < 20) {
      pageCount++;
      const nextQuery = nextUrl.includes('?') ? nextUrl.split('?')[1] : '';
      const nextEndpoint = `/leagues/${nextQuery ? `?${nextQuery}` : ''}`;
      const nextCacheKey = `leagues_list_${nextQuery || 'page'}`;
      
      const nextResult = await fetchFromApi(nextEndpoint, nextCacheKey);
      if (nextResult && nextResult.results) {
        allResults = [...allResults, ...nextResult.results];
        if (nextResult.next === nextUrl) break;
        nextUrl = nextResult.next;
      } else {
        nextUrl = null;
      }
    }
    return allResults;
  }
  
  return result;
};

export const getMatchDetails = async (id) => {
  const cacheKey = `match_${id}`;
  return fetchFromApi(`/predictions/${id}/`, cacheKey);
};

export const getPredictionByEventId = async (eventId) => {
  const cacheKey = `prediction_event_${eventId}`;
  const data = await fetchFromApi(`/predictions/?event=${eventId}`, cacheKey);
  if (data && data.results && data.results.length > 0) {
    return data.results[0];
  }
  return null;
};

export const getLiveMatchDetails = async (id) => {
  const cacheKey = `live_match_${id}`;
  return fetchFromApi(`/live/${id}/`, cacheKey, 1, true); // force refresh for live data
};

export const getEventDetails = async (id) => {
  const cacheKey = `event_${id}`;
  return fetchFromApi(`/events/${id}/`, cacheKey);
};

export const getPlayerStats = async (eventId) => {
  const cacheKey = `player_stats_${eventId}`;
  return fetchFromApi(`/player-stats/?event=${eventId}`, cacheKey);
};

export const getPlayerProfile = async (playerId) => {
  const cacheKey = `player_profile_${playerId}`;
  return fetchFromApi(`/players/${playerId}/`, cacheKey);
};

export const getPlayerMatchStats = async (playerId) => {
  const cacheKey = `player_match_stats_${playerId}`;
  let result = await fetchFromApi(`/player-stats/?player=${playerId}`, cacheKey);
  
  let allResults = [];
  if (result && result.results) {
    allResults = [...result.results];
    let nextUrl = result.next;
    
    let pageCount = 0;
    while (nextUrl && pageCount < 5) { // Limit to 5 pages for match stats
      pageCount++;
      const nextQuery = nextUrl.includes('?') ? nextUrl.split('?')[1] : '';
      const nextEndpoint = `/player-stats/${nextQuery ? `?${nextQuery}` : ''}`;
      const nextCacheKey = `player_match_stats_${playerId}_page_${pageCount}`;
      
      const nextResult = await fetchFromApi(nextEndpoint, nextCacheKey);
      if (nextResult && nextResult.results) {
        allResults = [...allResults, ...nextResult.results];
        if (nextResult.next === nextUrl) break;
        nextUrl = nextResult.next;
      } else {
        nextUrl = null;
      }
    }
    return allResults;
  }
  return result;
};

export const getSquad = async (teamId, isNational = false) => {
  const queryParam = isNational ? 'national_team' : 'team';
  const cacheKey = `squad_${queryParam}_${teamId}`;
  let result = await fetchFromApi(`/players/?${queryParam}=${teamId}`, cacheKey);
  
  let allResults = [];
  if (result && result.results) {
    allResults = [...result.results];
    let nextUrl = result.next;
    
    let pageCount = 0;
    while (nextUrl && pageCount < 10) {
      pageCount++;
      const nextQuery = nextUrl.includes('?') ? nextUrl.split('?')[1] : '';
      const nextEndpoint = `/players/${nextQuery ? `?${nextQuery}` : ''}`;
      const nextCacheKey = `squad_${queryParam}_${teamId}_page_${pageCount}`;
      
      const nextResult = await fetchFromApi(nextEndpoint, nextCacheKey);
      if (nextResult && nextResult.results) {
        allResults = [...allResults, ...nextResult.results];
        if (nextResult.next === nextUrl) break;
        nextUrl = nextResult.next;
      } else {
        nextUrl = null;
      }
    }
    return allResults;
  }
  return result;
};

export const getTeamLogoUrl = (id) => {
  if (!id) return null;
  return `/img/team/${id}/`;
};

export const getLeagueLogoUrl = (id) => {
  if (!id) return null;
  return `/img/league/${id}/`;
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
