import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "https://qyebxlyciijxdwapvyiy.supabase.co",
  process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_IwNd9nv2nnTF-b7LsV7gSg_fCFxcdgC"
);

async function checkSchema() {
  try {
    const { data: q1, error: e1 } = await supabase.from('predictions').select('*').limit(1);
    const { data: q2, error: e2 } = await supabase.from('api_cache').select('*').limit(1);
    
    console.log('predictions error:', e1?.message);
    if(q1?.length > 0) console.log('predictions cols:', Object.keys(q1[0]));
    
    console.log('api_cache error:', e2?.message);
    if(q2?.length > 0) console.log('api_cache cols:', Object.keys(q2[0]));
  } catch (e) {
    console.error(e);
  }
}

checkSchema();
