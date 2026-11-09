/* DMI Black Friday 2026 — config + forms. Fill the CONFIG values when GHL / Airwallex / Jesse send them. */
window.BF = {
  CONFIG: {
    // Our own Worker endpoint; it holds the GHL token and upserts the contact (src/worker.js).
    // Empty = demo mode, nothing is sent.
    ghlWebhook: '/api/lead',
    // Airwallex $99 deposit links (Ed). One link for both is fine: set both to the same URL.
    // Set the Airwallex success redirect to <site>/thank-you/?pkg=standard|premium
    airwallex: { standard: '', premium: '' },
    // Jesse's booking calendar (GHL calendar / Calendly)
    jesseCalendar: '',
  },
  PACKAGES: {
    standard: { name: 'Standard Website', price: 500, normal: 1000 },
    premium: { name: 'Premium Website', price: 990, normal: 2000 },
  },
  DEPOSIT: 99,
};

(function () {
  const { CONFIG } = window.BF;
  const fmt = n => '$' + n.toLocaleString('en-US');
  window.BF.fmt = fmt;

  // utm / source params travel with every lead so GHL can tell email vs social outreach apart
  const qs = new URLSearchParams(location.search);
  const utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
    const v = qs.get(k) || sessionStorage.getItem(k);
    if (v) { utm[k] = v; try { sessionStorage.setItem(k, v); } catch (e) {} }
  });

  window.BF.send = async function (payload) {
    const body = Object.assign({ campaign: 'Black Friday 2026 Website Sale', page: location.pathname, submitted_at: new Date().toISOString() }, utm, payload);
    try { sessionStorage.setItem('bf_lead', JSON.stringify({ name: body.name, email: body.email, business: body.business, phone: body.phone || '' })); } catch (e) {}
    if (!CONFIG.ghlWebhook) { console.info('[BF demo] lead not sent (no GHL webhook yet):', body); return true; }
    try {
      await fetch(CONFIG.ghlWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
      return true;
    } catch (e) { console.warn('GHL webhook failed', e); return false; }
  };

  window.BF.lead = function () { try { return JSON.parse(sessionStorage.getItem('bf_lead') || 'null'); } catch (e) { return null; } };

  // Lead forms (landing): send to GHL, then continue to the $99 checkout
  document.querySelectorAll('form[data-lead]').forEach(f => {
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      const btn = f.querySelector('button[type=submit]');
      btn.disabled = true;
      await window.BF.send({ type: 'lead', form: f.dataset.lead, name: d.name, email: d.email, business: d.business });
      location.href = 'checkout/';
    });
  });

  // Reveal each block once
  const els = document.querySelectorAll('.rv-in');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('on'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('on'));
})();
