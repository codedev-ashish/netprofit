const url = "http://localhost:3000/api/ai/fetch-chittorgarh";
const payload = { url: "https://www.chittorgarh.com/ipo/juniper-green-energy-ipo/2492/" };

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
  .then(res => res.text())
  .then(text => {
    console.log("Raw Response:");
    console.log(text);
  })
  .catch(err => {
    console.error("Fetch failed:", err);
  });
