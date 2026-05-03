fetch("http://localhost:3000/api/predictions/?event=201402")
  .then(r => r.json())
  .then(d => {
    console.log("Prediction count:", d.results?.length);
    console.log("First prediction event:", d.results?.[0]?.event?.name || d.results?.[0]?.event?.home_team + ' vs ' + d.results?.[0]?.event?.away_team);
  })
  .catch(console.error);
