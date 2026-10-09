# Orange.io — Design Spec

A calm, editorial, art-directed, scroll-driven site. The look comes from restraint: a few strict tokens, light serif headlines, tiny monospace labels, hairline grid lines, and one hero moment. It borrows *techniques* from premium studio sites, never their assets, copy or imagery.

## Fonts
All free, loaded in `src/lib/fonts.ts` (the only place fonts are chosen; swap licensed fonts there). Exposed as `--font-display`, `--font-text`, `--font-mono` and Tailwind `font-display`, `font-text`, `font-mono`. (next/font writes to internal `--nf-*` variables to avoid self-referencing CSS variables.)

| Role | Family | Use |
| --- | --- | --- |
| Display | Newsreader, weight 300, optical size on | Sentence case, tracking -0.02em, leading 0.9–1.0. Italic for one emphasized word per headline at most |
| Text | Geist 400 | 13–20px, leading 1.3–1.45, negative tracking only on large sizes |
| Mono | Geist Mono 500 | Uppercase, 9–12px, tracking 0.04em (meta) / 0.18em (buttons, labels) |

## Type scale (utilities)
| Class | Size | Font | Tracking | Leading |
| --- | --- | --- | --- | --- |
| `text-display-xl` | clamp(2.75rem, 1rem + 5.3vw, 5.5rem) | Newsreader 300 | -0.02em | 0.9 |
| `text-display-l` | clamp(2rem, 1rem + 2.6vw, 3.25rem) | Newsreader 300 | -0.02em | 1 |
| `text-title` | 1.625rem | Newsreader 400 | -0.02em | 0.95 |
| `text-lead` | 1.25rem | Geist 400 | -0.02em | 1.2 |
| `text-body` | 0.8125–0.9375rem | Geist 400 | 0 | 1.3 |
| `text-label` | 0.6875rem | Geist Mono 500 uppercase | 0.18em | 1.2 |
| `text-meta` | 0.75rem | Geist Mono 500 uppercase | 0.04em | 1.2 |

## Colour
| Token | Value | Use |
| --- | --- | --- |
| `--orange` | #FF7800 | Accent, sparingly: one CTA, small marks, the fruit |
| `--cream` | #F7F3EA | Paper, light sections (shadcn `background`) |
| `--ink` | #181818 | Dark sections, text on cream (shadcn `foreground`) |
| `--press` | #0F0D0A | Deepest background for the final reveal |
| `--leaf` | #476B35 | Foliage |
| `--apricot` | #FFD9A8 | Hero sky glow |
| `--clay` | #E9DCC6 | Soft panels (shadcn `muted`, `secondary`) |

Hairlines: 1px at 20% of the foreground (`--hairline`). Light theme only; `.panel-press` is a section style, not a theme switch. shadcn tokens (`background`, `foreground`, `primary`, `muted`, `border`, `ring`) are mapped to these in `globals.css`.

## Shape and surface
- **Pill buttons** (`PillButton`): radius 999px, 1px border at 20% foreground, inset 1px top highlight at 16% white, 1px dark bottom edge, mono `label` text, arrow icon in a square chip. Hover: border to 40%, chip slides 2px.
- **Tags** (`Tag`): radius 4px, background 10% foreground, mono 8–9px uppercase, padding 5px 8px.
- Static film grain overlay at 3–5% opacity (`.grain`), halftone dots for clouds and shadows (`.halftone`). No drop-shadow cards, no gradients on UI.

## Layout grid
Percentage/vw grid. `--v1: 5.3%` left hairline, `--v2: 85.6%` right hairline, `--h1: 5.3vw` top hairline, `--h2: calc(65.3% + 50px)` lower hairline. Text column A starts near 8% (`--col-a`), column B near 24% (`--col-b`). Four-point registration stars sit where hairlines cross; small tick marks run down the left rail.
Fixed chrome: mark top-left (~20px, aligned to `--v1`), grid/menu icon below it, chapter label and ticks along the left hairline, pill "Say hello" top-right inside the top hairline.
Hero: headline (`display-xl`, left, around 45% height), two-line lead, pill CTA, then a small Tag and short paragraph at lower left; art fills the right 55% and bleeds off the edges.
Right-column cards: mono Tag, `display-l` title, body paragraph over the art; each enters and leaves as a beat.

