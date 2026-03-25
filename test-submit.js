import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qyebxlyciijxdwapvyiy.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_IwNd9nv2nnTF-b7LsV7gSg_fCFxcdgC";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

async function testSubmitTip() {
  console.log("Starting tip submission test...");
  
  // First, sign in to get a valid user session
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nyashamadeko@gmail.com',
    password: 'password123' // Just guessing, or we can just use a dummy user if RLS allows it, but RLS might be enabled.
  });
  
  // Actually, let's just try to insert without auth to see if it's an RLS issue or schema issue
  const predictionData = JSON.stringify({
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    kickoffTime: "2026-03-16T12:00",
    market: "Home Win (1)",
    odds: "1.5",
    reasoning: "Test"
  });

  try {
    const { data, error } = await supabase
      .from('community_tips')
      .insert([{ 
        user_id: '00000000-0000-0000-0000-000000000000', // dummy uuid
        match_id: 'Arsenal vs Chelsea', 
        prediction: predictionData, 
        confidence: 80 
      }]);
      
    console.log("Result:", { data, error });
  } catch (err) {
    console.error("Exception:", err);
  }
}

testSubmitTip();
