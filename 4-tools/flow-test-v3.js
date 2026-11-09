/* Flow test on the V3-based landing: hero form -> checkout (prefilled), Premium "Choose this design" -> checkout,
   Standard "I want one like this" -> checkout, and the hero wall must not hijack clicks on the form. */
'use strict';
const puppeteer = require('C:/Users/ASUS/Downloads/miracledetail - website rebuild/site/node_modules/puppeteer-core');
const BASE = process.argv[2] || 'http://localhost:8770/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
  const errs = []; p.on('pageerror', e => errs.push('JS ' + e.message));
  let popups = 0; b.on('targetcreated', () => popups++);
  // never write test leads into the real GHL; capture where the deposit button goes instead of loading Stripe
  const sent = []; let payUrl = '';
  await p.setRequestInterception(true);
  p.on('request', r => {
    const u = r.url();
    if (u.includes('/api/lead')) { sent.push(JSON.parse(r.postData() || '{}')); return r.respond({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); }
    if (u.includes('fastpaydirect.com')) { if (!payUrl) payUrl = u; return r.respond({ status: 200, contentType: 'text/html', body: 'pay' }); }
    r.continue();
  });

  // 1. hero form: move the mouse over the wall first so a tile is "hot", then click into the form
  await p.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(3000);
  await p.mouse.move(1200, 300); await sleep(600);
  const box = await (await p.$('#claim [name=name]')).boundingBox();
  await p.mouse.click(box.x + 40, box.y + 20); await sleep(400);
  console.log('1. click in hero form opened a popup:', popups > 0 ? 'YES (bug)' : 'no');
  await p.keyboard.type('Test Lead'); await p.type('#claim [name=email]', 'test@example.com'); await p.type('#claim [name=business]', 'Test Detailing');
  await Promise.all([p.waitForNavigation(), p.click('#claim button')]);
  console.log('   ->', p.url().replace(BASE, '/'), '| prefill:', await p.evaluate(() => [document.querySelector('#f-name').value, document.querySelector('#f-biz').value].join(' / ')));

  // 2. Premium: pick design 3, Choose this design
  await p.goto(BASE + '#premium', { waitUntil: 'networkidle2' }); await sleep(1500);
  await p.evaluate(() => { const t = document.querySelectorAll('#dmxP3Strip [role=tab], #dmxP3Strip button'); if (t[2]) t[2].click(); });
  await sleep(500);
  const nm = await p.$eval('#dmxP3Name', e => e.textContent);
  await Promise.all([p.waitForNavigation(), p.$eval('#dmxP3Want', e => e.click())]);
  console.log('2. Premium picked', nm, '->', decodeURIComponent(p.url().replace(BASE, '/')), '| summary:', await p.evaluate(() => [sumName.textContent, dDesign.textContent, lnRest.textContent].join(' / ')));

  // 3. Standard: open the 2nd website, I want one like this
  await p.goto(BASE + '#standard', { waitUntil: 'networkidle2' }); await sleep(1500);
  await p.evaluate(() => document.querySelectorAll('#stdRail .st')[1].click()); await sleep(800);
  const sn = await p.$eval('#vwName', e => e.textContent);
  await Promise.all([p.waitForNavigation(), p.$eval('#vwWant', e => e.click())]);
  console.log('3. Standard picked', sn, '->', decodeURIComponent(p.url().replace(BASE, '/')), '| summary:', await p.evaluate(() => [sumName.textContent, dDesign.textContent].join(' / ')));

  // 4. switching package on checkout drops the design
  await p.click('label.opt:nth-child(2)'); await sleep(200);
  console.log('4. switched to Premium, design row hidden:', await p.$eval('#lnDesign', e => e.hidden));
  // 5. deposit: pick $50 hosting, agree, pay -> GHL payment link for Premium with the email
  await p.click('.host label:nth-child(3)'); await sleep(100);
  console.log('5. hosting line:', await p.$eval('#lnHost', e => e.textContent));
  await p.$eval('#f-email', e => e.value = 'qa@example.com'); await p.$eval('#f-name', e => e.value = 'QA Test'); await p.$eval('#f-biz', e => e.value = 'QA Biz');
  await p.$eval('input[name=agree]', e => e.checked = true);
  await Promise.all([p.waitForNavigation().catch(() => {}), p.click('#payBtn')]); await sleep(800);
  console.log('   -> pay url:', payUrl || p.url());
  console.log('   lead payloads:', sent.map(x => x.type + (x.hosting ? ' [' + x.hosting + ']' : '')).join(', '));
  // 6. thank-you: Jesse button prefilled
  await p.goto(BASE + 'thank-you/?pkg=premium&paid=1', { waitUntil: 'networkidle2' });
  console.log('6. thank-you:', await p.$eval('#pkgName', e => e.textContent), '|', await p.$eval('#bookBtn', e => e.href));
  console.log('errors:', errs.length ? errs : 'none', '| popups:', popups);
  await b.close();
})();
