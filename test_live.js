fetch("http://localhost:3000/api/live/")
  .then(r => r.json())
  .then(d => {
      console.log("Status counts:");
      const statuses = (d.results || d).map(m => m.status);
      console.log(statuses);
  })
  .catch(console.error);
