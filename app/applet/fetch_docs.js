(async () => {
  try {
    const res = await fetch('https://sports.bzzoiro.com/docs');
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Length:", text.length);
    console.log("Content:", text.substring(0, 1000));
  } catch (e) {
    console.error(e);
  }
})();