## Motion language
- One easing everywhere: `cubic-bezier(0.22, 1, 0.36, 1)` — `--ease-out-soft` in CSS, `EASE` in `src/lib/motion.ts`. Reveal durations 0.5–1.2s.
- Headlines and key lines reveal by character via `SplitReveal`: spans staggered 12–20ms, each fading up 0.4em. Driven by `whileInView` or a scroll `MotionValue`.
- Side rail of chapters ("Ch. 1 The Seed") with active state and a thin progress line.
- Hover on interactive text swaps characters with a short vertical roll.
- `prefers-reduced-motion`: reveals become simple fades, scroll scenes become still frames.

## Scroll model
Native scrolling on one very tall stage (~53 viewport heights). A fixed full-viewport stack stays put: persistent WebGL canvas, transition canvas, fly canvas, hairline canvas, DOM text. Lenis plus a single GSAP ScrollTrigger write normalized 0–1 progress into one shared `MotionValue`. Text is a set of **beats** that fade in and out at scroll ranges in the same spot; long **travel** stretches have no text. Chapters group the beats. Scene changes use a dither/pixel dissolve, a slow camera dolly, drifting halftone clouds for parallax, and one element that flies across each transition.
- Ranges live only in `src/lib/timeline.ts` (`SCENES`, `sceneProgress`). Never hardcode ranges in components.
- No time-based animation on scroll-controlled elements; no React state updates per scroll frame.
- Stack roles: shadcn/ui for interface; `motion/react` for DOM and text; React Three Fiber + drei for 3D; GSAP only for the scroll timeline and camera/object tweens.
- 3D is procedural, behind small interfaces and a `models` config so GLB files can replace it via `useGLTF`.

## Accessibility
Respect `prefers-reduced-motion`. Split text keeps an `aria-label` with the full string. Visible focus rings (`--ring`). Text contrast ≥ 4.5:1 (ink on cream; cream on press). The scroll story must have a non-motion fallback.

## Do not
- Add other fonts, colours or easing curves.
- Use gradients or drop shadows on UI, or a dark theme switch.
- Use orange for anything beyond one CTA, small marks and the fruit.
- Use uppercase for display text, or more than one italic word per headline.
- Animate scroll-driven elements with time, or set React state per scroll frame.
- Copy any reference site's assets, copy, imagery or logo.

## UI kit (src/components)
- `ui/button` variants `pill`, `pill-light`, `orange` (arrow chip nudges 2px); `ui/badge` variant `tag` (wrapped by `design/tag`).
- `design/split-reveal` (`whileInView` once, or `progress` + `range=[in,out]`), `design/hover-roll`, `design/hairlines` (optional `visible` MotionValue), `design/grain-overlay`, `design/chrome` (mark, menu Sheet, chapter rail, CTA).
- Shared scroll value: `src/lib/progress.ts` (`progress`); chapters and scenes: `src/lib/timeline.ts`. All shown at `/design`.

## Scroll engine (src/components/scroll, src/lib)
- `STAGE_VH` (2400) sets the stage height in `svh`; `SCENES`, `CHAPTERS`, `BEATS` and helpers (`sceneProgress`, `currentScene`, `currentChapter`, `vh`) live in `timeline.ts`.
- `ScrollProvider` (layout): Lenis driven by the GSAP ticker, synced with ScrollTrigger; writes `velocity`. `Stage`: one ScrollTrigger writes `progress`, restores it after resize/orientation changes.
- `Beat` / `BeatLine` / `BeatLead` / `BeatCard`: beats share one position and are visible only inside `[at, out]`. Gaps between beats are deliberate travel.
- Dev overlay (dev builds only): keys 1-8 jump to scene starts, `h` toggles. Reduced motion renders `StaticStory` (stacked chapters with still placeholders) instead of the stage.

## Progress rail (src/components/design/rail.tsx, src/scroll/segments.ts)
- `SegmentedLine`: SVG segments from `railSegments()` (scene, chapter and beat boundaries; slivers merged), lengths proportional to scroll span, 3px gaps at boundaries, each path carries `data-a` / `data-b`. Fill is `stroke-dashoffset` driven by the progress MotionValue.
- `ChapterRail` (desktop, below the lower hairline): entries are links with `data-at`, `aria-current="step"`; the active one shows a leading rule and a `SplitReveal` label that swaps on chapter change. `MobileRail`: compact top line plus label; the menu Sheet lists chapters. Clicks use `lenis.scrollTo` with distance-scaled duration and the shared easing.

