import 'dotenv/config';
import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://sports.bzzoiro.com/api/predictions/?limit=200', {
      headers: {
        'Authorization': `Token ${process.env.SPORTSBZZOIRO_API_KEY}`
      }
    });
    const data = await res.json();
    for(const p of data.results) {
      if(p.event.status === 'FT' || p.event.status === 'finished' || p.event.status === 'Finished') {
         console.log(p.event.status, p.event.odds_home, p.event.pregame_odds_home);
         console.log('Prediction object keys:', Object.keys(p));
         console.log('Event object keys:', Object.keys(p.event));
         
         const evt = p.event;
         console.log({
           evt_odds_home: evt.odds_home,
           evt_predgame: evt.pregame_odds_home, 
           evt_pre_odds: evt.pre_odds_home,
           pred_odds_home: p.odds_home
         });
         break;
      }
    }
  } catch(e) {
    console.error(e);
  }
}
test();
