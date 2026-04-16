import 'dotenv/config';
import fetch from 'node-fetch';

async function test() {
  try {
    const apiKey = process.env.SPORTSBZZOIRO_API_KEY;
    const res = await fetch('https://sports.bzzoiro.com/api/predictions/', {
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    });
    const data = await res.json();
    const eventId = data.results[0].event.id;
    console.log('Event ID:', eventId);
    
    const res2 = await fetch(`https://sports.bzzoiro.com/api/events/${eventId}/`, {
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    });
    const data2 = await res2.json();
    console.log('Keys:', Object.keys(data2));
    console.log('home_form:', data2.home_form);
    console.log('away_form:', data2.away_form);
    console.log('head_to_head:', data2.head_to_head);
  } catch (e) {
    console.error(e);
  }
}

test();
