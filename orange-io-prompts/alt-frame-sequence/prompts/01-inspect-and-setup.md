# Phase 1 of 6: Inspect the repo and set up the hero foundation

You are working in my orange.io repository. This is phase 1 of 6 in building a scroll-driven hero sequence for the landing page. Later phases will add smooth scrolling, a canvas frame player, a pinned scroll timeline, accessibility, and QA. Do not build those yet.

## The finished feature (for context only)

As the visitor scrolls, a man and a woman water an orange tree in a golden-hour orchard. The camera pushes in, the woman plucks a ripe orange and holds it to the camera. The orange is sliced and splits into two halves that drift apart, revealing the headline and call to action between them.

## What to do now

1. Inspect the repo and report briefly what you find: framework, language (JS or TS), package manager, build tool, styling approach (CSS modules, Tailwind, plain CSS, etc.), where pages and components live, and any existing brand colors, fonts, or design tokens. Integrate with what exists. Do not introduce a new framework or styling system.
2. Install the dependencies with the repo's package manager: `gsap` (the npm package includes ScrollTrigger and SplitText, and all plugins are free to use) and `lenis`.
3. Create a `hero` module folder following the repo's conventions (for example `src/hero/`) containing a single config file. Export one typed config object that every later phase reads from. It must contain, with sensible defaults and a short comment on each field:
   - `frames`: `{ desktopPath, mobilePath, count, padLength, extension, fps }` with paths like `/frames/desktop/` and `/frames/mobile/`, `padLength: 4`, `extension: "webp"`, and `count: 160` as a placeholder
   - `useGeneratedPlaceholders: true`: while true, later phases draw generated placeholder frames and placeholder orange shapes instead of loading files, so the sequence can be tested before the real video frames and cutouts exist
   - `images`: `{ whole, halfLeft, halfRight }` pointing at `/img/orange-whole.png`, `/img/orange-half-left.png`, `/img/orange-half-right.png`
   - `orangePosition`: `{ xPercent: 50, yPercent: 50, widthPercent: 28 }`, the whole-orange cutout's center and width as a percentage of the viewport, to be tuned later to line up with the last video frame
   - `timeline`: `{ pinLengthVh: 400, scrub: 0.5, framesEnd: 0.70, crossfadeEnd: 0.75, sliceEnd: 0.85, splitEnd: 1.0, halvesTravelVw: 25, halvesRotateDeg: 6 }`
   - `copy`: placeholder strings for two captions, the headline, a subline, and the CTA label, each marked with a `TODO: replace copy` comment
4. Create empty asset folders `public/frames/desktop`, `public/frames/mobile`, and `public/img` (or the repo's equivalent static folder) with a `.gitkeep` in each.
5. Make sure the project still builds and lints cleanly.

## Rules

- Do not run git commit. The runner commits after each phase.
- Do not create the hero component, the scroll code, or any animation yet.
- End with a short summary: what you found in the repo, what you installed, what files you created.
