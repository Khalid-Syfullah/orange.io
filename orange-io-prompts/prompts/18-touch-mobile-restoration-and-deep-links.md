# Phase 18 of 19: touch, mobile, restoration and deep links

This is phase 18 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Make the scroll choreography robust on touch devices and in real browsing.

1. **Mobile pacing.** On small screens use a shorter stage (about 70% of desktop `STAGE_VH`), the same script with a `mobile` multiplier per scene, larger type from the `DESIGN.md` scale, a single column for cards (below the subject), and lower DPR and particle counts.
2. **Touch.** Lenis `syncTouch` off by default (native momentum), smooth only on wheel. No scroll hijacking, no `touch-action` locks except inside the subject if drag interactions are added.
3. **Scroll restoration.** On reload the page returns to the same scroll position and the stage state matches (no flash of the hero first). Set `history.scrollRestoration = 'manual'` and restore through Lenis after layout.
4. **Deep links.** `/#harvest` and similar hashes scroll to chapter anchors after layout and update the hash as the active chapter changes (with `replaceState`, not history spam).
5. **Resize and orientation.** Recompute the stage height and ScrollTrigger on resize/orientation change while keeping the same *progress* (not the same pixel offset).
6. **Visibility.** Pause WebGL and videos when the tab is hidden or the stage is offscreen; resume cleanly.
7. **Keyboard.** Space, PageDown/PageUp, Home, End, and arrow keys scroll normally; add "next beat / previous beat" shortcuts (J and K) that scroll to the adjacent beat start.

