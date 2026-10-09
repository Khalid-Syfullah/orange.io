# Phase 15 of 19: orange splitting into two halves

This is phase 15 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Implement Scene 07.

SCENE TITLE:
"Inside Orange"

SCROLL RANGE:
0.80–0.93

OBJECTIVE:

Create an ultra-detailed cinematic animation
of a whole orange smoothly separating into two halves.

INITIAL STATE:

A single whole orange floats in the center.

The orange rotates into a suitable orientation.

ANIMATION:

0.80–0.83:
The orange stops rotating.

0.83–0.85:
A subtle separation line becomes visible.

0.85–0.88:
The orange begins splitting into two halves.

0.88–0.91:
The halves gradually move apart.

0.91–0.93:
The juicy internal cross-sections become fully visible.

CUTTING STYLE:

The orange should appear cleanly divided
into two equal hemispheres.

The cut is horizontal through the fruit's equator.

No knife is shown.

The separation should feel smooth,
precise, and cinematic.

GEOMETRY REQUIREMENTS:

Build the orange as two compatible
hemispherical meshes.

Each half must have:

- Exterior peel
- White pith layer
- Detailed orange flesh
- Radial segments
- Natural internal membranes
- Juicy translucent pulp

The two halves must align perfectly
when closed.

At the start, the fruit should look
like one seamless orange.

At the end, both cut faces must be
clearly visible to the camera.

MATERIALS:

Exterior:
Realistic porous orange peel.

Pith:
Soft white organic material.

Interior:
Translucent orange flesh.

Pulp:
Fine juicy vesicle structures.

LIGHTING:

Introduce subtle highlights on the freshly
revealed orange flesh.

Use realistic material roughness.

Use transmission or appropriate approximation
for the juicy interior.

Avoid unrealistic neon glow.

CAMERA:

Slowly move closer as the orange separates.

Allow the two halves to rotate slightly outward
so their cut faces are clearly visible.

The composition should remain balanced.

TYPOGRAPHY:

"There's more inside."

Animate the text into view after
the separation begins.

SCROLL CONTROL:

All movements must be controlled
by the master timeline.

The two halves must join seamlessly
when scrolling backward.

Do not use destructive geometry operations
during scrolling.

Use preconstructed geometry or morph targets
for predictable reversible animation.

FINAL STATE:

Two beautiful orange halves suspended
in a minimal cinematic environment.

This is the visual climax of Orange.io.

HANDOFF TO THE NEXT SCENE:
The halves drift to the sides and the background eases from cream to the deep `--press` tone while the camera pulls back; the brand reveal takes over without a hard cut.

ART DIRECTION FOR THIS PHASE:
Follow DESIGN.md. Soft-shaded stylized 3D with a warm apricot-to-cream sky, film grain and halftone accents. DOM layers (hairlines, rail, beats) sit above the canvas. Headlines use Newsreader via `SplitReveal`; labels use Geist Mono. Show scene text only through the `Beat` system and `BEATS` config (no loose text). Add no new fonts, colors or easing curves.

