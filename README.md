# The Crab House

Website for The Crab House — Cajun seafood & hot wings, 3801 Hardy St,
Hattiesburg, MS. Static site, no build step, deploys to Vercel.

## The idea

**Keep it as simple as the restaurant.** You walk in, you look at the board, you
order at the counter. So the site does five things and stops: says what this is,
shows what's good and what it costs, tells you whether it's open, tells you where
it is, and gets you to the order page.

Warm kraft ground, black ink, one red. One column, big type, a lot of air between
things. Four sections — menu, photos, what folks say, come see us — and a footer.

The one piece of working software is the **live open/closed line** under the
headline: it reads the real opening hours in Hattiesburg's timezone, so somebody
checking from two states over gets the answer they actually want.

Type: **Anton** (signage) / **Newsreader** (everything you read). No third face.

An earlier version of this build had a seasonality chart, a party-order calculator,
twenty menu lines and twelve photos. It was too much work to read. If you are
tempted to add a section, take one out first.

## Running it

```bash
python3 -m http.server 4319
```

Then open http://localhost:4319.

## Layout

```
index.html      markup, copy, JSON-LD
css/site.css    all styles, tokens at the top
js/site.js      open/closed, season chart, order calculator, arrivals
img/            table, crawfish, counter-shot, story, og
img/plate/      the restaurant's own dish photography
vercel.json     cache headers for /img
```

No frameworks and no CDN scripts — the only network dependency is Google Fonts.

## Hours live in two places

`js/site.js` has an `HOURS` table that drives the live status, and `<head>` has a
`Restaurant` JSON-LD block. **They must agree.** If the hours change, edit both,
plus the visible table in *Find Us* and the footer. Stale structured data is worse
than none, because Google will publish it.

Validate at https://search.google.com/test/rich-results.

There is deliberately no `aggregateRating` in the JSON-LD: self-reported ratings on
a business's own page are exactly what Google discounts.

**The rating shown on the page is 4.0 from 194 reviews**, checked against the Google
Places API in September 2026 (place id `ChIJTw-JcG_fnIgR8RAaor3J9VM`). The site this
replaced claimed 4.8, which was wrong. Re-check it before any campaign that quotes a
number, and never carry a rating over from an old page without looking it up.

**The review text has not been verified.** It came from the previous version of this
site, not from Google — the API key available here does not return review bodies. The
quotes are reproduced word for word from that source, but somebody should confirm they
are real, and attributed correctly, before this goes on the client's own domain.

## Honesty rules that are baked in

- Prices on the board are only the ones actually posted at the counter. Everything
  else is marked **Ask** and links to the phone, rather than carrying an invented
  number.
- The season chart is labelled as *general Gulf seasons*, with a caveat under it
  telling people to call — it is not a claim about what is in the cooler today.
- The three quotes in *What Folks Say* are **verbatim**, with `…` marking anything
  cut. Never smooth a real person's wording — trim whole sentences or leave it alone.

Keep those. They are the difference between a site the owner can stand behind and
one that makes promises the kitchen has to keep.

## The imagery

`img/plate/` is the restaurant's own photography, shot overhead on black. Several
of those files carry a **burned-in red caption in the lower left** — the black
plate frames crop tightly enough that it mostly falls outside, but check any new
one you add.

`table.jpg`, `crawfish.jpg`, `counter-shot.jpg` and `story.jpg` are generated food
imagery standing in for a shoot. They show food and a counter, not the actual
room. **Swap them for real photographs when the client provides them** — nothing
else has to change.

## Deploying

```bash
vercel --prod
```
