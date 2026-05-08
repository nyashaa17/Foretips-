const run = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/predictions/?page_size=3');
        if (response.ok) {
           const data = await response.json();
           console.log("Count for Madrid:", data.count);
        } else { console.log(response.status); }
    } catch(e) { }
}
run();