## Hairline choreography (src/components/design/hairlines.tsx, src/scroll/frame.ts)
- Parts, each a plain element moved with `motion` transforms and carrying `data-out`: vertical lines `l`, `r`; horizontal lines `u`, `d`; corner crosses `lu`, `ru`, `ld`, `rd`; a filled bar `d`.
- `FRAME` in the script gives a state per scene: `hero` (grid positions), `open` (lines retract to 12px from the edges, crosses sit in the corners), `closed` (parts exit along `data-out` and fade). `watering` opens after the first screen (100vh), `split` locks the vertical lines at 32% / 68%, `brand` closes. Transitions last `FRAME_TRANSITION_VH` (40vh) and are scrubbed, so they reverse.
- Crosses pulse 1 to 1.4 to 1 within `PULSE_VH` of every beat boundary (scrubbed too). Reduced motion renders the static hero state only. Mark, menu, rail and pill live in `Chrome` and never move.

## Transitions, fly layer, dolly, parallax (src/scene)
- `SceneTransition`: one canvas with an ordered-dither (Bayer 8x8) dissolve shader. `uMix` is 0 to 1 over each boundary's window (`TRANSITION_VH` = 45vh ending at the scene start, `useTransition(boundary)` / `transitionMix`), the front sweeps in `uDirection` with scattered edge pixels, `uPixelSize` is 3 CSS px. 0 is exactly scene A, 1 exactly scene B (sweep clamped to [0, 1], thresholds in [0, 1)). It is hidden and does no work outside a window.
- `SceneCanvas` shows the current scene's placeholder plate through the same plate shader and camera uniforms as the dissolve, so the dissolve starts and ends on the pixels the scene shows. Real scenes replace `PlateQuad`; for render targets, pass them where `usePlateTextures()` is used. `useDollyTrack` / `useDolly(range, from, to)` move the R3F camera (position, FOV, look-at) with the shared easing; the default is a slow push-in, one eased segment per scene, continuous at boundaries. Plate zoom assumes straight-on cameras.
- `FlyLayer` (DOM): the orange travels between the `treeFruit`, `hand` and `center` anchors along `FLY_PATH`; hand to center happens inside the plucking to floating dissolve.
- `ParallaxLayer`: 22 halftone clouds in one instanced mesh. Scroll progress sets position (deeper moves faster); smoothed scroll velocity adds drift and stretch.
- All layers use `frameloop="demand"`, DPR capped at 1.5, no per-frame allocation, and a WebGL error boundary. Per-frame mutation lives in plain functions (`stepPlate`, `stepDissolve`, `stepClouds`) so the React lint rules stay on.

## Pointer and velocity reactions
- `src/lib/reactions.ts` holds the tunables and MotionValues (`pointerX/Y`, `sheen`, `sheenX/Y`); `velocityNorm` (progress.ts) is scroll velocity smoothed, clamped to -1..1 and snapped to exactly 0 at rest.
- Sheen: a warm-white, faintly iridescent highlight in the shared plate shader, set by pointer move, decaying with a 400ms time constant to exactly 0. It is applied in both the scene and dissolve shaders. For now it lights the placeholder plate; the fruit mesh will reuse `applySheen`.
- Velocity: vertical smear at the screen edges (max 1% uv), 3% scale breath on the plate and the fly orange, faster cloud drift. All zero at rest.
- Pointer parallax: `PointerLayer` shifts by at most 6px x depth (scene 0.4, clouds 0.7, fly 1, text 0.2); hairlines stay fixed.
- Sheen and parallax run only with a fine hovering pointer and without reduced motion. The decay loop runs only while the sheen is active and stops when the tab is hidden. `HoverRoll` (with a screen-reader text) is used in pill buttons and the chapter list.

## Scene 01, The Beginning (src/scene/world)
- Procedural, behind `src/scene/models.ts` slots (`tree`, `man`, `woman`, `wateringCan`); set a `url` and `ModelSlot` renders the GLB via drei `<Gltf>` instead.
- `OpeningWorld`: sky (apricot to a cream horizon at eye level) with fog, warm low sun with soft shadows, ground with grass, a young tree (slender trunk, six branches, a modest crown, no fruit), the man left and the woman right, each holding a watering can, contact-shadow decals. Camera is a 35mm-equivalent (40 degree vertical FOV) pushed in along the default dolly.
- One paused GSAP timeline over the opening scene is scrubbed from `progress` (`tl.progress(sceneProgress("opening", p))`): small camera push, head turns, weight shift, breath. Leaf sway is a function of scroll progress and velocity, never of time, so scrolling back reverses it.
- The world carries scenes opening and watering, so opening to watering is a continuous dolly (`NO_DISSOLVE`), with no dissolve. Growth onward still shows placeholder plates; the watering to growth dissolve starts from the watering plate until the later scenes are built.
- The hero headline ("Great things grow together.") is an `intro` beat: it reveals on load with `SplitReveal`, and only its exit is scroll-driven.

