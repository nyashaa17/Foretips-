fetch("http://localhost:3000/api/v2/events/204851/incidents/")
  .then(r => r.json())
  .then(d => console.dir(d, { depth: null }))
  .catch(console.error);
