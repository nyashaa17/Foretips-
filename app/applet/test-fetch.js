import fetch from 'node-fetch';

async function test() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const dateStr = date.toISOString().split('T')[0];
  
  // Without upcoming
  const u1 = `https://sports.bzzoiro.com/api/predictions/?date_from=${dateStr}&date_to=${dateStr}`;
  const r1 = await fetch(u1).then(r => r.json());
  console.log('Without upcoming:', r1.count);

  // With upcoming=false
  const u2 = `https://sports.bzzoiro.com/api/predictions/?date_from=${dateStr}&date_to=${dateStr}&upcoming=false`;
  const r2 = await fetch(u2).then(r => r.json());
  console.log('With upcoming=false:', r2.count);
}

test();
