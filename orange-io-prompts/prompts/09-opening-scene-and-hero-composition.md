# Phase 9 of 19: opening scene and hero composition

This is phase 9 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Implement Scene 01 of Orange.io.

SCENE TITLE:
"The Beginning"

VISUAL ENVIRONMENT:

Create a beautiful minimalist outdoor environment.

The environment includes:

- A small orange tree
- Natural ground
- Soft grass
- Warm sunlight
- Subtle shadows
- A clean cream-colored horizon
- A man standing on the left
- A woman standing on the right
- Two elegant watering cans

CHARACTERS:

Create two realistic or premium stylized
3D human characters.

Man:
- Natural proportions
- Casual neutral-colored clothing
- Relaxed posture
- Standing to the left of the tree

Woman:
- Natural proportions
- Elegant casual clothing
- Relaxed posture
- Standing to the right of the tree

Avoid cartoonish characters.

The characters should feel like they belong
in a premium cinematic commercial.

TREE:

Initially, the orange tree is relatively small.

It has:

- A slender trunk
- Several branches
- A modest number of leaves
- Natural green foliage
- No visible oranges

CAMERA:

Begin with a wide cinematic composition.

Place the tree in the center.

Place the man and woman on opposite sides.

Use a 35mm-equivalent camera perspective.

LIGHTING:

Soft golden-hour lighting.

Warm highlights.

Natural contact shadows.

Elegant ambient illumination.

TYPOGRAPHY:

Display the headline:

"Great things grow together."

Use oversized editorial typography.

Animate the headline gently into view.

SCROLL ANIMATION:

Progress 0.00–0.08:

- Camera moves slightly forward.
- Headline reveals.
- Characters subtly shift their posture.
- Leaves respond gently to environmental movement.

Maintain a smooth, natural visual progression.

Scrolling backward must reverse the sequence.

IMPLEMENTATION:

Use React Three Fiber for rendering.

Use GSAP to control camera and object transforms, and `motion` for the DOM text.

Maintain scene continuity.

Do not add abrupt scene cuts.

DELIVERABLE:

A fully functional opening scene integrated
with the master scroll timeline.

HANDOFF TO THE NEXT SCENE:
The closing frame holds the full tree clearing with both people. The transition into watering is a slow camera dolly forward (no dissolve); the headline beat swaps to the next beat while the hairlines stay.

ART DIRECTION FOR THIS PHASE:
Follow DESIGN.md. Soft-shaded stylized 3D with a warm apricot-to-cream sky, film grain and halftone accents. DOM layers (hairlines, rail, beats) sit above the canvas. Headlines use Newsreader via `SplitReveal`; labels use Geist Mono. Show scene text only through the `Beat` system and `BEATS` config (no loose text). Add no new fonts, colors or easing curves.

