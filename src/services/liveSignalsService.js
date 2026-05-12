import { supabase } from '../supabaseClient';

export const clearLiveSignalsDB = async () => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('live_signals')
      .delete()
      .neq('id', 'dummy_id_to_delete_all');
    if (error) console.error('Failed to clear live signals in DB:', error);
  } catch (err) {
    console.error('Exception clearing signals:', err);
  }
};

export const fetchLiveSignals = async () => {
  if (!supabase) return {};
  
  try {
    const { data, error } = await supabase
      .from('live_signals')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) {
      console.warn('Error fetching live signals from DB:', error);
      return {};
    }

    if (!data) return {};

    const tracked = {};
    data.forEach(sig => {
      tracked[sig.id] = sig;
    });

    return tracked;
  } catch (err) {
    console.error('Failed to fetch live signals:', err);
    return {};
  }
};

export const syncLiveSignals = async (tracked) => {
  if (!supabase) return;

  try {
    const values = Object.values(tracked).map(sig => ({
      id: sig.id,
      matchId: sig.matchId,
      type: sig.type,
      title: sig.title,
      description: sig.description,
      recommendation: sig.recommendation,
      confidencePercent: sig.confidencePercent,
      urgency: sig.urgency,
      color: sig.color,
      status: sig.status,
      firedMinute: sig.firedMinute,
      homeScoreAtFire: sig.homeScoreAtFire,
      awayScoreAtFire: sig.awayScoreAtFire,
      timestamp: sig.timestamp,
      stats: sig.stats,
      matchSnapshot: sig.matchSnapshot
    }));

    if (values.length === 0) return;

    // We take only the latest 20 signals to sync to avoid huge payloads during development
    const toSync = values.sort((a,b) => b.timestamp - a.timestamp).slice(0, 50);

    const { error } = await supabase
      .from('live_signals')
      .upsert(toSync, { onConflict: 'id' });

    if (error) {
      console.warn('Failed to sync live signals to DB:', error);
    }
  } catch (err) {
    console.error('Exception syncing signals:', err);
  }
};
