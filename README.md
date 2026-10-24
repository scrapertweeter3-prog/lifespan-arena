# Lifespan Arena

A small browser game about the only question that matters in gear forums:
does the cheap one actually cost less?

Two products enter the arena: a budget pick and a buy-it-for-life pick in
the same job. You draft both, then roll forward one year at a time. The
budget unit can fail in two ways: it reaches its rated life, or it loses an
annual random-failure roll. Replacement units take the same slot, up to a
budget of four. The BIFL unit is overbuilt against exactly that random
failure mode, so it only has to outlast its rated life. When one side
retires, the scoreboard settles it on cost per served year.

Three duels ship in this build: espresso machine, daily backpack, and cast
iron pan. Each run also draws a hazard dimension (warranty, tech cycle, or
routine care) that shapes when random failures bite. The budget pick wins
plenty of runs, which is the point: the math, not the slogan, decides.

Nothing here is measured from real units. The failure modes are the ones
readers actually report in long-term reviews: pump seals, zippers, warping,
cracked handles. The game is a way to argue about total cost of ownership
without waiting twenty years.

Play it in any browser: open index.html, pick a duel, start rolling.

Method notes, warranty fine-print teardowns, and repairability scoring live
at [durablepicks.com](https://durablepicks.com/). Further reading on the
failure-shape math: the
[bathtub curve](https://en.wikipedia.org/wiki/Bathtub_curve) and
[planned obsolescence](https://en.wikipedia.org/wiki/Planned_obsolescence)
pages on Wikipedia.

## Development

Plain HTML, CSS, and vanilla JavaScript, no dependencies and no build step.
`game.js` keeps the simulation DOM-free above a marked line, so the whole
year loop is testable in node without a browser.

MIT licensed. Built by Poket Dev LLC.
