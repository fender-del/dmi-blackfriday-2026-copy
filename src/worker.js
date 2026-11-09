// DMI Black Friday 2026: serves ./site and forwards form submissions to GoHighLevel.
// The GHL Private Integration Token stays server-side (secret GHL_TOKEN); the page only ever calls /api/lead.
// Secrets/vars: GHL_TOKEN + REVIEW_KEY (wrangler secrets), GHL_LOCATION_ID (var in wrangler.jsonc).
// /api/feedback: Ed's review board (/review/?k=REVIEW_KEY), stored in KV namespace FEEDBACK.

const GHL = 'https://services.leadconnectorhq.com';
const TAG_BY_TYPE = { lead: 'bf26-lead', deposit_started: 'bf26-checkout-started' };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/lead') return handleLead(req, env);
    if (url.pathname.startsWith('/api/feedback')) return handleFeedback(req, env, url);
    const res = await env.ASSETS.fetch(req);
    if (url.pathname.startsWith('/review')) {
      // the review board is private: never indexed, never cached
      const h = new Headers(res.headers);
      h.set('X-Robots-Tag', 'noindex, nofollow');
      h.set('Cache-Control', 'no-store');
      return new Response(res.body, { status: res.status, headers: h });
    }
    return res;
  },
};

async function handleLead(req, env) {
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
  if (!env.GHL_TOKEN || !env.GHL_LOCATION_ID) return json({ ok: false, error: 'GHL not configured' }, 503);

  let d;
  try { d = await req.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }
  const email = String(d.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'invalid email' }, 400);

  const name = String(d.name || '').trim().slice(0, 120);
  const [firstName, ...rest] = name.split(/\s+/);
  const tags = ['black-friday-2026', TAG_BY_TYPE[d.type] || 'bf26-lead'];
  if (d.package) tags.push('bf26-' + (/premium/i.test(d.package) ? 'premium' : 'standard'));
  if (d.utm_source) tags.push('bf26-src-' + String(d.utm_source).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30));

  const contact = {
    locationId: env.GHL_LOCATION_ID,
    email,
    firstName: firstName || undefined,
    lastName: rest.join(' ') || undefined,
    name: name || undefined,
    companyName: String(d.business || '').trim().slice(0, 160) || undefined,
    phone: String(d.phone || '').trim() || undefined,
    source: 'Black Friday 2026 landing page',
    tags,
  };

  const headers = { Authorization: `Bearer ${env.GHL_TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' };
  const r = await fetch(`${GHL}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify(contact) });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.log('GHL upsert failed', r.status, JSON.stringify(out).slice(0, 300));
    return json({ ok: false, error: 'ghl ' + r.status }, 502);
  }
  const id = out.contact?.id;

  // Keep the full context (package, price, utm, page) as a note on the contact
  if (id) {
    const lines = [
      `Black Friday 2026: ${d.type === 'deposit_started' ? 'started $99 deposit checkout' : 'lead form (' + (d.form || 'landing') + ')'}`,
      d.package && `Package: ${d.package} ($${d.package_price})`,
      d.design && `Design picked: ${d.design}`,
      d.hosting && `Hosting: ${d.hosting} (12-month commitment)`,
      d.business && `Business: ${d.business}`,
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].filter(k => d[k]).map(k => `${k}: ${d[k]}`).join(' · '),
      `Page: ${d.page || ''} · ${d.submitted_at || new Date().toISOString()}`,
    ].filter(Boolean).join('\n');
    await fetch(`${GHL}/contacts/${id}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: lines }) }).catch(() => {});
  }
  return json({ ok: true, id });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

// ---- Review board: feedback items in KV, one key per item ("fb:<time>-<rand>") ----
const PAGES = ['landing', 'checkout', 'thank-you', 'other'];
async function handleFeedback(req, env, url) {
  if (!env.REVIEW_KEY || url.searchParams.get('k') !== env.REVIEW_KEY) return json({ ok: false, error: 'forbidden' }, 403);
  const clip = (v, n) => String(v || '').trim().slice(0, n);

  if (req.method === 'GET') {
    const items = [];
    let cursor;
    do {
      const l = await env.FEEDBACK.list({ prefix: 'fb:', cursor });
      const got = await Promise.all(l.keys.map(k => env.FEEDBACK.get(k.name, 'json')));
      got.forEach(x => x && items.push(x));
      cursor = l.list_complete ? null : l.cursor;
    } while (cursor);
    items.sort((a, b) => a.at.localeCompare(b.at));
    return json({ ok: true, items });
  }
  if (req.method !== 'POST') return json({ ok: false, error: 'GET or POST' }, 405);

  let d;
  try { d = await req.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }

  if (url.pathname.endsWith('/update')) {
    // mark done / reopen, or add Fender's reply
    const id = clip(d.id, 60);
    const item = id && await env.FEEDBACK.get(id, 'json');
    if (!item) return json({ ok: false, error: 'not found' }, 404);
    if (d.status === 'open' || d.status === 'done') item.status = d.status;
    if (typeof d.reply === 'string') item.reply = clip(d.reply, 2000);
    item.updated = new Date().toISOString();
    await env.FEEDBACK.put(id, JSON.stringify(item));
    return json({ ok: true, item });
  }

  const text = clip(d.text, 4000);
  if (!text) return json({ ok: false, error: 'empty' }, 400);
  const at = new Date().toISOString();
  const id = 'fb:' + at + '-' + Math.random().toString(36).slice(2, 7);
  const item = { id, at, page: PAGES.includes(d.page) ? d.page : 'other', section: clip(d.section, 80), name: clip(d.name, 60) || 'Ed', text, status: 'open' };
  await env.FEEDBACK.put(id, JSON.stringify(item));
  return json({ ok: true, item });
}
