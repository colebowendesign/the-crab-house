/* ============================================================
   THE CRAB HOUSE
   Two jobs: say whether the kitchen is open, and lift blocks in
   as they arrive. No libraries.
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  $('#year').textContent = new Date().getFullYear();

  /* ---------------- open or shut ----------------
     The same hours as the JSON-LD in <head>. If they change, they
     have to change in both places — plus the visible table — or
     Google publishes the stale one. */
  const HOURS = {
    0: [11 * 60, 21 * 60],          // Sunday
    1: [10 * 60, 21 * 60],
    2: [10 * 60, 21 * 60],
    3: [10 * 60, 21 * 60],
    4: [10 * 60, 21 * 60],
    5: [10 * 60, 21 * 60 + 45],     // Friday
    6: [10 * 60, 21 * 60 + 45],     // Saturday
  };

  const clock = (mins) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m ? `${h12}:${String(m).padStart(2, '0')} ${ampm}` : `${h12} ${ampm}`;
  };

  /* Read the wall clock in Hattiesburg rather than the visitor's, so
     somebody checking from another state gets the answer they want:
     is it open there, now. */
  function nowLocal() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago', weekday: 'short',
        hour: 'numeric', minute: 'numeric', hour12: false,
      }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t).value;
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      return { day, mins: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
    } catch (e) {
      const d = new Date();
      return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function paint() {
    const { day, mins } = nowLocal();
    const [open, close] = HOURS[day];
    const isOpen = mins >= open && mins < close;

    const word = $('#statusNow');
    word.textContent = isOpen ? 'Open now' : 'Closed';
    word.classList.toggle('is-open', isOpen);
    word.classList.toggle('is-shut', !isOpen);

    $('#statusHours').textContent = isOpen
      ? `until ${clock(close)} today`
      : (mins < open
          ? `opens ${clock(open)} today`
          : `opens ${clock(HOURS[(day + 1) % 7][0])} tomorrow`);

    $$('.hours tr').forEach((tr) => tr.classList.toggle('now', Number(tr.dataset.day) === day));
  }
  paint();
  setInterval(paint, 60000);

  /* ---------------- arrivals ----------------
     Four different moves rather than one, so the page has some rhythm
     to it. The lift starts blocks at opacity 0, so nothing here may be
     allowed to fail quietly — a browser without IntersectionObserver,
     or one that never fires it, would leave the page invisible. Hence
     the feature check and the backstop timer at the end. */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    document.body.classList.add('ready');
    $$('.head, .group, .shots figure').forEach((el) => el.classList.add('in'));
    return;
  }

  /* the hero plays on load rather than on scroll — it is already in view */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ready')));

  const lifted = $$('.front-sub, .front-btns, .facts, .front-shot, .menu-more, ' +
                    '.say, .visit > div, .head p');
  lifted.forEach((el) => el.classList.add('up'));

  /* the hero's own copy shouldn't wait to be scrolled to */
  $$('.front-sub, .front-btns').forEach((el, i) => {
    el.style.transitionDelay = (0.35 + i * 0.1) + 's';
    setTimeout(() => el.classList.add('in'), 60);
  });

  const watched = lifted.concat($$('.head, .group, .shots figure'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  watched.forEach((el) => io.observe(el));

  /* rAF never fires in a background tab, so .ready — which un-masks the
     headline — would never land there. The timer covers both. */
  setTimeout(() => {
    document.body.classList.add('ready');
    watched.forEach((el) => el.classList.add('in'));
  }, 3500);

  /* ---------------- drift ----------------
     Photographs are cropped taller than their frames, so they can move
     inside them as the page scrolls. Transform only, read once per
     frame, and only while the picture is anywhere near the viewport. */
  const layers = $$('.front-shot img, .shots img').map((img) => ({
    img,
    frame: img.parentElement,
    range: img.parentElement.classList.contains('front-shot') ? 34 : 22,
  }));

  let pending = false;
  function drift() {
    pending = false;
    const vh = innerHeight;
    for (const l of layers) {
      const r = l.frame.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      /* -1 when the frame is entering at the bottom, 1 when it leaves the top */
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      l.img.style.transform = 'translate3d(0,' + (p * l.range).toFixed(2) + 'px,0)';
    }
  }
  addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(drift);
  }, { passive: true });
  addEventListener('resize', drift, { passive: true });
  drift();
})();
