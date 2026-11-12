// מסלול חדש — site script: mobile menu, footer year, enquiry form.
(function () {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'סגירת התפריט' : 'פתיחת התפריט');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));
  }

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Enquiry form: validates, then opens the visitor's mail app addressed to the association.
  // To collect leads automatically, set data-endpoint on the form to a form service URL.
  document.querySelectorAll('form[data-enquiry]').forEach(form => {
    const status = form.querySelector('[data-form-status]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let firstBad = null, bad = 0;
      form.querySelectorAll('[required]').forEach(field => {
        const err = form.querySelector('#' + field.id + '-error');
        let msg = '';
        if (!field.value.trim()) msg = 'נא למלא ' + field.dataset.name;
        else if (field.type === 'email' && !/^\S+@\S+\.\S+$/.test(field.value)) msg = 'נא לכתוב כתובת מייל תקינה, עם @';
        else if (field.type === 'tel' && field.value.replace(/\D/g, '').length < 9) msg = 'נא לכתוב מספר טלפון מלא';
        field.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (err) err.textContent = msg;
        if (msg) { bad++; firstBad = firstBad || field; }
      });
      if (bad) { status.textContent = bad === 1 ? 'יש שדה אחד לתיקון' : 'יש ' + bad + ' שדות לתיקון'; firstBad.focus(); return; }

      const data = Object.fromEntries(new FormData(form));
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        status.textContent = 'שולחים…';
        try {
          const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error();
          status.textContent = 'הפנייה נשלחה. נחזור אליכם תוך יום עבודה.';
          form.reset();
        } catch { status.textContent = 'השליחה לא הצליחה. אפשר להתקשר או לשלוח וואטסאפ.'; }
        return;
      }
      const lines = Object.entries(data).filter(([k]) => k !== 'consent').map(([k, v]) => {
        const label = form.querySelector('[name="' + k + '"]')?.dataset.name || k;
        return label + ': ' + v;
      });
      const subject = form.dataset.subject || 'פנייה מהאתר';
      location.href = 'mailto:newmaslul@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      status.textContent = 'נפתחה הודעת מייל מוכנה. נשאר רק ללחוץ "שליחה".';
    });
  });
  // Framed videos: a pause/play button, and no autoplay for people who prefer reduced motion.
  const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
  const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>';
  document.querySelectorAll('.photo--video').forEach(box => {
    const v = box.querySelector('video'), b = box.querySelector('.video-toggle');
    if (!v || !b) return;
    const sync = () => { const p = v.paused; b.innerHTML = p ? playIcon : pauseIcon; b.setAttribute('aria-label', p ? 'הפעלת הסרטון' : 'עצירת הסרטון'); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) v.pause();
    b.addEventListener('click', () => { if (v.paused) v.play(); else v.pause(); });
    v.addEventListener('play', sync); v.addEventListener('pause', sync); sync();
  });
})();

