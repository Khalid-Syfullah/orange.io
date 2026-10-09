# Phase 2 of 6: Smooth scrolling with Lenis, synced to GSAP ScrollTrigger

This is phase 2 of 6 in building the scroll-driven hero sequence for the orange.io landing page. Phase 1 installed `gsap` and `lenis` and created the hero config module. Check the repo for what exists before you start. If something from phase 1 is missing, create it.

## What to do

1. Create a small `smooth-scroll` module in the hero module folder that exports `initSmoothScroll()` and `destroySmoothScroll()` and returns or exposes the Lenis instance.
2. Wire Lenis to ScrollTrigger exactly like this, so both libraries share one clock:
   - Register `ScrollTrigger` with GSAP.
   - `lenis.on("scroll", ScrollTrigger.update)`
   - Drive Lenis from GSAP's ticker: `gsap.ticker.add((time) => lenis.raf(time * 1000))`
   - `gsap.ticker.lagSmoothing(0)`
3. The module must be safe for the repo's rendering model: no access to `window` or `document` at import time (guard for SSR/SSG if the framework does server rendering), and `destroySmoothScroll()` must fully clean up (remove the ticker callback, destroy Lenis, kill nothing else).
4. If the user prefers reduced motion (`prefers-reduced-motion: reduce`), `initSmoothScroll()` must do nothing and leave native scrolling alone. Also react if that preference changes while the page is open.
5. Route in-page anchor links (`href="#..."`) through `lenis.scrollTo` so they glide, and keep the URL hash updated. Keep keyboard scrolling and focus behavior working.
6. Call `initSmoothScroll()` once, at the right place for this repo's architecture (app entry, root layout, or equivalent), and destroy it on teardown if the framework has lifecycles.
7. Verify: the project builds, there are no console errors, and the page scrolls smoothly in the dev server.

## Rules

- Do not run git commit. The runner commits after each phase.
- Do not build the hero, the canvas, or any animation yet.
- End with a short summary of the files you created or changed.
