/* ============================================================
   THE CRAB HOUSE
   No animation library, no smooth-scroll hijack. Four small jobs:
   say whether the kitchen is open, draw the season chart, work out
   how much to order, and lift blocks in as they arrive.
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#year').textContent = new Date().getFullYear();

  /* ---------------- open or shut ----------------
     The same hours as the JSON-LD in <head>. If they change, they
     have to change in both places or Google publishes the stale one.
     Times are the restaurant's local wall clock; a visitor in another
     timezone sees Hattiesburg's hours, which is the useful answer. */
  const HOURS = {
    0: [11 * 60, 21 * 60],          // Sunday
    1: [10 * 60, 21 * 60],
    2: [10 * 60, 21 * 60],
    3: [10 * 60, 21 * 60],
    4: [10 * 60, 21 * 60],
    5: [10 * 60, 21 * 60 + 45],     // Friday
    6: [10 * 60, 21 * 60 + 45],     // Saturday
  };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const clock = (mins) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m ? `${h12}:${String(m).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`;
  };

  function readClock() {
    /* Read the wall clock in Hattiesburg rather than the visitor's, so
       someone checking from another state is told what they want to
       know: is it open there, now. */
    let now;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric',
        minute: 'numeric', hour12: false,
      }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t).value;
      const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      const hh = Number(get('hour')) % 24;
      now = { day: idx, mins: hh * 60 + Number(get('minute')) };
    } catch (e) {
      const d = new Date();
      now = { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
    return now;
  }

  function paintStatus() {
    const { day, mins } = readClock();
    const [open, close] = HOURS[day];
    const isOpen = mins >= open && mins < close;
    const soon = isOpen && close - mins <= 45;

    const box = $('#status');
    box.classList.toggle('open', isOpen);
    box.classList.toggle('shut', !isOpen);
    $('#statusWord').textContent = isOpen ? (soon ? 'Closing soon' : 'Open now') : 'Closed';
    $('#statusDetail').textContent = isOpen
      ? `until ${clock(close)}`
      : (mins < open ? `opens ${clock(open)}` : `opens ${clock(HOURS[(day + 1) % 7][0])} tomorrow`);

    const now = $('#todayNow');
    now.textContent = isOpen ? (soon ? 'Closing Soon' : 'Open Now') : 'Closed Right Now';
    now.classList.toggle('open', isOpen);
    now.classList.toggle('shut', !isOpen);
    $('#todaySub').textContent = isOpen
      ? 'Counter service, dine in or take out.'
      : `Back open ${mins < open ? clock(open) + ' today' : clock(HOURS[(day + 1) % 7][0]) + ' tomorrow'}.`;
    $('#todayHours').textContent = `${clock(open)} – ${clock(close)}`;
    $('#todayLine').textContent = `${DAYS[day]} · ${clock(open)} – ${clock(close)} · 3801 Hardy St`;

    $$('.hours tr').forEach((tr) => {
      tr.classList.toggle('today-row-hit', Number(tr.dataset.day) === day);
    });
  }
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------------- what's running ----------------
     General Gulf seasons, not a claim about today's cooler — the
     caveat under the chart says so, and every "ask" price on the
     board points at the phone for the same reason. */
  const SEASONS = [
    { name: 'Crawfish',    note: 'Best after a mild winter', on: [1, 2, 3, 4, 5, 6], peak: [3, 4, 5] },
    { name: 'Blue Crab',   note: 'Around all year, fattest late', on: [1,2,3,4,5,6,7,8,9,10,11,12], peak: [5, 6, 7, 8, 9, 10] },
    { name: 'Gulf Shrimp', note: 'Brown early, white in the fall', on: [1,2,3,4,5,6,7,8,9,10,11,12], peak: [6, 7, 8, 9, 10, 11, 12] },
    { name: 'Oysters',     note: 'The months with an R in them', on: [1, 2, 3, 4, 9, 10, 11, 12], peak: [11, 12, 1, 2] },
    { name: 'Snow Crab',   note: 'Shipped in, on all year', on: [1,2,3,4,5,6,7,8,9,10,11,12], peak: [] },
  ];

  const grid = $('.season-grid');
  SEASONS.forEach((row) => {
    const name = document.createElement('div');
    name.className = 'season-name';
    name.innerHTML = `${row.name}<small>${row.note}</small>`;
    grid.appendChild(name);

    for (let m = 1; m <= 12; m++) {
      const cell = document.createElement('div');
      cell.className = 'season-cell';
      const bar = document.createElement('div');
      const peak = row.peak.includes(m);
      bar.className = 'season-bar' + (peak ? ' peak' : row.on.includes(m) ? ' on' : '');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label',
        `${row.name}, month ${m}: ${peak ? 'at its best' : row.on.includes(m) ? 'usually around' : 'off season'}`);
      /* the inner element is what animates, so the track stays put */
      if (peak || row.on.includes(m)) bar.appendChild(document.createElement('i'));
      cell.appendChild(bar);
      grid.appendChild(cell);
    }
  });

  /* ---------------- how much to order ----------------
     Built only out of things the restaurant actually states: a platter
     that feeds a table, and wings sold in fixed counts. No invented
     weights, and it hands the big parties to the phone. */
  const WING_SIZES = [6, 10, 20, 50, 100];
  const PLATTER = 45.99;

  const range = $('#peopleRange');
  const out = $('#peopleOut');
  const list = $('#calcList');
  const total = $('#calcTotal');

  function suggest(n) {
    const platters = Math.max(1, Math.ceil(n / 4));
    const wanted = n * 6;
    const wings = WING_SIZES.find((s) => s >= wanted) || 100;
    const packs = wings === 100 && wanted > 100 ? Math.ceil(wanted / 100) : 1;

    const rows = [
      { qty: platters, label: 'Mega Combo Platter' + (platters > 1 ? 's' : ''), note: '$45.99 each' },
      { qty: packs > 1 ? `${packs}×${wings}` : wings, label: 'pieces of Party Wings', note: 'from $6.99' },
      { qty: n, label: 'sides to share', note: 'corn, potatoes, hush puppies' },
    ];

    list.innerHTML = rows.map((r) =>
      `<li><b>${r.qty}</b><span>${r.label}</span><i>${r.note}</i></li>`).join('');

    if (n > 16) {
      total.innerHTML = `<b>Call us.</b> Past sixteen people it is worth talking it through — ` +
        `<a href="tel:+16012686437" style="border-bottom:1px solid currentColor">(601) 268-6437</a>.`;
    } else {
      total.innerHTML = `Platters alone come to <b>$${(platters * PLATTER).toFixed(2)}</b>. ` +
        `Wings and sides on top of that.`;
    }
  }

  function setPeople(n) {
    n = Math.min(20, Math.max(2, n));
    range.value = n;
    out.textContent = n;
    suggest(n);
  }
  range.addEventListener('input', () => setPeople(Number(range.value)));
  $('#minus').addEventListener('click', () => setPeople(Number(range.value) - 1));
  $('#plus').addEventListener('click', () => setPeople(Number(range.value) + 1));
  setPeople(6);

  /* ---------------- masthead ---------------- */
  const mast = $('#mast');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      mast.classList.toggle('tight', scrollY > 90);
      ticking = false;
    });
  }, { passive: true });

  /* ---------------- which section you are in ---------------- */
  const links = $$('.mast-nav a');
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const a = byId.get(e.target.id);
      if (a && e.isIntersecting) {
        links.forEach((l) => l.classList.remove('here'));
        a.classList.add('here');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ---------------- arrivals ----------------
     One move, one observer. Blocks lift a few pixels once and stay put. */
  $$('.front-grid > *, .front-shot, .slab, .board-note, .cat, .board-foot, .season, ' +
     '.calc, .wall .plate, .say, .ways, .visit-grid > *').forEach((el) => el.classList.add('up'));

  if (reduced) {
    $$('.up').forEach((el) => el.classList.add('in'));
    $('#seasonBlock').classList.add('in');
  } else {
    const arrive = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.style.transitionDelay = Math.min(i * 45, 180) + 'ms';
        el.classList.add('in');
        arrive.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    $$('.up').forEach((el) => arrive.observe(el));

    /* the season bars draw out together once the chart is in view */
    const seasonBlock = $('#seasonBlock');
    const drawBars = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        $$('.season-bar > i', seasonBlock).forEach((bar, i) => {
          bar.style.transitionDelay = (i % 12) * 28 + 'ms';
        });
        seasonBlock.classList.add('in');
        drawBars.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    drawBars.observe(seasonBlock);
  }
})();
