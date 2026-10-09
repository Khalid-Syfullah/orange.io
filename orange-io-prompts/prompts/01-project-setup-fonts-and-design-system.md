# Phase 1 of 19: project setup, fonts and design system

This is phase 1 of 19 in building the Orange.io scroll-driven story (a man and a woman water an orange tree, the tree grows and fruits, an orange is plucked, floats, and splits into two halves, then the brand is revealed). All phases share one conversation, and earlier phases have already created code. **Before writing anything, inspect the repo**: package.json, framework and version, folder layout, existing components and styles, and any CI configuration. Reuse the existing Next.js project if there is one; only initialize a new project if the repo has no app yet.

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

Act as a senior creative frontend engineer and art director.

PROJECT: Orange.io (a premium, cinematic, scroll-driven site).

OBJECTIVE:
Set up the foundation: stack, fonts, design tokens and a written design spec. Do not build scenes yet.

STACK (compatible, stable versions; React Three Fiber 9 needs React 19, otherwise use R3F 8 with React 18):
- Next.js App Router, TypeScript, Tailwind CSS
- shadcn/ui (initialize with the official CLI; then add button, badge, separator, sheet, navigation-menu, tooltip, form, input, textarea, label)
- motion (Framer Motion; import from `motion/react`)
- GSAP + ScrollTrigger, Lenis
- three, @react-three/fiber, @react-three/drei

TASKS:
1. Inspect the repo. Extend what exists. Keep CI scripts passing.
2. Install and configure the stack.
3. Load Newsreader, Geist and Geist Mono with `next/font/google` (size-adjusted fallbacks, `display: swap`) and expose `--font-display`, `--font-text`, `--font-mono` and Tailwind families (`font-display`, `font-text`, `font-mono`). Keep font choice in ONE file so licensed fonts can be swapped in later with a one-line change.
4. Define every token as CSS variables, map them into the Tailwind theme and the shadcn theme, and add type-scale utilities (`text-display-xl`, `text-display-l`, `text-title`, `text-lead`, `text-body`, `text-label`, `text-meta`).
5. Create a `/design` dev route (not in nav) showing the type scale, swatches, pill button, tag, hairline grid with registration marks, and a character-split headline.
6. Write `DESIGN.md` from the design direction below (fonts, scale, colors, shapes, layout grid, motion language, scroll model, accessibility, and a "do not" list).
7. Verify dev and production builds.

### Design direction (use this in `DESIGN.md` and everywhere)

Orange.io is a calm, editorial, art-directed site. The look comes from restraint: a few strict tokens, light serif headlines, tiny monospace labels, hairline grid lines, and one hero moment. It is inspired by the *techniques* of premium studio sites (not by any one site's assets, copy or imagery).

**Fonts (all free, load with `next/font/google`, self-hosted at build time, `display: swap`)**
- Display: **Newsreader** (variable, use weight 300, optical size on). Sentence case. Letter-spacing -0.02em. Line-height 0.9 to 1.0 for big headlines. Italic for one emphasized word per headline at most.
- Text: **Geist** (400). 13 to 20px, line-height about 1.3 to 1.45, slight negative tracking only on large sizes.
- Mono: **Geist Mono** (500). Uppercase, 9 to 12px, letter-spacing 0.04em for metadata and 0.18em for buttons and labels.
- Expose as CSS variables `--font-display`, `--font-text`, `--font-mono` and map them in Tailwind (`font-display`, `font-text`, `font-mono`).

**Type scale (fluid, clamp between mobile and desktop)**
- `display-xl`: clamp(2.75rem, 1rem + 5.3vw, 5.5rem), Newsreader 300, tracking -0.02em, leading 0.9
- `display-l`: clamp(2rem, 1rem + 2.6vw, 3.25rem), Newsreader 300, tracking -0.02em, leading 1
- `title`: 1.625rem, Newsreader 400, tracking -0.02em, leading 0.95
- `lead`: 1.25rem, Geist 400, tracking -0.02em, leading 1.2
- `body`: 0.8125 to 0.9375rem, Geist 400, leading 1.3
- `label`: 0.6875rem, Geist Mono 500, uppercase, tracking 0.18em
- `meta`: 0.75rem, Geist Mono 500, uppercase, tracking 0.04em

**Colors (CSS variables, mapped into the shadcn theme: background, foreground, primary, muted, border, ring)**
- `--orange` #FF7800 (accent, used sparingly: one CTA, small marks, the fruit)
- `--cream` #F7F3EA (paper, light sections)
- `--ink` #181818 (dark sections, text on cream)
- `--press` #0F0D0A (deepest background for the final reveal)
- `--leaf` #476B35
- `--apricot` #FFD9A8 (hero sky glow), `--clay` #E9DCC6 (soft panels)
- Hairlines: 1px at 20% of the foreground colour. Light theme only for the story; the dark `--press` panel is a section style, not a theme switch.

**Shape, surface and motion tokens**
- Buttons are pills (radius 999px): 1px border at 20% foreground, inset 1px top highlight at 16% white, 1px dark bottom edge, mono `label` text, a small arrow icon in a square chip. Hover: border to 40%, arrow chip slides 2px.
- Tags: radius 4px, background 10% foreground, mono 8 to 9px uppercase, padding 5px 8px.
- One easing curve everywhere: `cubic-bezier(0.22, 1, 0.36, 1)` (name it `--ease-out-soft`, and export `EASE` for `motion`). Durations 0.5 to 1.2s for reveals.
- Layout uses a percentage/vw grid: left margin 5.3vw, two text columns starting at about 8% and 24% of the width, thin horizontal and vertical hairlines across the viewport, tiny "registration" crosshair marks (a 4-point star glyph) where lines meet, and small tick marks on the left rail.
- Surface finish: subtle film grain overlay (static, 3 to 5% opacity), halftone dot texture for clouds and shadows, no drop-shadow cards, no gradients on UI.

**Signature motion language**
- Headlines and key lines reveal by **character** (split into spans, staggered 12 to 20ms, each fading up 0.4em with the shared easing). Build one reusable `SplitReveal` component with `motion`, driven either by `whileInView` or by a scroll progress `MotionValue`.
- A side **rail** of chapters ("Ch. 1 The Seed" ...) with an active state and a thin progress line; a small mark/logo top left; a pill "Apply"/CTA top right.
- Hover on interactive text swaps characters with a short vertical roll.
- Everything respects `prefers-reduced-motion` (`useReducedMotion`): reveals become simple fades, scroll scenes become still frames.

**Layout grid (measured from the reference technique, expressed as tokens)**
- `--v1: 5.3%` left hairline, `--v2: 85.6%` right hairline, `--h1: 5.3vw` top hairline, `--h2: calc(65.3% + 50px)` lower hairline. Text column A starts near 8% and column B near 24% of the width. Registration marks (four-point stars) sit where hairlines cross. Hairlines are 1px at ~20% foreground.
- Fixed chrome: mark top-left (about 20px, aligned to `--v1`), a small grid/menu icon under it, the chapter label and tick marks along the left hairline, a pill "Say hello" button top-right inside the top hairline.
- The hero composition: headline (display-xl, left, vertically around 45%), a two-line lead beneath it, a pill CTA, then a small Tag plus a short paragraph at lower left; the art fills the right 55% and bleeds off the edges.

**Right-column cards** (used while the stage scrolls): a mono Tag, a display-l title, then a body paragraph, set in the right column over the art, each card entering and leaving as a *beat*.

Orange.io must use its own art, copy, logo and marks, and only fonts it is licensed to use.

