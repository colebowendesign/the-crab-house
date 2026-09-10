# The Crab House

Website for The Crab House — Cajun seafood & hot wings, 3801 Hardy St,
Hattiesburg, MS. Static site, deploys to Vercel.

## The idea

**"Everything comes out of one pot."** The page is built on a heat spine that
runs top to bottom: it opens cold and near-black at the Gulf end, warms through
garlic butter across the boil, peaks at cayenne, then drops to **true black**
where the plates live so the food has nothing to sit against. Section accents
(`--accent`) follow that same scale rather than being picked per section — sea
glass in *The House*, butter in *The Boil*, cayenne on *The Board*.

Motion is scroll-driven and restrained: masked word reveals, clip wipes on the
photography, gentle parallax inside crops, a scrubbed thermometer, and one
WebGL steam layer over the hero. Nothing pins, nothing hijacks the scroll.

Type: **Fraunces** (display) / **Inter Tight** (text) / **DM Mono** (labels).

## Running it

No build step — it is a static site. Any local server works:

```bash
python3 -m http.server 4319
```

Then open http://localhost:4319.

## Layout

```
index.html        markup, copy, JSON-LD
css/style.css     all styles, tokens at the top
js/main.js        intro, scroll reveals, heat spine, thermometer
js/steam.js       raw-WebGL steam over the hero
img/              hero, story, visit, spice, og
img/plate/        the restaurant's own dish photography
vercel.json       cache headers for /img
```

GSAP, ScrollTrigger and Lenis load from cdnjs; everything else is local.

## The imagery

`img/plate/` is the restaurant's own photography — overhead plates shot on
black. That is why the menu section drops to pure black: the plates float with
no frame at all. Several of those files carry a **burned-in red caption in the
lower left**; `.dish-shot::after` lays a pure-black scrim over the bottom of
each tile, which removes it invisibly on a black-background photograph. If the
client supplies clean files, the scrim can be lightened.

`hero.jpg`, `story.jpg`, `visit.jpg` and `spice.jpg` are generated food and
kitchen imagery standing in for a shoot — they show food, steam and a pot, not
the actual room. **Swap them for real photographs of the restaurant when they
are available**; nothing else has to change.

Two board entries (Party Wings) have no photograph of their own and are set as
type instead. That is deliberate, not a gap — but if a wings photo arrives, the
tile takes an `img` like the others.

## Local SEO

`index.html` carries a `Restaurant` JSON-LD block with the address, phone and
opening hours. **If the hours or address change, edit them in three places** —
the visible table in Visit, the footer, and the JSON-LD in `<head>`. Stale
structured data is worse than none, because Google will publish it.

Validate at https://search.google.com/test/rich-results.

The visible 4.8★ figure is not in the JSON-LD on purpose: self-reported
`aggregateRating` on a business's own page is exactly what Google discounts.

## Failure behaviour

The loader is a full-screen opaque overlay, so anything that stops the scripts
would otherwise leave a visitor on a black page. Three backstops:

- a `noscript` rule that hides it outright;
- an inline timeout in `<head>` that removes it after 6s regardless;
- a `setTimeout` in `main.js` at 5.2s that lands the intro timeline on its
  finished state. That one matters for a page opened in a **background tab**,
  where `requestAnimationFrame` never fires: without it the loader would be
  stripped by the inline timeout while the hero was still mid-animation, which
  is to say invisible.

If you retime the intro, keep both timeouts comfortably longer than it.

## Deploying

```bash
vercel --prod
```
