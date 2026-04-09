async function test() {
  const leagueCode = 'rou.1';
  let standingsRes = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${leagueCode}/standings`);
  let standingsData = await standingsRes.json();
  let entries = standingsData.children?.[0]?.standings?.entries;

  if (!entries || entries.length === 0) {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 2; year--) {
      console.log('Trying year', year);
      const fallbackRes = await fetch(`https://site.api.espn.com/apis/v2/sports/soccer/${leagueCode}/standings?season=${year}`);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const fallbackEntries = fallbackData.children?.[0]?.standings?.entries;
        if (fallbackEntries && fallbackEntries.length > 0) {
          entries = fallbackEntries;
          console.log('Found entries for year', year);
          break;
        }
      }
    }
  }
  
  console.log(entries ? entries.length : 0);
}

test();
