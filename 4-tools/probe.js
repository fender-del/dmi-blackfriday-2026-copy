'use strict';
const puppeteer = require('C:/Users/ASUS/Downloads/miracledetail - website rebuild/site/node_modules/puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
  await p.goto(process.argv[2] || 'http://localhost:8770/', { waitUntil: 'networkidle2' }); await new Promise(r => setTimeout(r, 2500));
  console.log(await p.evaluate(() => { const h = document.getElementById('dmxHeader'); const cs = getComputedStyle(h); const r = h.getBoundingClientRect();
    return JSON.stringify({ cls: h.className, top: r.top, h: r.height, pos: cs.position, tr: cs.transform, op: cs.opacity, vis: cs.visibility, disp: cs.display, bg: cs.backgroundColor, bodyCls: document.body.className, htmlCls: document.documentElement.className }); }));
  await b.close();
})();
