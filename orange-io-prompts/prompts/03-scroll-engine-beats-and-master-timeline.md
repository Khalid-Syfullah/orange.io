# Phase 3 of 19: scroll engine, beats and master timeline

This is phase 3 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Build the scroll engine. This is the most important phase: it defines how ideas move from one to the next. No scene artwork yet beyond labelled placeholders.

1. **Tall native stage.** One `<section class="stage">` whose height is `STAGE_VH` viewport heights (start with 2400vh; export it and make it easy to tune). Inside, a `position: sticky` (or fixed) full-viewport stack of layers, in this order: WebGL scene canvas, transition canvas, "fly" canvas, hairline layer, DOM text layer. Normal scrolling stays native; do not hijack wheel or touch.
2. **Smooth scroll.** `ScrollProvider` starts Lenis, drives it from the GSAP ticker, syncs ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add`, `lagSmoothing(0)`). One ScrollTrigger over the stage writes normalized 0-1 `progress` into a shared `MotionValue` and also exports scroll velocity as a second MotionValue. No React state per frame.
3. **Timeline config.** Export `SCENES` (ranges below), `CHAPTERS`, `BEATS`, plus helpers `sceneProgress(scene, p)`, `currentScene(p)`, `currentChapter(p)`, `vh(p)` (progress to viewport heights).
   - opening 0.00 to 0.08, watering 0.08 to 0.22, growth 0.22 to 0.42, ripening 0.42 to 0.56, plucking 0.56 to 0.68, floating 0.68 to 0.80, split 0.80 to 0.93, brand 0.93 to 1.00
   - chapters: The Seed 0.00 to 0.22, The Growth 0.22 to 0.56, The Harvest 0.56 to 0.80, The Inside 0.80 to 1.00
4. **Beats.** A `Beat` component takes `{ at, out, side }` (progress range in and out) and shows its children (a headline using `SplitReveal` plus a lead paragraph, or a right-column card: Tag, title, paragraph) only inside that range, with a clean fade-in and fade-out in both scroll directions. Beats occupy the same screen position and replace each other, like the reference. Between beats, leave deliberate **travel** gaps with no text (about 25 to 40% of each scene) where the camera and scene do the talking. Define the beat table in `BEATS` with TODO placeholder copy: hero line, then one-line beats "We plant.", "We tend.", "We wait.", "We grow.", "We pick.", "There is more inside.", each with a lead line.
5. **Dev tools.** A dev-only overlay showing `progress`, vh, current scene, chapter, active beats, plus keyboard shortcuts to jump to scene starts.
6. **Rail and anchors.** The chapter rail from phase 2 reads the progress; clicking a chapter calls `lenis.scrollTo` to its start.
7. **Reduced motion.** Skip the tall stage and render stacked, non-animated chapters with stills (placeholders for now).
8. Verify reverse scrolling, fast scrolling, resize and orientation change.

