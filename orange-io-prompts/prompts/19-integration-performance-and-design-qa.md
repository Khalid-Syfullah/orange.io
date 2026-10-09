# Phase 19 of 19: integration, performance and design QA

This is phase 19 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Read `DESIGN.md`, the timeline module and the components from earlier phases and extend them; do not rewrite or duplicate them.

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

Act as a senior frontend performance engineer,
creative technologist, and motion design director.

PROJECT:
Orange.io

OBJECTIVE:

Integrate and refine all eight scenes into one
seamless cinematic scroll-driven experience.

PRIMARY REQUIREMENT:

The entire story must feel like one continuous
cinematic sequence.

There must be no abrupt scene changes.

MASTER TIMELINE:

0.00–0.08:
Opening scene.

0.08–0.22:
Man and woman watering the tree.

0.22–0.42:
Tree growth.

0.42–0.56:
Orange growth and ripening.

0.56–0.68:
Orange being plucked.

0.68–0.80:
Orange floating and rotating.

0.80–0.93:
Orange splitting into two halves.

0.93–1.00:
Orange.io brand reveal.

TECHNICAL REQUIREMENTS:

1. Use one master GSAP ScrollTrigger timeline.

2. Implement scroll scrubbing.

3. Use a suitable pinning strategy.

4. Synchronize Lenis with GSAP.

5. Ensure every animation is reversible.

6. Use deterministic animation states.

7. Prevent sudden camera jumps.

8. Avoid inconsistent object positions.

9. Synchronize text transitions with scene progress.

10. Ensure the experience works on mobile.

SCROLL CONFIGURATION:

Use a long cinematic scroll distance.

For example:

a stage of about 2400vh (`STAGE_VH`)

Adjust dynamically based on viewport
and tested user experience.

Use:

scrub: 1

Avoid excessive artificial scroll smoothing.

Do not lock or hijack normal scrolling.

CAMERA:

Create continuous camera transitions.

Use smooth interpolated movement.

Avoid clipping through objects.

Maintain consistent object scale.

PERFORMANCE:

Optimize:

- Mesh geometry
- Texture resolution
- Draw calls
- Shadow quality
- Particle systems
- Lighting calculations
- React rendering
- Animation updates

Use compressed textures where appropriate.

Avoid unnecessary React state changes
during every scroll frame.

Prefer direct animation of refs
and Three.js object properties.

Implement adaptive quality for lower-end devices.

RESPONSIVENESS:

Desktop:
Full cinematic 3D experience.

Tablet:
Adjusted camera framing and object positioning.

Mobile:
Simplified effects where necessary.

Maintain the complete narrative.

ACCESSIBILITY:

Support prefers-reduced-motion.

Provide a nonanimated representation
of the complete story.

Ensure all essential content remains accessible.

Allow keyboard navigation.

VISUAL CONSISTENCY:

All eight scenes should share:

- Consistent lighting direction
- Compatible materials
- Coherent color grading
- Consistent character design
- Consistent tree appearance
- Identical orange geometry throughout transitions
- Consistent camera language

QUALITY ASSURANCE:

Test:

- Slow scrolling
- Fast scrolling
- Reverse scrolling
- Trackpad scrolling
- Mouse wheel scrolling
- Touch scrolling
- Mobile orientation changes
- Browser resizing
- Reduced-motion preferences

Check for:

- Animation jitter
- Scroll jumps
- Object popping
- Camera discontinuities
- Texture flickering
- Incorrect geometry intersections
- Layout shifts
- Memory leaks

Ensure the production build succeeds.

FINAL GOAL:

Produce a highly polished, cinematic,
premium-quality Orange.io scrolling experience
comparable in technical refinement
to leading interactive agency websites.

The result must remain creatively original,
using custom visuals and original code.

SCROLL FEEL QA (priority):
- Walk the whole stage slowly, then fast, then in reverse. Every beat must fade in and out cleanly in both directions; no two beats overlap; no beat appears before its scene is visible.
- Every scene boundary must use the dolly, dither dissolve or fly handoff described in its phase, with no object popping, and the dissolve must land exactly on each scene's first and last frame.
- Travel gaps (no text) should feel intentional, not empty: something always moves (camera, clouds, fruit).
- Tune `STAGE_VH` and each scene's share of it so the pace feels like a story: short dwell on each beat, longer travel at transitions. Document the final values in `DESIGN.md`.
- Verify `SplitReveal` text stays accessible, and reduced-motion shows the full story as still frames with all copy.

DESIGN QA: only Newsreader, Geist and Geist Mono appear; no layout shift on font load; colors and tokens match `DESIGN.md`; contrast meets WCAG AA; hairlines and registration marks line up at common viewport sizes. Update `DESIGN.md` and the README "Hero experience" section to match what was built.


ART DIRECTION FOR THIS PHASE:
Follow DESIGN.md. Soft-shaded stylized 3D with a warm apricot-to-cream sky, film grain and halftone accents. DOM layers (hairlines, rail, beats) sit above the canvas. Headlines use Newsreader via `SplitReveal`; labels use Geist Mono. Show scene text only through the `Beat` system and `BEATS` config (no loose text). Add no new fonts, colors or easing curves.

