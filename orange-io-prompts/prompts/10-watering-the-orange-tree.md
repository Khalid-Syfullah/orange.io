# Phase 10 of 19: watering the orange tree

This is phase 10 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Implement Scene 02.

SCENE TITLE:
"Nurturing Growth"

OBJECTIVE:

Animate a man and woman watering an orange tree
together in a synchronized cinematic sequence.

ANIMATION:

As the user scrolls:

1. The man lifts his watering can.
2. The woman lifts her watering can.
3. Both tilt their watering cans.
4. Water begins flowing from the spouts.
5. Water droplets fall toward the soil.
6. The ground subtly darkens as it absorbs water.
7. The characters gradually lower their watering cans.

CHARACTER ANIMATION:

Use realistic skeletal animation.

Ensure natural arm movement.

Animate:

- Shoulders
- Elbows
- Wrists
- Hands
- Watering cans

Hands must remain properly attached to the watering cans.

Avoid unnatural joint movement.

WATER EFFECTS:

Create realistic flowing water.

Use lightweight particle systems
or optimized transparent geometry.

Water should:

- Emerge from each watering can
- Follow a natural curved trajectory
- Break into small droplets
- Fall toward the soil
- Disappear naturally on contact

The water effect must be deterministic
and scroll-controlled.

Do not rely on an uncontrolled particle simulation
that becomes inconsistent when scrolling backward.

SCROLL TIMELINE:

Progress 0.08–0.22

0.08:
Characters begin lifting watering cans.

0.12:
Both watering cans tilt.

0.15:
Water begins flowing.

0.17:
Water reaches the ground.

0.20:
Water flow gradually stops.

0.22:
Characters return to a relaxed posture.

CAMERA:

Slowly push toward the orange tree.

Use subtle perspective changes.

Focus attention on the watering action.

TEXT:

Reveal:

"Every idea needs care."

Keep typography minimal.

PERFORMANCE:

Optimize particle count.

Avoid unnecessary physics calculations.

Use interpolation for character animation.

The entire sequence must reverse naturally
when scrolling upward.

HANDOFF TO THE NEXT SCENE:
As watering ends, the camera keeps dollying toward the trunk and the background lightens through a short dither dissolve into the growth view, with the soil darkening carrying over so nothing pops.

ART DIRECTION FOR THIS PHASE:
Follow DESIGN.md. Soft-shaded stylized 3D with a warm apricot-to-cream sky, film grain and halftone accents. DOM layers (hairlines, rail, beats) sit above the canvas. Headlines use Newsreader via `SplitReveal`; labels use Geist Mono. Show scene text only through the `Beat` system and `BEATS` config (no loose text). Add no new fonts, colors or easing curves.

