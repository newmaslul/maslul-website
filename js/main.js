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

  // Partner spiral: a pause button (WCAG 2.2.2 — anything moving longer than 5 seconds can be stopped)
  document.querySelectorAll('[data-motion-toggle]').forEach(b => {
    const target = b.previousElementSibling;
    b.addEventListener('click', () => {
      const paused = target.classList.toggle('is-paused');
      b.setAttribute('aria-pressed', String(paused));
      b.textContent = paused ? 'הפעלת התנועה' : 'עצירת התנועה';
    });
  });
  // YouTube background videos: pausing unloads the player and shows the still photo behind it
  document.querySelectorAll('[data-yt-toggle]').forEach(b => {
    const box = b.closest('.photo--yt'), f = box.querySelector('iframe'), src = f.getAttribute('src');
    const sync = () => { const p = box.classList.contains('is-paused'); b.innerHTML = p ? playIcon : pauseIcon; b.setAttribute('aria-label', p ? 'הפעלת הסרטון' : 'עצירת הסרטון'); };
    b.addEventListener('click', () => {
      const p = box.classList.toggle('is-paused');
      f.setAttribute('src', p ? 'about:blank' : src);
      sync();
    });
    sync();
  });

  // Parent-child: upcoming trips. Past trips hide themselves; each gets a WhatsApp sign-up link.
  document.querySelectorAll('[data-trips]').forEach(list => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let shown = 0;
    list.querySelectorAll('[data-end]').forEach(li => {
      const end = new Date(li.dataset.end + 'T23:59:59');
      if (end < today) { li.remove(); return; }
      shown++;
      const a = li.querySelector('[data-trip-wa]');
      if (a) a.href = 'https://api.whatsapp.com/send?phone=972528501313&text=' + encodeURIComponent('שלום, אשמח להירשם למסע הורה וילד: ' + li.dataset.place + ', ' + li.dataset.when);
    });
    const section = list.closest('section') || list.parentElement;
    const empty = section.querySelector('[data-trips-empty]');
    if (empty) empty.hidden = shown > 0;
    const cal = section.querySelector('[data-trips-cal]');
    if (cal && shown) tripsCalendar(cal, [...list.querySelectorAll('[data-end]')], today);
  });

  // Month calendar drawn from the trips list: trip days are marked; clicking one points at its trip.
  function tripsCalendar(cal, items, today) {
    const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const day = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const trips = items.map((li, i) => {
      if (!li.id) li.id = 'trip-' + (i + 1);
      const end = day(li.dataset.end);
      return { li, start: li.dataset.start ? day(li.dataset.start) : end, end, place: li.dataset.place };
    }).sort((a, b) => a.start - b.start);
    const key = d => d.getFullYear() * 12 + d.getMonth();
    // Browse from this month up to 12 months ahead (further if a trip is later); open on the next trip's month.
    const first = key(today);
    const last = Math.max(first + 11, ...trips.map(t => key(t.end)));
    let cur = Math.max(first, key(trips[0].start));
    cal.hidden = false;
    cal.innerHTML =
      '<div class="trips-cal__head"><button type="button" class="trips-cal__nav" data-step="-1" aria-label="החודש הקודם">›</button>' +
      '<b aria-live="polite"></b><button type="button" class="trips-cal__nav" data-step="1" aria-label="החודש הבא">‹</button></div>' +
      '<div class="trips-cal__grid"></div>' +
      '<p class="trips-cal__legend"><span></span>ימי מסע · לחצו על יום לפרטים</p>';
    const title = cal.querySelector('b');
    const grid = cal.querySelector('.trips-cal__grid');
    const navs = cal.querySelectorAll('[data-step]');
    const draw = () => {
      const y = Math.floor(cur / 12), m = cur % 12;
      title.textContent = MONTHS[m] + ' ' + y;
      navs[0].disabled = cur <= first; navs[1].disabled = cur >= last;
      let h = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map(d => '<span class="trips-cal__dow" aria-hidden="true">' + d + '</span>').join('');
      const lead = new Date(y, m, 1).getDay();
      for (let i = 0; i < lead; i++) h += '<span></span>';
      const days = new Date(y, m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const date = new Date(y, m, d);
        const t = trips.find(t => date >= t.start && date <= t.end);
        const cls = ['trips-cal__day'];
        if (+date === +today) cls.push('is-today');
        if (date < today) cls.push('is-past');
        if (t) {
          cls.push('is-trip');
          if (+date === +t.start) cls.push('is-start');
          if (+date === +t.end) cls.push('is-end');
          h += '<a class="' + cls.join(' ') + '" href="#' + t.li.id + '" aria-label="' + d + ' ב' + MONTHS[m] + ': ' + t.place + '">' + d + '</a>';
        } else {
          h += '<span class="' + cls.join(' ') + '">' + d + '</span>';
        }
      }
      grid.innerHTML = h;
      // The list shows only the trips of the month on view.
      let inMonth = 0;
      trips.forEach(t => { t.li.hidden = !(key(t.start) <= cur && cur <= key(t.end)); if (!t.li.hidden) inMonth++; });
      none.hidden = inMonth > 0;
      if (!inMonth) {
        const next = trips.find(t => key(t.start) > cur);
        none.innerHTML = '<p>אין כרגע מסעות בחודש ' + MONTHS[m] + ' ' + y + '.</p>' + (next
          ? '<button type="button" class="btn btn--secondary" data-goto="' + key(next.start) + '">למסע הבא: ' + next.place + ', ' + next.li.dataset.when + '</button>'
          : '<p>המסעות הבאים יפורסמו כאן בקרוב.</p>');
      }
    };
    const none = document.createElement('li');
    none.className = 'trip trip--none';
    none.setAttribute('aria-live', 'polite');
    trips[0].li.parentElement.appendChild(none);
    none.addEventListener('click', e => {
      const b = e.target.closest('[data-goto]');
      if (b) { cur = Number(b.dataset.goto); draw(); }
    });
    navs.forEach(b => b.addEventListener('click', () => { cur += Number(b.dataset.step); draw(); }));
    grid.addEventListener('click', e => {
      const a = e.target.closest('a.is-trip');
      if (!a) return;
      e.preventDefault();
      const li = document.getElementById(a.getAttribute('href').slice(1));
      li.scrollIntoView({ behavior: 'smooth', block: 'center' });
      li.classList.remove('is-flash'); void li.offsetWidth; li.classList.add('is-flash');
    });
    draw();
  }
})();