## Scene 02, Nurturing Growth (watering)
- Milestones live in `WATERING` (script.ts): lift 0.08, tilt 0.12, flow 0.15, water reaches the ground 0.17, flow stops 0.20, relaxed 0.22. The beat "Every idea needs care." sits in the pour.
- Rig: the can arm is a shoulder, elbow and wrist chain; the can is parented to the wrist, so the hand never leaves it. One paused GSAP timeline in progress units drives joint angles (interpolation only).
- Water (`src/scroll/watering.ts`, `watering-effects.tsx`): 2 streams x 44 droplets in one instanced mesh. Each droplet is a pure function of progress: a parabola from the rose to the tree base (`trajectory`), cycling along its path as you scroll, visible between the stream tail and front, shrinking to nothing on landing, with a splash ring. No simulation state, so it replays in reverse.
- Soil: a wet decal grows from 0.17 to 0.22 and stays (it carries into later scenes).
- Camera keeps pushing toward the trunk with a slight sideways shift. `LiveCompositor` renders the world into a target and dithers it into the next scene's frame on the scene canvas (`isLiveDissolve`), so the watering to growth dissolve starts on real pixels. Growth is still a placeholder plate (phase 11 replaces it).

## Scene 03, Growth (src/scene/world/growing-tree.tsx, src/scroll/growth.ts)
- Windows in `GROWTH` (script.ts): trunk 0.22-0.27, primary branches 0.27-0.32, new leaves 0.32-0.35, fuller 0.35-0.38, fruit 0.38-0.42. Nothing is a scaled copy of the tree: the trunk (6 segments), 8 primary branches (2 segments each), 16 secondary branches, ~330 leaves, fruit stems and fruit are each placed every frame from their own window, as pure functions of progress. Leaves ride their branches, unfold from folded and narrow to open, and sway with scroll progress and velocity.
- Look: procedural bark texture, double-sided leaves with a little emissive green for translucency, contact shadows, soft sun. Fruit starts as small green oranges (`FRUIT_GREEN`).
- Camera keeps closing in and rises a little as the tree grows (one timeline, progress units, to 0.42), so the tree fills the frame while the people drift out of it. The camera rig now runs at priority -2 and the timeline at -1, so poses never lag a frame.
- Hand-off: at 0.42 the 3D hero fruit (`HERO_FRUIT`, chosen from measured screen positions so it sits centre-right) disappears and the fly layer shows the same fruit at the same place and size (`FLY_ANCHORS.treeFruit`); its colour ripens green to orange over `FRUIT_RIPEN`. Halftone clouds ease to 35% speed through `cloudPhase`, which is continuous so they never jump.
- The world now carries opening, watering, growth and ripening (`WORLD_SCENES`, `NO_DISSOLVE`); phase 12 builds on it.

## Scene 04, The Harvest (src/scroll/ripening.ts, live-compositor.tsx)
- Windows in `RIPENING`: oranges grow 0.42-0.46, green to yellow-orange 0.46-0.51, fully ripe 0.51-0.54, camera singles one out 0.54-0.56. Colours `#568C43` to `#B4A83B` to `#FF8500`, mixed in OKLab (`ripenRgb`), staggered a little per fruit. The beat "Every effort bears fruit." is scrubbed across the scene.
- Peel: `meshPhysicalMaterial` with one procedural canvas as both colour map (multiplied with the ripening tint, for natural variation) and bump map (fine pores, blemishes), roughness 0.55, a light clear coat.
- Camera: one GSAP tween (`focus.b`) blends the rig pose into a close-up framed around the hero fruit (1.65 units away, aimed so it sits centre-right). Leaves near that fruit part as the focus builds.
- Depth of field: `LiveCompositor` renders the world into a target with a depth texture, then a 16-tap gather softens everything away from the selected fruit's distance (`dofStrength`, 6px max). It holds after 0.56 and works inside live dissolves too.
- Hand-off: at `FLY_HANDOVER` (0.56) the 3D hero fruit disappears and the fly layer shows the same fruit at the same place, size and colour (`FLY_ANCHORS.treeFruit`, measured from the projected hero), sharp over the soft tree. Plucking joins the live world (no dissolve) so the camera move stays continuous; the hand-and-branch view is built on the same world in the next phase.

