import * as cheerio from "cheerio";

const url = "https://www.chittorgarh.com/ipo/juniper-green-energy-ipo/2492/";
fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
})
.then(res => res.text())
.then(html => {
  const $ = cheerio.load(html);
  $('script, style, iframe, nav, footer, header, svg, img').remove();
  $('td, th').append(' | ');
  $('tr, p, div, li, h1, h2, h3, h4, h5, h6').append('\n');
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  
  console.log("Includes EPS?:", text.includes("EPS"));
  console.log("Includes RoNW?:", text.includes("RoNW"));
  console.log("Includes EBITDA Margin?:", text.includes("EBITDA Margin"));
  console.log("Includes 19,538.45?:", text.includes("19,538.45")); // Assets from the screenshot
  console.log("Includes 804.93?:", text.includes("804.93"));
})
.catch(console.error);
