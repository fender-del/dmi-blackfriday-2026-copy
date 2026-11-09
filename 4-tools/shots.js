/* Full-page QA shots: desktop 1440 + phone 390 for each page. node 4-tools/shots.js [base] */
'use strict';
const fs = require('fs'), path = require('path');
const puppeteer = require('C:/Users/ASUS/Downloads/miracledetail - website rebuild/site/node_modules/puppeteer-core');
const BASE = process.argv[2] || 'http://localhost:8770/';
const OUT = path.join(__dirname, 'qa'); fs.mkdirSync(OUT, { recursive: true });
const V = { d: { width: 1440, height: 900, deviceScaleFactor: 1 }, m: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } };
const PAGES = [['home', ''], ['checkout', 'checkout/?pkg=premium'], ['thanks', 'thank-you/?pkg=premium&demo=1']];
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--hide-scrollbars'] });
  for (const [k, vp] of Object.entries(V)) for (const [name, url] of PAGES) {
    const p = await b.newPage(); await p.setViewport(vp);
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto(BASE + url, { waitUntil: 'networkidle0' });
    await p.evaluate(async () => { document.querySelectorAll('.rv-in').forEach(e => e.classList.add('on'));
      document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'); await new Promise(r => setTimeout(r, 800)); });
    const info = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, w: innerWidth }));
    await p.screenshot({ path: path.join(OUT, `${name}-${k}.png`), fullPage: true });
    console.log(name, k, JSON.stringify(info), errs.length ? 'ERR ' + errs.join(' | ') : '');
    await p.close();
  }
  await b.close();
})();
