const fetch = require('node-fetch');
const cheerio = require('cheerio');

fetch('https://www.chittorgarh.com/ipo/gp-eco-solutions-india-ipo/1742/')
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    $('script, style, iframe, nav, footer, header, svg, img').remove();
    $('td, th').append(' | ');
    $('tr, p, div, li, h1, h2, h3, h4, h5, h6').append('\n');
    $('span, a, strong, b, i, em').prepend(' ').append(' ');
    
    let text = $('body').text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    
    console.log("Registrar details text:");
    const idx = text.indexOf('IPO Registrar');
    if (idx !== -1) {
      console.log(text.substring(idx, idx + 500));
    }
  });
