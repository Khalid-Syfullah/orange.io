# What pear.no is built with (observed, for learning only)

Method: loaded the page in a browser and inspected it by hand (a Wappalyzer-style check; the extension itself was not used). Nothing here is copied; Orange.io uses its own code, copy and assets.

## Observed
- **Custom single-page app.** One Vite-style bundle (`/assets/index-*.js`, ~320 KB, hashed) plus one CSS file. The page has React fiber nodes, so it is React.
- **No GSAP, Lenis, ScrollTrigger, Three.js, Framer Motion or Tailwind strings found in the bundle.** The bundle is minified and could hide names, so treat this as "not detected", not "proven absent". The motion looks hand-written.
- **Raw WebGL, not a 3D library.** Four WebGL canvases (full-screen `gl`, plus `fly`, `trans` and `ftx` layers for flying elements, transitions and footer text) and one 2D canvas (`lines`).
- **Video as texture/background.** Two looping muted MP4s (`/films/…`) plus a poster image. Extra model manifests under `/films/model/…`.
- **Native scrolling on one very tall stage.** (Corrected: my first read, taken before the page finished laying out, wrongly said scroll was virtual.) After load, one `section.stage` is about 41,000px tall (about 53 viewport heights). Inside it a fixed stack of layers stays on screen: a persistent WebGL canvas, `trans`, `fly` and `ftx` canvases, a 2D hairline canvas and DOM text. Scroll position becomes a progress value.
- **Design tokens as CSS variables:** near-black `--press`, warm off-white `--paper`, one ink colour, a serif display face and a grotesque text face, a mono face, one easing curve `cubic-bezier(.22,1,.36,1)`, and layout set by percentage/vw columns (`--colA`, `--colB`). Fonts are self-hosted woff2.
- **Small fixed UI chrome:** a side rail nav and a mini nav, over the stage.

## What to take for Orange.io
- Few tokens, used strictly: palette, two typefaces, one shared easing curve, a column grid in percentages.
- One progress value drives every layer; layers are stacked and fixed; text is revealed by progress.
- Media-driven moments (video or canvas) with a poster, loaded lazily.
- Self-host fonts, keep the bundle small, and gate heavy WebGL by device quality.

## What not to copy
- Their art, fonts, copy, shaders and code. Orange.io matches the *scroll system and feel*, not the content.
- Their fonts, copy, logo, films, art and shaders. Those are their assets.

## Orange.io stack decision
| Job | Tool |
| --- | --- |
| UI components, focus, nav | shadcn/ui (Tailwind + Radix) |
| DOM/text motion, hover, reduced-motion | `motion` (Framer Motion), `motion/react` |
| 3D scene | React Three Fiber + drei |
| Scroll smoothing and master timeline | Lenis + GSAP ScrollTrigger writing one 0-1 `MotionValue` |

## Design details observed (measured from the live page)
- **Display type:** a light-weight (300) high-contrast serif at about 56px with -0.02em tracking and about 0.88 line-height; section titles about 26 to 34px, same tracking. Sentence case, one italic accent phrase.
- **Text type:** a neutral grotesque at 13 to 20px; the lead paragraph is a serif at 20px.
- **Mono labels:** a mono face, uppercase, 9 to 12px, weight 500, with tracking 0.04em for metadata and 0.18em for buttons.
- **Buttons:** fully rounded pill, 1px border at 20% white, inset top highlight, mono caps, arrow in a small square chip. **Tags:** 4px radius, 10% white fill, 8px mono caps.
- **Text animation:** headlines are split into per-character spans (hundreds on the page) and revealed in sequence.
- **Hero composition:** one large art-directed image on a flat saturated sky colour, halftone-dot clouds, hairline grid lines with small star-shaped registration marks, tick marks on the left edge, a mark top left, a chapter rail ("Ch. 1 ...") and an "Apply" pill.
- **Colours:** near-black base, warm paper off-white, one ink brown, one saturated sky blue; light-only colour scheme.

## How Orange.io translates this (original, not copied)
Different fonts (Newsreader, Geist, Geist Mono, all free), a warm apricot-to-cream palette with orange as the single accent, original 3D scenes, and its own copy and marks. The techniques kept are: strict tokens, light serif headlines, mono micro-labels, hairline grid with registration marks, per-character reveals, pill buttons, and a chapter rail.

## Scroll choreography (measured by scrolling the live page)
- **Beats, not paragraphs.** Text lives in `.bk` blocks tagged `data-beat` (0, 1, 2, 3). Only one beat per slot is visible at a time; the others sit at opacity 0 and `visibility: hidden`. A hero headline plus lead is beat 0; then single lines ("We build it.", "We rank it.", "We share in what it earns.") each replace the last in the same spot, each with its own paired lead line.
- **Dwell and travel.** At about 3,200 to 5,000px a beat is on screen; from about 6,400px onward long stretches have no text at all while the visuals move (camera dolly into the subject, drifting halftone clouds, a different art scene).
- **Chapters.** The side rail switches label at about 3,000 (The Model), 9,600 (The Work), 17,600 (The Terms) and 25,600 px (Questions).
- **Scene change = dither dissolve.** Between big art scenes the picture breaks apart into scattered pixels (an ordered-dither or noise mask) while the next scene resolves, with a sweep direction.
- **Fly layer.** A separate canvas carries one element across scenes.
- **Camera dolly.** At 1,200px the hero asset is already zoomed far in compared with the hero frame, so scroll maps to a push-in.
- **Chrome persists.** Hairlines with star marks and tick marks stay while scenes change; the hairline canvas fades out after the hero.
- **Right-column cards.** In the middle chapters a Tag, a serif title and a paragraph sit in the right column over the art.

## More scroll findings (second pass)
- **Beat timing.** Beats 1, 2 and 3 each hold for about 1,000px (about 1.3 screens) and are separated by gaps of about 240px; one beat per slot, each replacing the last. The hero beat leaves within the first screen.
- **Chapter anchors are stored as fractions** of the whole stage: `data-at` 0.012, 0.232, 0.400, 0.628. At the measured height those are about 480, 9,350, 16,130 and 25,320px, matching where the rail label actually switches.
- **Segmented progress line.** The rail contains an SVG with 11 path segments, each tagged with the progress range it covers (`data-a`, `data-b`: 0 to 0.103, 0.103 to 0.153, 0.153 to 0.162, ... up to 1.0). Segment lengths are proportional to spans, with short ticks at beat boundaries.
- **Grid lines move.** Hairline parts carry an exit direction (`l`, `r`, `u`, `d`, and corner directions `lu`, `ru`, `ld`, `rd`). On entering the second chapter the vertical lines slide out left and right, the horizontal ones up and down, and the corner crosses travel to the corners and lock there.
- **Card groups.** Right-column groups (`pf-g--fix`, `data-g` 0 to 2) and terms groups (`fin-g`, `data-f` 0 to 1) are fixed in place and swap as scroll advances. The contact form fields carry `data-k` keys.
- **Pointer sheen.** In the hero a rainbow highlight rides on the subject where the pointer is (seen in the screenshot as a small glitch streak).
- **Dither dissolve** between art scenes (second chapter onward shows scattered-pixel breakup mid-transition).
- **Unconfirmed:** at the very bottom of the stage the view showed the hero composition again with the footer layers hidden. I could not tell whether this is a loop or a loading quirk of my scripted scroll.
- **Pacing scale.** The reference stage is about 5,350vh (53 screens). Orange's default is 2400vh, tunable in the script.
