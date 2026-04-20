import { getPredictions } from './src/services/api.js';

async function test() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const dateStr = date.toISOString().split('T')[0];
  
  console.log('Fetching without upcoming parameter...');
  const res1 = await getPredictions({ date_from: dateStr, date_to: dateStr, paginate: true });
  console.log('Count:', res1?.results?.length);

  console.log('Fetching with upcoming=false...');
  const res2 = await getPredictions({ date_from: dateStr, date_to: dateStr, upcoming: false, paginate: true });
  console.log('Count:', res2?.results?.length);
}
test();
