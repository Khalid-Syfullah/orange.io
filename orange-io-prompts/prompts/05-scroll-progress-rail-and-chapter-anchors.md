# Phase 5 of 19: scroll progress rail and chapter anchors

This is phase 5 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Build the scroll progress indicator that lives in the side rail, drawn from the script.

1. **Segmented progress line.** An SVG line in the rail, split into segments whose lengths are proportional to the scroll spans between boundaries (scene starts, beat boundaries, chapter anchors); give each path `data-a` and `data-b` (the progress range it represents). Each segment fills with `stroke-dashoffset` as `progress` crosses its range (driven by the shared MotionValue, no React state), so the line is a map of the story: long segments for long travel, short ticks at beat changes. Gaps between segments mark boundaries.
2. **Chapter anchors.** Each chapter entry has `data-at` (its progress fraction). The active chapter is derived from `progress` and `CHAPTERS`. Show "Ch. N" plus the title in mono; the active entry has a short leading rule, others show only tick marks.
3. **Label swap.** When the chapter changes, the label animates out and in using `SplitReveal` (character roll), in both scroll directions.
4. **Click and keyboard.** Clicking an entry scrolls there with `lenis.scrollTo` (duration scaled by distance, shared easing); entries are real links/buttons with focus rings and `aria-current` on the active one.
5. **Mobile.** On small screens the rail becomes a compact top indicator with the same segmented line, plus a Sheet with the chapter list.
6. Add the rail to the `/design` page with a draggable fake progress slider for review.

