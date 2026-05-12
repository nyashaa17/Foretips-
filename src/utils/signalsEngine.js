export const generateSignals = (match) => {
  const signals = [];
  if (!match || !match.live_stats) return signals;

  const { home_score, away_score, current_minute, status } = match;
  const { home, away } = match.live_stats;
  
  if (!home || !away) return signals;

  const hxg = parseFloat(match.home_xg_live || 0);
  const axg = parseFloat(match.away_xg_live || 0);

  const homePossession = parseFloat(home.ball_possession || 50);
  const awayPossession = parseFloat(away.ball_possession || 50);
  
  const homeShotsOnTarget = parseInt(home.shots_on_target || 0);
  const awayShotsOnTarget = parseInt(away.shots_on_target || 0);
  
  const homeDangerousAttacks = parseInt(home.dangerous_attacks || home.total_shots || 0);
  const awayDangerousAttacks = parseInt(away.dangerous_attacks || away.total_shots || 0);

  const homeCorners = parseInt(home.corner_kicks || 0);
  const awayCorners = parseInt(away.corner_kicks || 0);

  const homeScoreNum = parseInt(home_score || 0);
  const awayScoreNum = parseInt(away_score || 0);
  const totalScore = homeScoreNum + awayScoreNum;
  const totalShotsOnTarget = homeShotsOnTarget + awayShotsOnTarget;
  const totalDangerousAttacks = homeDangerousAttacks + awayDangerousAttacks;
  const totalXG = hxg + axg;

  // Signal Score = (Shots on target × 3) + (Dangerous attacks × 0.4) + (Corners × 1.5) + (Possession dominance × 0.2) + (xG × 10)
  const calcScore = (sot, dang, corn, poss, xg) => {
      const possDiff = Math.max(0, poss - 50);
      return (sot * 3) + (dang * 0.4) + (corn * 1.5) + (possDiff * 0.2) + (xg * 10);
  };

  const homeSignalScore = calcScore(homeShotsOnTarget, homeDangerousAttacks, homeCorners, homePossession, hxg);
  const awaySignalScore = calcScore(awayShotsOnTarget, awayDangerousAttacks, awayCorners, awayPossession, axg);
  const totalSignalScore = homeSignalScore + awaySignalScore;

  // Determine Confidence %
  const getConfidenceLevel = (score) => {
      let pct = Math.min(99, Math.round((score / 80) * 100));
      if (pct < 10) pct = 10;
      return pct;
  };

  const homeOdds = parseFloat(match.odds_home || 0);
  const awayOdds = parseFloat(match.odds_away || 0);

  const isEarly = current_minute < 30;
  const isMid = current_minute >= 30 && current_minute < 60;
  const isLate = current_minute >= 60 && current_minute < 80;
  const isVeryLate = current_minute >= 80; // Changed to catch 80+ properly

  const getUrgency = (pct) => {
    if (pct >= 75) return 'HIGH';
    if (pct >= 50) return 'MEDIUM';
    return 'LOW';
  };

  const commonStats = {
    hsot: homeShotsOnTarget,
    asot: awayShotsOnTarget,
    hdang: homeDangerousAttacks,
    adang: awayDangerousAttacks,
    hxg: hxg.toFixed(2),
    axg: axg.toFixed(2),
    hposs: homePossession,
    aposs: awayPossession,
  };

  // Avoid signals Filter -> Under Goals Signal
  if (totalShotsOnTarget <= 4 && totalXG < 1.2 && current_minute >= 70 && current_minute < 88) {
     signals.push({
        type: 'UNDER_GOALS',
        title: 'Match Winding Down ⚠️',
        description: `Very few clear chances created, slow match pace.`,
        recommendation: `📉 BET NOW: Under ${totalScore + 1.5} Goals`,
        confidencePercent: 85,
        urgency: 'HIGH',
        color: 'slate',
        stats: commonStats
      });
      return signals; 
  }

  const diffThreshold = 10 + (current_minute * 0.2);
  const minScoreThreshold = 15 + (current_minute * 0.4);

  let bestSignal = null;

  // 1. Next Goal Signal (Home/Away Dominance)
  if (homeSignalScore > awaySignalScore + diffThreshold && homeSignalScore > minScoreThreshold && hxg > 0.3) {
      const conf = getConfidenceLevel(homeSignalScore);
      bestSignal = {
        type: 'MOMENTUM_HOME',
        title: 'Home Momentum 📈',
        description: `Home team is dominating.`,
        recommendation: `🔥 BET NOW: Over ${totalScore + 0.5} Goals`,
        confidencePercent: conf,
        urgency: getUrgency(conf),
        color: 'green',
        stats: commonStats
      };
  } else if (awaySignalScore > homeSignalScore + diffThreshold && awaySignalScore > minScoreThreshold && axg > 0.3) {
      const conf = getConfidenceLevel(awaySignalScore);
      bestSignal = {
        type: 'MOMENTUM_AWAY',
        title: 'Away Momentum 📈',
        description: `Away team is dominating.`,
        recommendation: `🔥 BET NOW: Over ${totalScore + 0.5} Goals`,
        confidencePercent: conf,
        urgency: getUrgency(conf),
        color: 'green',
        stats: commonStats
      };
  }

  // 2. Goal Expected (Over 0.5 / Next Goal)
  const expectedTotalScore = 25 + (current_minute * 0.8);
  if (totalScore === 0 && totalSignalScore > expectedTotalScore && current_minute > 20 && status !== 'halftime' && status !== 'HT' && totalXG > 0.8) {
      const conf = getConfidenceLevel(totalSignalScore);
      const isStronger = !bestSignal || conf > bestSignal.confidencePercent;
      
      if (isStronger) {
         bestSignal = {
            type: 'GOAL_EXPECTED',
            title: 'Goal Expected 🔥',
            description: `High intensity! Both teams pushing but still 0-0.`,
            recommendation: `🔥 BET NOW: Over ${totalScore + 0.5} Goals @ 1.45+`,
            confidencePercent: conf,
            urgency: getUrgency(conf),
            color: 'red' 
         };
      }
  }

  // 3. Late Drama
  if (isVeryLate && (bestSignal == null || bestSignal.urgency !== 'HIGH')) {
     if (Math.abs(homeScoreNum - awayScoreNum) <= 1) { // Loosened to any tight game
         if (homeSignalScore > 45 || awaySignalScore > 45 || totalSignalScore > 80) {
            const conf = getConfidenceLevel(Math.max(homeSignalScore, awaySignalScore, totalSignalScore));
            bestSignal = {
              type: 'LATE_DRAMA',
              title: 'Late Goal Alert 🚨',
              description: `Match winding down but pressure is peaking.`,
              recommendation: `🔥 BET NOW: Over ${totalScore + 0.5} Goals`,
              confidencePercent: Math.max(conf, 75), // Lowered confidence slightly
              urgency: 'HIGH',
              color: 'orange',
              stats: commonStats
            };
         }
     }
  }

  // 4. Underdog Scored First (Game opens up)
  const isUnderdogHome = homeOdds > awayOdds + 1.5;
  const isUnderdogAway = awayOdds > homeOdds + 1.5;
  
  if (bestSignal == null && totalScore >= 1 && totalScore <= 2 && current_minute < 75 && totalSignalScore > 20) {
     if ((isUnderdogHome && homeScoreNum > awayScoreNum) || (isUnderdogAway && awayScoreNum > homeScoreNum)) {
         const conf = getConfidenceLevel(totalSignalScore) + 20; // Boost confidence
         bestSignal = {
            type: 'UNDERDOG_SCORED',
            title: 'Underdog Scored 💥',
            description: `Underdog took the lead! The game will open up as the favorites push back.`,
            recommendation: `🔥 BET NOW: Over ${totalScore + 0.5} Goals / BTTS`,
            confidencePercent: Math.min(conf, 95),
            urgency: 'HIGH',
            color: 'red',
            stats: commonStats
         };
     }
  }

  // Removed Early Game suppression to allow more signals to appear

  if (bestSignal && !bestSignal.stats) {
      bestSignal.stats = commonStats;
  }

  if (bestSignal) {
      signals.push(bestSignal);
  }

  return signals;
};

