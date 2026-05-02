fetch("http://localhost:3000/api/v2/events/204851/odds/")
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