## Scene 05, The Moment (src/scroll/pluck.ts, src/scene/world/hand*.ts)
- Milestones in `PLUCK` (script.ts): hand enters 0.58, fingers approach 0.60, wrap 0.62, fruit rotates 0.64, stem detaches 0.65, fruit separates 0.66, moved toward camera 0.68. All timing is pure functions in `pluck.ts` (`handPresence`, `handDistance`, `grasp`, `twist`, `pull`, `stemStretch`, `branchRecoil`, `studioMix`).
- Hand: a skeletal rig (palm, wrist and forearm, four fingers of three bones, a two-bone thumb), built at human size and scaled 1.9x to wrap the oversized fruit. `solveCurls` closes each finger toward `grasp * maxCurl` until the first bone would touch the fruit, then keeps curling the outer joints while every bone stays clear, so fingers wrap the fruit and never enter it (unit-tested at many grasp levels). The palm sits on the fruit's skin, and hand and fruit twist together about the fruit's vertical axis.
- The fruit stays 3D (never swapped for a different model) while attached, stretches its stem, twists, and is pulled free; the stem then springs back and the branch swings through a damped oscillation (`branchRecoil`), all deterministic. Leaves are brushed aside by the approaching hand. Scrolling up reverses all of it.
- Studio: as the hand arrives the depth-of-field pass veils everything far behind the fruit toward cream (`studioMix`), with the focus plane following the held fruit.
- Hand-over: at `FLY_HANDOVER` (0.6625) the 3D fruit disappears and the fly layer shows it at the same place, size and colour (`FLY_ANCHORS.hand`, measured), then it travels to `center` during the dither dissolve (top to bottom) while the hand opens and withdraws. The plucking scene is in `WORLD_SCENES`; the dissolve into the floating scene still lands on a placeholder plate until phase 14.

## Scene 06, The Reveal (src/scroll/studio.ts, src/scene/world/studio-world.tsx)
- Windows in `STUDIO`: the 3D orange takes over at 0.68, settles 0.71-0.74, rotates 0.74-0.77 (3.4 rad, tied to scroll, so scrolling back turns it back), grows 12% 0.77-0.80; the equator mark appears 0.78-0.80. The beat "Nature reveals its best." uses the `left-narrow` side so it never reaches the centred fruit.
- Studio: clean cream (`#F7F3EA`) backdrop, a soft key light, a subtle warm rim, gentle hemisphere fill, a soft contact shadow, and an offline RoomEnvironment for believable highlights. The orange is a displaced sphere (subtle asymmetry, stem dimple, navel) with the shared procedural peel (colour and bump), a clear coat, and a calyx and stem nub so the rotation reads. Its camera is a frontal product shot with a slow push-in; the camera distance is solved so the orange matches the fly orange exactly at the hand-over.
- Compositor: `SCENE_GROUP` maps each scene to a live group (`world`, `studio`) or a plate. `showGroup` (registry.ts) switches the canvas to one group, so the compositor can render either side of a dissolve with its own camera. The plucking to floating dissolve is world (with depth of field and the cream veil) into studio, both live. The clouds fade out for the studio.
- Hairlines close from vh 1850 (frame state `closed` for floating), and a single `EquatorMark` registration mark appears on the orange's equator, announcing the cut into the split scene.

## Scene 07, Inside Orange (src/scene/world/orange-geometry.ts, cut-texture.ts)
- Windows in `SPLIT`: the spin winds down into the cutting orientation 0.80-0.83 (to a whole turn, stem axis turned horizontal), a thin separation line opens 0.83-0.85, the halves part 0.85-0.88, move apart and turn outward 0.88-0.91, the cut faces are fully shown 0.91-0.93 while the camera pulls back and the studio eases from cream to `--press`.
- Geometry: both halves are index subsets of the SAME displaced vertex buffer as the whole orange, so normals and uvs match across the equator and a closed orange is seamless and identical to the whole it replaces at 0.80. The cut face is a ring mesh built once from the equator vertices, with polar UVs, so the cross-section texture meets the real rim. Nothing is built or cut while scrolling; scrolling back closes the halves exactly.
- Cross-section (`cutTexture`): a thin rind, a white pith ring, ten segments separated by pale membranes, a pith core, and about five thousand juice vesicles with wet highlights, used as colour and bump. The flesh material is a damped physical material with a slight warm emissive instead of transmission (no neon); the scene's environment is scaled down with `scene.environmentIntensity` (the room reflections are a garnish).
- The halves are `pivot (x gap, outward turn) > rig (orientation, scale)`; the pivots sit at the cut centre, so turning outward swings each cut face toward the camera. The beat "There's more inside." sits above the halves (`top-left`) and appears after the separation begins.
- `PressTheme` writes `--press-mix` on the root so the chrome's text and hairlines turn cream as the backdrop deepens. Split joins the live studio group (no dissolve into it); the dissolve into brand still lands on a placeholder plate until phase 17.

