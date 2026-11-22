const fs = require('fs');
const cheerio = require('cheerio');
fetch('https://www.chittorgarh.com/ipo/lalithaa-jewellery-mart-ipo/2469/')
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    $('script, style, iframe, nav, footer, header, svg, img').remove();
    $('td, th').append(' | ');
    $('tr, p, div, li, h1, h2, h3, h4, h5, h6').append('\n');
    $('span, a, strong, b, i, em').prepend(' ').append(' ');
    let contentText = $('body').text().replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    
    fs.writeFileSync('chittorgarh_test.txt', contentText);
    console.log('Registrar:', contentText.includes('Registrar'));
    console.log('Contact:', contentText.includes('Contact'));
    console.log('Manager:', contentText.includes('Manager'));
    console.log('Done!');
  });
