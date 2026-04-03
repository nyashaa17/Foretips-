/**
 * High-performance date filtering for football matches.
 * Instead of parsing the date for every match, we calculate the UTC boundaries
 * for Yesterday, Today, and Tomorrow based on the target timezone (UTC+2 / Africa/Harare).
 * Then we just do simple timestamp comparisons.
 */

// Get the start and end of a day in UTC, relative to a specific timezone
export function getDayBoundariesUTC(offsetDays = 0) {
  const now = new Date();
  
  // Since Zimbabwe is always UTC+2 (no daylight saving):
  const ZIMBABWE_OFFSET_MS = 2 * 60 * 60 * 1000;
  
  // Current UTC time
  const nowUTC = now.getTime();
  
  // Current Zimbabwe time (in ms)
  const nowZim = new Date(nowUTC + ZIMBABWE_OFFSET_MS);
  
  // Calculate midnight in Zimbabwe for the target day
  const targetZimMidnight = new Date(Date.UTC(
    nowZim.getUTCFullYear(),
    nowZim.getUTCMonth(),
    nowZim.getUTCDate() + offsetDays,
    0, 0, 0, 0
  ));
  
  // Convert back to UTC boundaries
  const startUTC = targetZimMidnight.getTime() - ZIMBABWE_OFFSET_MS;
  const endUTC = startUTC + (24 * 60 * 60 * 1000); // Add 24 hours
  
  return { startUTC, endUTC };
}

export function filterYesterdayMatches(matches) {
  const { startUTC, endUTC } = getDayBoundariesUTC(-1);
  return matches.filter(match => {
    const matchTime = new Date(match.event?.start_time || match.event?.event_date || match.start_time).getTime();
    return matchTime >= startUTC && matchTime < endUTC;
  });
}

export function filterTodayMatches(matches) {
  const { startUTC, endUTC } = getDayBoundariesUTC(0);
  return matches.filter(match => {
    const matchTime = new Date(match.event?.start_time || match.event?.event_date || match.start_time).getTime();
    return matchTime >= startUTC && matchTime < endUTC;
  });
}

export function filterTomorrowMatches(matches) {
  const { startUTC, endUTC } = getDayBoundariesUTC(1);
  return matches.filter(match => {
    const matchTime = new Date(match.event?.start_time || match.event?.event_date || match.start_time).getTime();
    return matchTime >= startUTC && matchTime < endUTC;
  });
}
