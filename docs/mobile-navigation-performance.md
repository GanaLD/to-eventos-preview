# Mobile navigation and loading — 2026-11-02

The section dots previously refreshed ScrollTrigger during every click. On Chrome
mobile this cancelled smooth scrolling: the URL changed, but the viewport stayed
in the previous section. Navigation now uses the existing pin's start position
without refreshing the page geometry. Touch no longer reveals overlapping desktop
labels. Footer anchors follow the same navigation handler.
If fonts or pins finish loading during a jump, the destination is recalculated.
A wheel, touch-move, pointer or keyboard gesture cancels that adjustment so the
visitor retains control. A regression test delays font stylesheets by 1.8 seconds
and verifies both the anchor destination and subsequent manual scrolling.

Performance changes preserve the original assets, animation timelines and CSS
cascade. Seventeen local stylesheets are delivered in one gzip-friendly bundle;
their original links remain as a load-error fallback. Mobile font stylesheets load
without blocking the first paint, with original fonts and a no-JavaScript fallback.
The first original hero frame supplies its poster. The Connect poster is loaded
near its section on mobile; desktop still loads it during initialization. Mobile
editorial font callbacks use ScrollTrigger's safe refresh to combine repeated
layout work. The hero animation controller is unchanged.

## Measurements

Lighthouse 13.6.0, default mobile simulation, Chrome headless, performance category.
Do not run other automated browser checks while measuring. Reports are retained
locally under `qa-artifacts/`.

| Comparison | Performance | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Published site before this change | 80 | 2.5 s | 4.1 s | 190 ms | 0 |
| Original code on comparison server, gzip | 78 | 2.2 s | 4.6 s | 150 ms | 0 |
| Candidate with safe mobile refresh | 90 | 0.9 s | 3.6 s | 30 ms | 0.018 |
| Candidate repeat | 88 | 0.9 s | 3.8 s | 70 ms | 0 |

Local candidate results varied. The completed publication was measured separately:

| Published domain, same Lighthouse command | Performance | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Before upload, 2026-11-02 | 75 | 2.4 s | 4.0 s | 340 ms | 0 |
| After upload | 91 | 1.2 s | 3.2 s | 140 ms | 0.002 |
| After upload, repeat | 90 | 1.1 s | 3.0 s | 210 ms | 0 |

The separate mobile report displayed in hPanel showed 89, FCP 1.2 s, LCP 3.7 s,
TBT 0 ms and CLS 0.025. Do not describe the Lighthouse 90–91 results as a 90–91
score in the Hostinger panel; they are different measurement runs.

## Production verification

- Code source: `a0186071109078e7670012c10c432ca79868051d`.
- Production branch: `87f6b435a2fbbd73fc26b17b049d00a62b1c9a25`.
- Pages, production promotion and GitHub visual QA completed successfully.
- Nine changed files uploaded into `public_html` for account `u365415297`.
- Each published file was downloaded through `toeventos.com` and matched the
  production branch byte for byte using SHA-256. The unqualified home URL also
  matched, without a cache-busting query.
- Touch navigation passed again on the published domain at 360/390 pixels,
  including slow fonts, footer return and subsequent manual scrolling.
- Published hero forward/reverse, deferred media, Connect autoplay and PDF
  availability passed. Home and `/sobre/` return 200 with `index,follow`.
- The temporary upload archive was moved to the Hostinger trash and its public
  URL returns 404.
- Both final Lighthouse JSON and standalone HTML reports, the upload manifest
  and SHA-256 readback are retained under local `qa-artifacts/`.

## Experiment ledger

- Single CSS bundle plus original-frame poster: 78 → 82 on identical gzip server.
- Nonblocking mobile fonts: 82 → 88; retained.
- Same GSAP version served locally: 88 → 82; reverted.
- Mobile Connect poster deferred: removes 89 KB from initial requests, LCP 3.9 →
  3.8 seconds; retained. Video and fullscreen remain available.
- Editorial initialization yielded past a frame: no measured gain; reverted.
- Safe refresh for mobile editorial font callbacks: TBT 130 → 30 ms in the first
  comparison, 70 ms on repeat; retained.
- Avoid initial mobile source reselection: no measured gain; reverted.

## Validation

- Repeated touch navigation through all five sections and footer return at 360
  and 390 pixels; no overlapping labels.
- Deferred media loading, original papoula video, responsive images, Connect
  autoplay and PDF rendering.
- Reversible hero fade, background and text states on desktop and mobile.
- Native fullscreen and fallback dialogs for Connect/PDF, button/Escape exits,
  PDF page and scroll-position preservation.
- Menus, accordion interaction and direct contact-anchor return to the hero.
- Before/after hero geometry, fonts, colors and opacity match at 1440 and 390
  pixels. Desktop and mobile screenshots were inspected.
- Structural and syntax checks in the Pages workflow.
