/* ============================================================
   THE CRAB HOUSE — scroll, intro and the heat spine
   ============================================================ */
(function () {
  'use strict';

  const { gsap } = window;
  gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;

  /* On mobile the address bar sliding in and out counts as a resize, and a
     ScrollTrigger refresh mid-scroll is exactly the hitch it looks like. */
  ST.config({ ignoreMobileResize: true });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.matchMedia('(min-width: 900px)').matches;
  const weak = (navigator.hardwareConcurrency || 8) <= 4 && (navigator.deviceMemory || 8) <= 4;

  const q = (s, c) => (c || document).querySelector(s);
  const qa = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------------- smooth scroll ----------------
     lerp is the whole feel of the page. At 0.1 the viewport takes about
     twenty frames to catch the wheel, which reads as lag rather than
     smoothing; 0.15 still glides but answers on the same beat. */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.15, wheelMultiplier: 1.05, syncTouch: false });
    lenis.on('scroll', ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const goTo = (el) => {
    if (lenis) lenis.scrollTo(el, { duration: 1.0 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  qa('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = q(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      goTo(target);
    });
  });

  q('#year').textContent = new Date().getFullYear();
  if (desktop && !reduced) document.body.classList.add('grain-on');

  /* ---------------- word masks ----------------
     Each word gets its own overflow box rather than each line, so nothing
     has to be measured and a heading reflows correctly at any width. The
     padding/margin pair gives descenders somewhere to live. */
  const styleTag = document.createElement('style');
  styleTag.textContent =
    '.w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.14em;margin-bottom:-.14em}' +
    '.w>span{display:inline-block;will-change:transform}';
  document.head.appendChild(styleTag);

  function splitWords(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    const words = [];
    texts.forEach((node) => {
      const parts = node.nodeValue.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const mask = document.createElement('span');
        mask.className = 'w';
        const inner = document.createElement('span');
        inner.textContent = part;
        mask.appendChild(inner);
        frag.appendChild(mask);
        words.push(inner);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return words;
  }

  /* ---------------- loader ----------------
     The readout climbs from a cold Gulf 32°F to a rolling boil, which is
     the same spine the rest of the page runs on. */
  const load = q('#load');
  const temp = q('#loadTemp');
  const intro = gsap.timeline();

  if (load) {
    const t = { v: 32 };
    intro
      .to(t, {
        v: 212, duration: 1.0, ease: 'power2.inOut',
        onUpdate: () => { temp.textContent = String(Math.round(t.v)).padStart(3, '0') + '°F'; },
      })
      .to('.load-in', { opacity: 0, y: -18, duration: 0.35, ease: 'power2.in' }, '+=0.12')
      .to(load, {
        clipPath: 'inset(0 0 0 100%)', duration: 0.8, ease: 'power4.inOut',
        onComplete: () => load.remove(),
      }, '-=0.1');
  }

  /* ---------------- hero entrance ---------------- */
  qa('.hero-line').forEach((line) => {
    const inner = document.createElement('span');
    inner.style.display = 'block';
    while (line.firstChild) inner.appendChild(line.firstChild);
    line.appendChild(inner);
  });

  intro
    .from('.hero-shot img', { scale: 1.22, duration: 2.4, ease: 'power2.out' }, '-=0.85')
    .from('.hero-line > span', { yPercent: 112, stagger: 0.11, duration: 1.15, ease: 'power4.out' }, '<+=0.12')
    .from('.hero-eyebrow', { opacity: 0, y: 14, duration: 0.7, ease: 'power2.out' }, '-=0.85')
    .from('.hero-lede', { opacity: 0, y: 18, duration: 0.7, ease: 'power2.out' }, '-=0.55')
    .from('.hero-ctas .btn', { opacity: 0, y: 16, stagger: 0.09, duration: 0.6, ease: 'power2.out', clearProps: 'all' }, '-=0.45')
    .from('.hero-meta span', { opacity: 0, y: 10, stagger: 0.07, duration: 0.5, ease: 'power2.out', clearProps: 'all' }, '-=0.4')
    .to('#steam', { opacity: 1, duration: 1.6, ease: 'power1.out' }, '-=0.6');

  /* Opened in a background tab, requestAnimationFrame never fires, so the
     intro does not advance a frame — and the inline failsafe in <head> would
     then strip the loader and leave the hero sitting mid-animation, which is
     to say invisible. setTimeout does still fire there, so this lands the
     timeline on its finished state just ahead of that failsafe. */
  setTimeout(() => { if (intro.progress() < 1) intro.progress(1); }, 5200);

  if (!reduced) {
    gsap.to('.hero-in', {
      yPercent: -14, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero-shot img', {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  /* ---------------- steam ----------------
     Desktop and capable devices only: the hero photograph already carries a
     real steam column, so on a phone this canvas is fill-rate spent on an
     overlay nobody would miss. */
  if (desktop && !reduced && !weak && typeof window.initSteam === 'function') {
    const steam = window.initSteam(q('#steam'));
    if (steam) {
      steam.resume();
      ST.create({
        trigger: '.hero', start: 'top bottom', end: 'bottom top',
        onLeave: () => steam.pause(),
        onEnterBack: () => steam.resume(),
      });
      document.addEventListener('visibilitychange', () => {
        document.hidden ? steam.pause() : steam.resume();
      });
    }
  }

  /* ---------------- nav ---------------- */
  const nav = q('#nav');
  ST.create({ start: 100, onUpdate: (self) => nav.classList.toggle('stuck', self.scroll() > 100) });

  const burger = q('#burger');
  const mmenu = q('#mmenu');
  function closeMenu() {
    mmenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    mmenu.setAttribute('aria-hidden', 'true');
  }
  burger.addEventListener('click', () => {
    const open = mmenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    mmenu.setAttribute('aria-hidden', String(!open));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------------- ticker ---------------- */
  if (!reduced) {
    gsap.to('#ticker', {
      xPercent: -22, ease: 'none',
      scrollTrigger: { trigger: '.ticker', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  }

  /* ---------------- the wash ----------------
     A fixed, empty layer of its own: re-tinting between zones is a flat
     fill rather than a repaint of everything currently scrolling. */
  const wash = q('.wash');
  const washTo = (c) => gsap.to(wash, { backgroundColor: c, duration: 0.8, ease: 'power2.out', overwrite: true });

  [['#house', '#0A0E0D'], ['#board', '#000000'], ['.band', '#000000'],
   ['#story', '#0A0E0D'], ['#word', '#0A0E0D'], ['#visit', '#0A0E0D']].forEach(([sel, c]) => {
    ST.create({
      trigger: sel, start: 'top 55%', end: 'bottom 55%',
      onEnter: () => washTo(c), onEnterBack: () => washTo(c),
    });
  });

  /* The boil is the one section that does not sit at a single colour: the
     wash warms across it, cold Gulf through butter to cayenne. Its range
     closes before the board's zone opens, so the two never fight. */
  if (!reduced) {
    gsap.fromTo(wash,
      { backgroundColor: '#08110F' },
      {
        backgroundColor: '#150907', ease: 'none', overwrite: 'auto',
        scrollTrigger: { trigger: '#boil', start: 'top 60%', end: 'bottom 88%', scrub: 0.8 },
      });
  }

  /* ---------------- thermometer ---------------- */
  const fill = q('#thermFill');
  const now = q('#thermNow');
  if (fill && !reduced) {
    ST.create({
      trigger: '.steps', start: 'top 78%', end: 'bottom 62%', scrub: 0.6,
      onUpdate: (self) => {
        gsap.set(fill, { scaleY: self.progress });
        now.innerHTML = Math.round(32 + self.progress * 180) + '<sup>°F</sup>';
      },
    });
  }

  /* ---------------- reveals ----------------
     Splitting needs real font metrics, so this waits on the webfonts — but
     it must not wait forever. A stalled font file would otherwise mean no
     reveals exist at all, and a visitor scrolling into that gap finds
     finished copy sitting there. Fall through after a beat. */
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 1500)),
  ]);

  fontsReady.then(() => {
    if (reduced) { ST.refresh(); return; }

    qa('.split').forEach((el) => {
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 112, duration: 1.0, stagger: 0.04, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      });
    });

    const reveal = (sel, vars) => qa(sel).forEach((el) => {
      gsap.from(el, Object.assign({
        opacity: 0, y: 26, duration: 0.9, ease: 'power3.out', clearProps: 'opacity,transform',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }, vars || {}));
    });

    reveal('.label');
    reveal('.lede-body');
    reveal('.boil-sub');
    reveal('.band-in p');
    reveal('.board-note');
    reveal('.visit-block', { y: 32 });
    reveal('.visit-ctas');
    reveal('.story-ctas');

    qa('.stats').forEach((row) => {
      gsap.from(row.querySelectorAll('.stat'), {
        opacity: 0, y: 30, duration: 0.8, stagger: 0.09, ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 86%', once: true },
      });
    });

    qa('.steps').forEach((list) => {
      gsap.from(list.querySelectorAll('.step'), {
        opacity: 0, x: -22, duration: 0.75, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: list, start: 'top 82%', once: true },
      });
    });

    qa('.facts').forEach((list) => {
      gsap.from(list.querySelectorAll('li'), {
        opacity: 0, y: 16, duration: 0.6, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: list, start: 'top 88%', once: true },
      });
    });

    qa('.quote').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0, y: 28, duration: 0.85, delay: (i % 3) * 0.07, ease: 'power3.out',
        clearProps: 'opacity,transform',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    /* plates and frames: wipe up from nothing, then drift inside the crop */
    qa('.dish-shot, .dish-type, .strip-item, .story-frame').forEach((frame) => {
      gsap.from(frame, {
        clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power4.inOut',
        scrollTrigger: { trigger: frame, start: 'top 88%', once: true },
      });
    });

    qa('.dish-row').forEach((row) => {
      gsap.from(row, {
        opacity: 0, y: 14, duration: 0.7, ease: 'power3.out', clearProps: 'opacity,transform',
        scrollTrigger: { trigger: row, start: 'top 92%', once: true },
      });
    });
    qa('.dish p').forEach((p) => {
      gsap.from(p, {
        opacity: 0, duration: 0.8, ease: 'power2.out', clearProps: 'opacity',
        scrollTrigger: { trigger: p, start: 'top 94%', once: true },
      });
    });

    [['.story-frame img', 9], ['.visit-shot img', 8], ['.band-shot img', 9]].forEach(([sel, amt]) => {
      qa(sel).forEach((img) => {
        gsap.fromTo(img, { yPercent: -amt }, {
          yPercent: 0, ease: 'none',
          scrollTrigger: { trigger: img.closest('section') || img, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    });

    ST.refresh();
  });

  /* ---------------- counters ---------------- */
  qa('.count').forEach((el) => {
    const target = Number(el.dataset.count);
    const dec = Number(el.dataset.dec || 0);
    const show = (v) => { el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US'); };
    if (reduced) { show(target); return; }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.7, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => show(obj.v),
    });
  });

  ST.sort();
  ST.refresh();
})();
