# Product

> Inferred from the repo (README, data/*.json, css/tokens.css) rather than a live
> interview. Correct anything that's off; every impeccable command reads this file.

## Register

brand

## Users

Commercial and industrial laundry buyers across North America (US, Canada, Mexico):
laundromat owners and operators, on-premise laundry managers (hotels, hospitals,
correctional facilities, fitness, healthcare), and the distributors who sell and
service the equipment. They arrive to evaluate heavy-duty washer-extractors, compare
hard specs, and then request a quote or find a local distributor. Context: researching
high-cost capital equipment, usually at work on desktop; the buying decision is driven
by reliability, throughput, and total cost of ownership, not impulse.

## Product Purpose

Market Yamamoto North America's Japanese-engineered commercial and industrial
washer-extractors and generate qualified leads. Success looks like a visitor grasping
the machines' durability and efficiency edge, then requesting a quote, placing an order,
or locating a distributor. The site is static and data-driven: all repeating content
lives in `/data/*.json`, so the design must hold at any content length.

## Brand Personality

Industrial, heavy-duty, precise. Voice is confident and plain-spoken ("Built to run
hard"), with Japanese manufacturing precision expressed as restraint rather than
ornament. The feeling to evoke is trust in reliability and the lowest cost of ownership.
Three words: rugged, precise, dependable.

## Anti-references

- Generic SaaS / startup look (rounded corners, pastel gradients, friendly blobs).
- Cluttered big-box appliance retailer (spec soup, sale badges, stock clutter).
- Bland corporate stock-photo brochureware.
- Cute or consumer-friendly softness.

## Design Principles

- **Dark canvas, single red spark.** One accent (#E2231A) earns attention; everything
  else is ink, fog, and paper. The red is never decorative.
- **Show the machine.** Real cutout photography and hard specs do the persuading, not
  adjectives.
- **Industrial precision in the details.** Hairlines, scroll-drawn technical frames,
  mono labels, tight condensed display type. The craft is in the millimeters.
- **Data-driven truth.** Every repeating element renders from `/data`; the layout must
  survive long names, missing fields, and any item count.
- **Motion with restraint.** Hover-only icon traces, scroll-drawn frames, stat count-ups;
  always `prefers-reduced-motion` safe. Motion confirms, it never decorates.

## Accessibility & Inclusion

Target WCAG 2.1 AA. There is a dedicated accessibility page, `prefers-reduced-motion` is
respected throughout, and keyboard navigation with visible focus states is expected.
Contrast on the dark canvas (muted "fog" text and red-on-dark) should be verified against
AA.
