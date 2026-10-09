# Phase 17 of 19: brand reveal and chapter content

This is phase 17 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Implement Scene 08.

SCENE TITLE:
"Orange.io"

SCROLL RANGE:
0.93–1.00

OBJECTIVE:

Transition from the orange halves
into a premium Orange.io brand reveal.

VISUAL:

Two orange halves remain visible.

The camera slowly pulls backward.

The halves move toward the sides,
creating space in the center.

ANIMATION:

0.93:
Orange halves remain centered.

0.94:
Halves move gently outward.

0.96:
Camera pulls backward.

0.97:
Orange.io logo begins appearing.

0.99:
Supporting tagline fades in.

1.00:
Final brand composition is revealed.

BRANDING:

Main headline:

"Orange.io"

Tagline:

"Great things grow together."

Supporting text:

"From the smallest beginnings
to extraordinary possibilities."

CTA:

"Explore what we do ↗"

DESIGN:

Extremely minimal.

Premium editorial typography.

Warm neutral background.

Orange accent elements.

Subtle shadows.

Clean composition.

INTERACTION:

CTA has a refined hover animation.

The final composition remains stable.

Allow natural scrolling into subsequent
website content.

Do not trap the user in the animation.

SCROLL REVERSIBILITY:

Scrolling upward should reverse
the brand reveal and return naturally
to the orange splitting sequence.

CHAPTER CONTENT AFTER THE STAGE:
After the tall stage ends, normal page content continues, following DESIGN.md (cream and ink panels, hairline separators, display headlines, mono labels, Tag and pill Button components, reveals with `SplitReveal` and `whileInView`):
1. "What we grow" (three right-column style cards)
2. "How it works" (three steps)
3. "Say hello" (an accessible contact form using shadcn form components, no backend; show a success state)
4. A `--press` dark footer with a mono meta line and the brand mark.
All copy is placeholder marked TODO.


ART DIRECTION FOR THIS PHASE:
Follow DESIGN.md. Soft-shaded stylized 3D with a warm apricot-to-cream sky, film grain and halftone accents. DOM layers (hairlines, rail, beats) sit above the canvas. Headlines use Newsreader via `SplitReveal`; labels use Geist Mono. Show scene text only through the `Beat` system and `BEATS` config (no loose text). Add no new fonts, colors or easing curves.

