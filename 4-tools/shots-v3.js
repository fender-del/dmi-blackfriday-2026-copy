/* Per-block QA shots of the V3-based landing (desktop 1440x900 + phone 390x844), plus console errors and 404s. */
'use strict';
const fs = require('fs'), path = require('path');
const puppeteer = require('C:/Users/ASUS/Downloads/miracledetail - website rebuild/site/node_modules/puppeteer-core');
const BASE = process.argv[2] || 'http://localhost:8770/';
const OUT = path.join(__dirname, 'qa'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const V = { d: { width: 1440, height: 900, deviceScaleFactor: 1 }, m: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } };
const SHOTS = [['hero', '#top'], ['std', '#standard'], ['prm', '#premium'], ['rev', '#reviews'], ['end', '#contact'], ['foot', '.bf-strip']];
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'] });
  for (const [k, vp] of Object.entries(V)) {
    const p = await b.newPage(); await p.setViewport(vp);
    const errs = [];
    p.on('pageerror', e => errs.push('JS ' + e.message));
    p.on('response', r => { if (r.status() >= 400 && !r.url().includes('/api/')) errs.push(r.status() + ' ' + r.url()); });
    await p.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(3500);
    for (const [name, sel] of SHOTS) {
      await p.evaluate(s => { const el = document.querySelector(s); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - (s === '#top' ? 0 : 70)); }, sel);
      await sleep(1600);
      await p.screenshot({ path: path.join(OUT, `v3-${name}-${k}.png`) });
    }
    const h = await p.evaluate(() => [document.documentElement.scrollHeight, document.documentElement.scrollWidth, innerWidth, innerHeight]);
    console.log(k, 'height', h[0], '(' + (h[0] / h[3]).toFixed(1) + ' screens)', 'scrollW', h[1], '/', h[2], errs.length ? '\n  ' + errs.join('\n  ') : 'no errors');
    await p.close();
  }
  await b.close();
})();
