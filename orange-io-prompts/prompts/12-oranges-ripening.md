# Phase 12 of 19: oranges ripening

This is phase 12 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Implement Scene 04.

SCENE TITLE:
"The Harvest"

SCROLL RANGE:
0.42–0.56

OBJECTIVE:

Animate oranges growing and ripening
on the mature orange tree.

VISUAL:

The tree is lush and full of leaves.

Several oranges hang naturally from branches.

Initially, the fruits are small and green.

ANIMATION:

0.42–0.46:
Oranges gradually increase in size.

0.46–0.51:
Their colors transition from green
to yellow-orange.

0.51–0.54:
The oranges become fully ripe.

0.54–0.56:
The camera identifies one particular orange.

COLOR TRANSITION:

Green:
#568C43

Intermediate:
#B4A83B

Ripe:
#FF8500

Use realistic color interpolation.

MATERIALS:

Create photorealistic orange peel.

Include:

- Fine pores
- Subtle roughness
- Natural color variation
- Soft surface imperfections
- Realistic highlights

Avoid a perfectly smooth plastic appearance.

CAMERA:

Slowly transition from a medium shot
of the tree to a close-up of a selected orange.

Use natural cinematic framing.

Create subtle depth of field.

The selected orange should become
the visual center of attention.

TEXT:

"Every effort bears fruit."

Reveal the text gradually.

END STATE:

The camera focuses on one ripe orange
still attached to a branch.

The next scene will begin with a hand
reaching toward the fruit.

HANDOFF TO THE NEXT SCENE:
The selected fruit stays on the fly layer while the rest of the tree softens into depth of field. A short dither dissolve moves from the wide tree view to the close hand-and-branch view.

ART DIRECTION FOR THIS PHASE:
Follow DESIGN.md. Soft-shaded stylized 3D with a warm apricot-to-cream sky, film grain and halftone accents. DOM layers (hairlines, rail, beats) sit above the canvas. Headlines use Newsreader via `SplitReveal`; labels use Geist Mono. Show scene text only through the `Beat` system and `BEATS` config (no loose text). Add no new fonts, colors or easing curves.