## Card groups, terms and form (src/components/scroll/swap-group.tsx, card-group.tsx, contact-panel.tsx)
- `CARD_GROUPS` (script.ts) holds Plant (3 cards), Tend (3) and Harvest (2), each a Tag, a `display-l` title and a body (TODO copy). Each group is one `right-card` beat in the script: Plant and Tend in the growth scene (730 vh apart by 30), Harvest beside the studio orange. `validateScript` checks 2 to 4 cards, one beat per group and the right column; the test checks Harvest stays clear of the orange.
- `SwapGroup` takes any progress MotionValue: it enters from below at `at`, exits upward at `out` (the next group enters as it leaves), and is hidden outside its range. Cards reveal one after another inside it (titles by character via `SplitReveal`, bodies fade up). Groups sit from 68% across (`data-g`), so they stay clear of a centred subject.
- `ContactPanel` (after the stage, `#contact`, which the "Say hello" pill links to): a `.panel-press` section with a pinned "How we work together" block whose two groups (`data-f`, two paragraphs each) swap with its own scroll progress, then a contact form (`data-k` keys: name, email, "What are you growing?") built from shadcn Input, Textarea, Label and Button, with accessible labels, inline validation (`role="alert"`, `aria-invalid`) and a success state. No backend.

## Scene 08, Orange.io (src/components/scroll/brand-beat.tsx, page-sections.tsx)
- `BRAND` windows (script.ts): the halves part further and the camera pulls back 0.94-0.96, the mark and the "Orange.io" headline begin at 0.97, the tagline at 0.99, the supporting line at 0.993, the CTA at 0.996, and the composition then holds (the beat's fade-out lies beyond the end of the stage; `SplitReveal` has a `hold` mode). All copy is on the `brand` BEATS entry (`tagline`, `lead`, `cta`). The studio group carries brand with no dissolve into it; scrolling up reverses it into the split.
- After the stage, normal flow continues (never trapped): "What we grow" (cream, three cards), "How it works" (clay, three steps), the `--press` panel with the pinned terms block and the contact form, then a `--press` footer with a mono meta line and the brand mark (`src/content/page.ts`, TODO copy). Sections reveal with `SplitReveal` and `whileInView`.
- `PressTheme` makes the fixed chrome follow what is under it: `--press-mix` (which drives `--foreground` and `--background`) is the larger of the deepening studio (while the stage covers the chrome) and every `[data-press]` panel; `--rail-opacity` fades the chapter rail as the stage scrolls away. The CTA "Explore what we do" links to `#what-we-grow`.

## Touch, restoration, deep links, keyboard (src/components/scroll/stage-behaviours.tsx)
- Mobile: below 768px the stage is 70% as tall (`--stage-scale`, pure CSS); progress and the script are unchanged. Cards sit below the subject in one column; the device pixel ratio cap drops to 1.15. Lenis smooths the wheel only (`syncTouch: false`, native touch momentum); nothing locks touch or hijacks scroll.
- Restoration: `history.scrollRestoration = 'manual'`; the position (progress, plus px past the stage) is saved in `sessionStorage`, read before anything resets progress, applied before paint (no flash of the opening) and then through Lenis once layout has settled. Saving starts only after the restore ran.
- Deep links: `/#seed`, `#growth`, `#harvest`, `#inside` scroll to the chapter anchor after layout; the hash follows the active chapter with `replaceState` (no history spam). A hash equal to the saved chapter is treated as our own state, so a reload keeps the exact position; other anchors (`#contact`, `#what-we-grow`) are left to the browser.
- Resize and orientation keep the same progress (phase 3). The stage's sticky layer is hidden while the stage is offscreen, and the canvases only draw on demand, so nothing renders when the tab is hidden or the stage is out of view.
- Keyboard: native keys are untouched; `J` / `K` jump to the next / previous beat (`adjacentBeat`, unit-tested).
