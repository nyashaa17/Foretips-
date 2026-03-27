const FOOTBALL_DATA_BASE = '/football-api';
const SPORTSDB_BASE = '/sportsdb-api';

export const getLiveMatches = async () => {
  const res = await fetch(`${FOOTBALL_DATA_BASE}/matches?status=LIVE`);
  if (!res.ok) throw new Error('Failed to fetch live matches');
  return res.json();
};

export const getTeamSchedule = async (teamId) => {
  const res = await fetch(`${FOOTBALL_DATA_BASE}/teams/${teamId}/matches`);
  if (!res.ok) {
    if (res.status === 404) {
      console.warn(`No schedule found for team ${teamId}`);
      return { matches: [] };
    }
    const errorText = await res.text();
    console.error(`Failed to fetch team schedule for ${teamId}: ${res.status} ${res.statusText} - ${errorText}`);
    throw new Error(`Failed to fetch team schedule: ${res.statusText}`);
  }
  return res.json();
};

export const getTeamRoster = async (teamId) => {
  // TheSportsDB uses team ID to lookup players
  const res = await fetch(`${SPORTSDB_BASE}/lookup_all_players.php?id=${teamId}`);
  if (!res.ok) throw new Error('Failed to fetch team roster');
  return res.json();
};

// Player stats are often limited in free APIs. 
// We can try to fetch player details if the API supports it.
export const getPlayerDetails = async (playerId) => {
  const res = await fetch(`${SPORTSDB_BASE}/lookupplayer.php?id=${playerId}`);
  if (!res.ok) throw new Error('Failed to fetch player details');
  return res.json();
};

export const getNews = async () => {
  // Assuming there is a news endpoint on the bzzoiro API
  const res = await fetch('/api/news');
  if (!res.ok) return [];
  return res.json();
};
