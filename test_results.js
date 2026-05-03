fetch("http://localhost:3000/api/finished/")
  .then(r => r.json())
  .then(d => {
      console.log("Results:");
      console.log(d);
  })
  .catch(console.error);
