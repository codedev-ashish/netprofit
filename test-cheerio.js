const cheerio = require('cheerio');

const html = `<!-- e.g. custom CSS -->
<style> body { background: red; } </style>
<script>alert(1);</script>
<meta name="test" content="123" />`;

const $ = cheerio.load(html, null, false);
const rootNodes = $.root()[0].children;

console.log(rootNodes.map(n => {
  if (n.type === 'script') {
    return { name: n.name, innerHtml: $(n).html() };
  }
  return { type: n.type, name: n.name };
}));
