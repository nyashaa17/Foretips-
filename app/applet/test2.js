import fetch from 'node-fetch';

async function test2() {
  const res = await fetch('https://sports.bzzoiro.com/api/events/?status=finished');
  const json = await res.json();
  if (json.results && json.results.length > 0) {
    const event = json.results.find(e => e.momentum || e.shotmap || e.average_positions);
    if (event) {
      console.log('Momentum:', JSON.stringify(event.momentum)?.substring(0, 100));
      console.log('Shotmap:', JSON.stringify(event.shotmap)?.substring(0, 100));
      console.log('Avg Pos:', JSON.stringify(event.average_positions)?.substring(0, 100));
    } else {
      console.log('No events with spatial data found.');
    }
  } else {
    console.log('No finished events found.');
  }
}
test2();
