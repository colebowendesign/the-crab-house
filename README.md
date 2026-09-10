# The Crab House

Website for The Crab House — Cajun seafood & hot wings, 3801 Hardy St,
Hattiesburg, MS. Static site, no build step, deploys to Vercel.

## The idea

**"Price Board."** This is a counter-service seafood joint on Hardy Street, not a
cinema — so the site is built like the board over the counter and the paper they
dump the boil on. Warm kraft ground, black ink, boil red, real rules and real
boxes. Information first: the menu, the season, the hours, set big enough to read
across a room.

The page does not open with a photograph you scroll past. It opens like a front
page — headline block on the left, the day's facts boxed on the right, the picture
underneath. Every photograph on the site is set into a solid black plate, because
the restaurant's own dish photography is shot on black and a printed page carries
its pictures that way.

Two things here are working software rather than decoration:

- **The open/closed status** in the masthead and the Today box is computed live
  from the real opening hours, in Hattiesburg's timezone, so a visitor two states
  over gets the answer they actually want.
- **How Much To Order** works out a party order from the two things the restaurant
  actually states — a platter that feeds a table, and wings sold in fixed counts —
  and hands anything over sixteen people to the phone.

Type: **Anton** (signage) / **Newsreader** (everything you actually read). No third
face, no mono.

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

The visible 4.8★ figure is deliberately not in the JSON-LD: self-reported
`aggregateRating` on a business's own page is exactly what Google discounts.

## Honesty rules that are baked in

- Prices on the board are only the ones actually posted at the counter. Everything
  else is marked **Ask** and links to the phone, rather than carrying an invented
  number.
- The season chart is labelled as *general Gulf seasons*, with a caveat under it
  telling people to call — it is not a claim about what is in the cooler today.
- The order calculator says out loud that it is a starting point, not a rule.

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