// Accessibility menu: built into the site (no third-party plugin). Settings are saved in localStorage.
(function () {
  const KEY = 'maslul-a11y';
  const root = document.documentElement;
  const opts = [
    ['contrast', 'ניגודיות גבוהה'],
    ['gray', 'גווני אפור'],
    ['links', 'הדגשת קישורים'],
    ['font', 'גופן קריא'],
    ['still', 'עצירת אנימציות'],
  ];
  const sizes = [100, 115, 130, 150];
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { s = {}; }
  s.size = Math.min(3, Math.max(0, s.size | 0));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  const apply = () => {
    root.classList.remove('a11y-size-1', 'a11y-size-2', 'a11y-size-3');
    if (s.size) root.classList.add('a11y-size-' + s.size);
    opts.forEach(([k]) => root.classList.toggle('a11y-' + k, !!s[k]));
    document.querySelectorAll('video').forEach(v => {
      if (s.still) v.pause(); else if (v.autoplay && v.paused) v.play().catch(() => {});
    });
  };
  apply();

  const icon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="12" cy="3.6" r="2.3"/><path d="M20.6 7.4c-2.6.7-5.6 1-8.6 1s-6-.3-8.6-1L3 9.3c2.2.6 4.5 1 6.8 1.1v3.1L8 21.3l1.9.6 2.1-6.6 2.1 6.6 1.9-.6-1.8-7.8v-3.1c2.3-.1 4.6-.5 6.8-1.1z"/></svg>';
  const wrap = document.createElement('div');
  wrap.className = 'a11y';
  wrap.innerHTML =
    '<button type="button" class="a11y__btn" aria-expanded="false" aria-controls="a11y-panel" aria-label="תפריט נגישות">' + icon + '</button>' +
    '<div class="a11y__panel" id="a11y-panel" role="region" aria-label="הגדרות נגישות" hidden>' +
      '<div class="a11y__head"><b>נגישות</b><button type="button" class="a11y__close" aria-label="סגירת תפריט הנגישות">✕</button></div>' +
      '<div class="a11y__size" role="group" aria-label="גודל טקסט"><span>גודל טקסט</span>' +
        '<button type="button" data-size="-1" aria-label="הקטנת טקסט">א-</button>' +
        '<output aria-live="polite"></output>' +
        '<button type="button" data-size="1" aria-label="הגדלת טקסט">א+</button></div>' +
      opts.map(([k, l]) => '<button type="button" class="a11y__opt" data-opt="' + k + '" aria-pressed="false">' + l + '</button>').join('') +
      '<button type="button" class="a11y__reset">איפוס הגדרות</button>' +
      '<a class="a11y__link" href="accessibility.html">הצהרת נגישות</a>' +
    '</div>';
  document.body.appendChild(wrap);

  const btn = wrap.querySelector('.a11y__btn');
  const panel = wrap.querySelector('.a11y__panel');
  const out = wrap.querySelector('output');
  const sync = () => {
    out.textContent = sizes[s.size] + '%';
    wrap.querySelectorAll('[data-opt]').forEach(b => b.setAttribute('aria-pressed', String(!!s[b.dataset.opt])));
  };
  const setOpen = open => {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('button').focus();
  };
  const change = () => { save(); apply(); sync(); };
  sync();
  btn.addEventListener('click', () => setOpen(panel.hidden));
  wrap.querySelector('.a11y__close').addEventListener('click', () => { setOpen(false); btn.focus(); });
  wrap.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => {
    s.size = Math.min(3, Math.max(0, s.size + Number(b.dataset.size))); change();
  }));
  wrap.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => { s[b.dataset.opt] = !s[b.dataset.opt]; change(); }));
  wrap.querySelector('.a11y__reset').addEventListener('click', () => { s = { size: 0 }; change(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); } });
  document.addEventListener('click', e => { if (!panel.hidden && !wrap.contains(e.target)) setOpen(false); });
})();
