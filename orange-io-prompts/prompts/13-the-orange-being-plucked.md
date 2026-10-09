# Phase 13 of 19: the orange being plucked

This is phase 13 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Implement Scene 05.

SCENE TITLE:
"The Moment"

SCROLL RANGE:
0.56–0.68

OBJECTIVE:

Create a realistic close-up cinematic sequence
where a ripe orange is gently plucked from a tree.

INITIAL STATE:

A ripe orange hangs from a branch.

The camera focuses closely on the orange.

Several green leaves frame the composition.

ANIMATION:

0.56:
The orange remains attached to the branch.

0.58:
A human hand gradually enters the frame.

0.60:
The fingers approach the orange.

0.62:
The hand gently wraps around the fruit.

0.64:
The orange rotates slightly.

0.65:
The stem detaches.

0.66:
The orange separates from the branch.

0.68:
The hand moves the orange toward the camera.

PHYSICAL DETAILS:

- Natural hand movement
- Realistic finger positioning
- Correct hand-to-fruit contact
- Slight branch movement
- Gentle leaf displacement
- Subtle stem bending
- Realistic fruit rotation

ANIMATION QUALITY:

Use skeletal animation for the hand.

Use inverse kinematics or a carefully authored
animation for the reaching and grasping motion.

Avoid intersections between fingers and fruit.

The orange must remain visually continuous
throughout the sequence.

CAMERA:

Use a cinematic close-up.

Maintain focus on the selected orange.

Gradually reduce background visibility.

TRANSITION:

As the orange approaches the camera,
the background gradually changes
to a clean cream-colored studio environment.

IMPORTANT:

Do not abruptly replace the orange model.

The same fruit should visually transition
from the tree into the next scene.

Scrolling upward must reverse the picking action.

HANDOFF TO THE NEXT SCENE:
The plucked fruit remains on the fly layer and travels to the centre of the viewport while a long dither dissolve (top to bottom) turns the tree background into the cream studio. The hand exits during the dissolve.

ART DIRECTION FOR THIS PHASE:
Follow DESIGN.md. Soft-shaded stylized 3D with a warm apricot-to-cream sky, film grain and halftone accents. DOM layers (hairlines, rail, beats) sit above the canvas. Headlines use Newsreader via `SplitReveal`; labels use Geist Mono. Show scene text only through the `Beat` system and `BEATS` config (no loose text). Add no new fonts, colors or easing curves.

