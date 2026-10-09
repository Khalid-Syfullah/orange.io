# Phase 4 of 19: scroll script: pacing budget and beat table

This is phase 4 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

## Rules for this phase

- **One source of truth for scroll ranges.** Scene ranges come from a single exported timeline config (for example `SCENES = { opening: [0, .08], watering: [.08, .22], ... }`) and helpers like `sceneProgress(scene, p)`. Never hardcode ranges inside scene components.
- **One progress value drives everything.** Lenis plus a single GSAP ScrollTrigger write the normalized 0-1 progress into a shared `MotionValue` (`progress`). DOM and text read it with `useTransform` / `useMotionValueEvent` from `motion/react`; the 3D scene reads it inside `useFrame` or a GSAP-driven ref. No independent time-based animations on scroll-controlled elements, and no React state updates on every scroll frame.
- **Stack roles.** shadcn/ui for interface components (Button, Sheet, NavigationMenu, Tooltip, Badge, Separator), themed with the tokens in `DESIGN.md`. The `motion` package (Framer Motion, import from `motion/react`) for DOM and text animation. React Three Fiber + drei for 3D. GSAP only for the scroll timeline and camera/object tweens.
- **How the reference site scrolls (study this, then build the same kind of system, with original art and copy):** it uses native scrolling on ONE very tall stage (about 53 viewport heights). Inside it, a fixed full-viewport stack of layers stays put: a persistent WebGL canvas, a transition canvas, a "fly" canvas, a hairline canvas, and DOM text. Scroll position becomes a progress value. Text is not placed on the page; it is a set of **beats** that fade in and out at scroll ranges, replaced one after another in the same spot. Long **travel** stretches with no text let the camera or scene change on its own. Chapters (a side rail with an active label) group the beats. Moving from one idea to the next is done by a **dither/pixel dissolve** between full-bleed scenes, a slow camera dolly into the subject, drifting halftone clouds for parallax, and one element that **flies** across the transition so the eye follows it.
- **Follow `DESIGN.md`** (fonts, scale, colors, tokens, motion language) for every piece of UI and text in this phase. Do not introduce other fonts, colors or easing curves. If `DESIGN.md` is missing, create it from the design direction in phase 1 first.
- **No external 3D files exist.** Build the characters, tree, water, hand and fruit procedurally in code (a refined, soft-shaded, stylized look is fine, with film grain and halftone accents from `DESIGN.md`), behind small interfaces and a `models` config entry so real GLB files can replace them later via `useGLTF`. Do not fake photorealism you cannot deliver.
- Keep `npm run build` (and any existing lint or test scripts that CI runs) passing. Fix every error you caused.
- Do not run `git commit`. The runner commits after each phase.
- When done, reply with 3 to 6 lines: what exists now, what is a placeholder, and anything you could not verify.

## The task

Turn the timeline into a written, tunable **scroll script**. This is the choreography document the rest of the build follows. Create `src/scroll/script.ts` (data only) and `SCROLL.md` (the same content in prose), and make every scene, beat and chapter read from the script.

Observed in the reference technique, to copy as a method (not as content):
- The stage is long, and most of it is *travel*, not text. A text beat holds for about 1 to 1.3 screens of scrolling (about 100 to 130vh), then there is a short gap (about 0.3 screen) before the next beat replaces it in the same spot. Only one beat per slot is visible at a time.
- Chapters are anchored at fixed fractions of the whole stage (about 1%, 23%, 40% and 63%), and the rail label switches exactly there.
- The first beat (the hero) leaves quickly, within the first screen of scrolling, so the scene can start moving.

SCRIPT CONTENTS:
1. `STAGE_VH` = 2400 by default (24 screens), exported and easy to change.
2. A **pacing budget** table in vh per scene: opening 190, watering 335, growth 480, ripening 335, plucking 290, floating 290, split 310, brand 170 (these sum to `STAGE_VH` at 2400; recompute them from the `SCENES` fractions, do not hardcode both).
3. A **beat table**: for each beat, `id`, `slot` (hero, left-line, right-card), `at`, `out` (as progress fractions derived from vh offsets inside a scene), the headline text, the lead text, and whether it uses a Tag. Rules: dwell 100 to 130vh, gap 25 to 40vh, hero beat out by 60vh, no overlap inside a slot, and at least one travel stretch of 60vh or more in every scene.
4. A **travel table**: for each travel stretch, what moves (camera dolly, clouds, fruit, transition) so nothing is dead.
5. **Chapter anchors**: `CHAPTERS` with `at` fractions (The Seed 0.012, The Growth 0.22, The Harvest 0.56, The Inside 0.80) used by the rail and by `lenis.scrollTo`.
6. A validation function `validateScript()` that throws in development if beats overlap in a slot, a gap is too short, or ranges do not tile the stage. Run it at startup in dev and in a unit test.
7. A dev panel (extend the phase 3 overlay) that draws the script as a horizontal timeline (scenes, beats, travel, chapter anchors) with a playhead at the current progress, so pacing can be judged visually.
8. Replace any hardcoded numbers from phase 3 with reads from the script.

