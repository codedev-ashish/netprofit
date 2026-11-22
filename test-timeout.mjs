const url = "http://localhost:3000/api/ai/fetch-chittorgarh";
const payload = { url: "https://www.chittorgarh.com/ipo/juniper-green-energy-ipo/2492/" };

console.log("Starting fetch at", new Date().toISOString());
const start = Date.now();

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
  .then(res => {
     console.log("Got response in", Date.now() - start, "ms. Status:", res.status);
     return res.text();
  })
  .then(text => {
    console.log("Response text length:", text.length);
  })
  .catch(err => {
    console.error("Fetch failed after", Date.now() - start, "ms");
    console.error(err);
  });
