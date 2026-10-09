# Phase 2 of 19: UI kit and site chrome

This is phase 2 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Build the reusable UI kit and the fixed site chrome with shadcn/ui as the base and `motion` for animation, following `DESIGN.md`.

COMPONENTS:
1. `Button` (shadcn, with `pill`, `pill-light`, `orange` variants): radius 999px, 1px border at 20% foreground, inset 1px top highlight, mono label, arrow icon in a small square chip that nudges 2px on hover.
2. `Tag` (shadcn Badge variant): radius 4px, 10% tint, mono 8 to 9px uppercase.
3. `SplitReveal`: per-character spans (`aria-label` on the wrapper, `aria-hidden` on spans), stagger 12 to 20ms, each character fades up 0.4em with the shared easing. Drivers: `whileInView` (once), or a `progress` MotionValue with `[in, out]` ranges so a beat can reveal and then hide again as scroll moves in either direction. Reduced motion: plain fade.
4. `HoverRoll`: characters roll vertically on hover.
5. `Hairlines`: fixed overlay using the grid tokens, with four-point registration marks at intersections and tick marks on the left edge. `pointer-events: none`, `aria-hidden`. Lines can fade out per scene via a `visible` MotionValue.
6. `GrainOverlay`: static grain at 3 to 5% opacity.
7. `Chrome`: fixed mark top-left, grid/menu icon below it, a **chapter rail** along the left hairline showing the active chapter label with a short leading rule and tick marks, and a pill "Say hello" top-right. On mobile the rail collapses into a shadcn Sheet.

CHAPTERS (mono `label` style):
- Ch. 1 The Seed
- Ch. 2 The Growth
- Ch. 3 The Harvest
- Ch. 4 The Inside
The active chapter comes from the scroll `progress` MotionValue (create a placeholder in the shared timeline module if phase 3 has not run yet).

Add every component to `/design`. Visible focus rings, correct roles, keyboard support.