export const clearLiveSignalsHistory = async () => {
  localStorage.removeItem('tracked_signals');
  try {
    const { clearLiveSignalsDB } = await import('../services/liveSignalsService');
    await clearLiveSignalsDB();
  } catch(e) {}
  // Trigger a custom event or you can simply reload page to show it cleared
  window.location.reload();
};

export const getSignalStats = () => {
  try {
    const stored = localStorage.getItem('tracked_signals');
    if (!stored) return { total: 0, won: 0, lost: 0, accuracy: 0, pending: 0 };
    const tracked = JSON.parse(stored);
    let won = 0, lost = 0, pending = 0;
    Object.values(tracked).forEach(sig => {
      if (sig.status === 'WON') won++;
      else if (sig.status === 'LOST') lost++;
      else if (sig.status === 'PENDING') pending++;
    });
    const totalFinished = won + lost;
    return {
      total: totalFinished + pending,
      won,
      lost,
      pending,
      accuracy: totalFinished > 0 ? Math.round((won / totalFinished) * 100) : 0
    };
  } catch (e) {
    return { total: 0, won: 0, lost: 0, accuracy: 0, pending: 0 };
  }
};

export const trackAndResolveSignals = (matches) => {
  if (!matches) return [];

  let tracked = {};
  try {
    const stored = localStorage.getItem('tracked_signals');
    if (stored) tracked = JSON.parse(stored);
  } catch(e) {}

  const resultSignals = [];
  const finishedStatuses = ['FT', 'FINISHED', 'ENDED', 'AET', 'PEN'];
  
  // Create a fast lookup for current live matches
  const matchesMap = {};

  matches.forEach(match => {
    matchesMap[match.id] = match;
    const activeConditions = generateSignals(match);
    
    activeConditions.forEach(cond => {
      const key = `${match.id}-${cond.type}`;
      if (!tracked[key]) {
        tracked[key] = {
           ...cond,
           matchId: match.id,
           id: key,
           status: 'PENDING',
           firedMinute: match.current_minute,
           homeScoreAtFire: match.home_score,
           awayScoreAtFire: match.away_score,
           timestamp: Date.now(),
           matchSnapshot: {
              id: match.id,
              home_team: match.home_team,
              away_team: match.away_team,
              home_score: match.home_score,
              away_score: match.away_score,
              status: match.status,
              current_minute: match.current_minute
           }
        };
      } else if (tracked[key].status === 'PENDING') {
         // Update live stats & confidence on pending signals
         tracked[key].stats = cond.stats;
         tracked[key].confidencePercent = cond.confidencePercent;
         tracked[key].urgency = cond.urgency;
         // Do not update recommendation so the historical line remains accurate
         // Always update match snapshot while it's still alive
         if (tracked[key].matchSnapshot) {
             tracked[key].matchSnapshot.home_score = match.home_score;
             tracked[key].matchSnapshot.away_score = match.away_score;
             tracked[key].matchSnapshot.status = match.status;
             tracked[key].matchSnapshot.current_minute = match.current_minute;
         }
      }
    });
  });

  Object.keys(tracked).forEach(key => {
    const sig = tracked[key];
    const liveMatch = matchesMap[sig.matchId];
    
    // We update pending signals based on live match if available
    if (sig.status === 'PENDING' && liveMatch) {
       const currentTotal = parseInt(liveMatch.home_score || 0) + parseInt(liveMatch.away_score || 0);
       const firedTotal = parseInt(sig.homeScoreAtFire || 0) + parseInt(sig.awayScoreAtFire || 0);
       const isMatchFinished = finishedStatuses.includes(String(liveMatch.status).trim().toUpperCase());
       
       if (sig.type === 'GOAL_EXPECTED' || sig.type === 'MOMENTUM_HOME' || sig.type === 'MOMENTUM_AWAY' || sig.type === 'LATE_DRAMA' || sig.type === 'UNDERDOG_SCORED') {
          if (currentTotal > firedTotal) sig.status = 'WON';
          else if (isMatchFinished) sig.status = 'LOST';
       }
       if (sig.type === 'UNDER_GOALS') {
          if (currentTotal > firedTotal) sig.status = 'LOST';
          else if (isMatchFinished) sig.status = 'WON';
       }
       
       // Update snapshot with latest score if it won or lost exactly now
       if (sig.status !== 'PENDING' && sig.matchSnapshot) {
          sig.matchSnapshot.home_score = liveMatch.home_score;
          sig.matchSnapshot.away_score = liveMatch.away_score;
          sig.matchSnapshot.status = liveMatch.status;
       }
    } else if (sig.status === 'PENDING' && !liveMatch) {
       // Match dropped from live matches without resolving? We mark it LOST as the game probably ended 0-0.
       // In a real app we'd fetch the FT score, but for now we timeout/LOST it.
       const hoursPassed = (Date.now() - sig.timestamp) / (1000 * 60 * 60);
       // If it is dropped from live matches, and 30 minutes have passed since signal was fired, count as resolved
       if (hoursPassed > 0.5) {
          if (sig.type === 'UNDER_GOALS') {
             sig.status = 'WON'; // If it dropped and no goals recorded, under goals won
          } else {
             sig.status = 'LOST'; // presumed lost
          }
       }
    }
    
    // Use the live match object if available, otherwise use the stored snapshot
    const displayMatch = liveMatch || sig.matchSnapshot;
    
    // Only push if we have some match data
    if (displayMatch) {
        resultSignals.push({ match: displayMatch, signal: sig });
    }
  });

  const allKeys = Object.keys(tracked).sort((a,b) => tracked[b].timestamp - tracked[a].timestamp);
  const toKeep = allKeys.slice(0, 500);
  const slimTracked = {};
  toKeep.forEach(k => slimTracked[k] = tracked[k]);
  
  try {
    localStorage.setItem('tracked_signals', JSON.stringify(slimTracked));
    // Also sync to DB if possible (in the background)
    if (window._syncTimeout) clearTimeout(window._syncTimeout);
    window._syncTimeout = setTimeout(async () => {
       const { syncLiveSignals } = await import('../services/liveSignalsService');
       await syncLiveSignals(slimTracked);
    }, 2000);
  } catch(e) {}

  return resultSignals.sort((a, b) => {
    if (a.signal.status === 'PENDING' && b.signal.status !== 'PENDING') return -1;
    if (a.signal.status !== 'PENDING' && b.signal.status === 'PENDING') return 1;
    return b.signal.timestamp - a.signal.timestamp;
  });
};
