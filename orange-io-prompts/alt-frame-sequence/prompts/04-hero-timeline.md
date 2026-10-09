# Phase 4 of 6: The pinned hero and the scroll timeline

This is phase 4 of 6 in building the scroll-driven hero sequence for the orange.io landing page. Earlier phases created the hero config module, the Lenis and ScrollTrigger smooth-scroll module, and the `FrameCanvas` player (with a dev preview). Check the repo for what exists before you start. If something is missing, create it.

## The story the scroll tells

1. A man and a woman water an orange tree in a golden-hour orchard.
2. The camera pushes in. The woman plucks a ripe orange and holds it up to the camera.
3. The orange is sliced and splits into two halves that drift apart, revealing the headline and call to action between them.

## What to build

A `Hero` component (matching the repo's component style) placed as the first section of the landing page. Use the repo's existing brand colors and fonts if they exist; otherwise choose a restrained palette with a warm dark background. All copy comes from `config.copy` and stays placeholder, marked TODO.

### Structure

- A full-viewport stage that is pinned by ScrollTrigger for `timeline.pinLengthVh` of scroll.
- Inside the stage, stacked layers: the `FrameCanvas`, the whole-orange image, an SVG slice line, the two halves, and the text layer (captions, headline, subline, CTA).
- Placeholder mode: while `useGeneratedPlaceholders` is true, draw the orange as inline SVG (a circle) and the halves as two inline SVG half-circles with a lighter inner face, instead of loading image files. When it is false, use the image paths from the config.

### One master GSAP timeline, scrubbed (`scrub` from config), in these stages

- **0 to 70% (`framesEnd`):** drive `FrameCanvas.setProgress` from 0 to 1. Two short captions fade and slide in and out at set points inside this range.
- **70 to 75% (`crossfadeEnd`):** crossfade from the canvas to the whole-orange layer. Position the orange using `orangePosition` so it lines up with the orange in the last video frame. The background eases to a dark brand tone.
- **75 to 85% (`sliceEnd`):** a thin bright line slices across the orange (animate the SVG stroke with `stroke-dashoffset`), followed by a quick scale pulse of 1 to 1.04 and back to 1.
- **85 to 100% (`splitEnd`):** swap the whole orange for the two halves. They move apart horizontally by `halvesTravelVw` with a slight opposite rotation of `halvesRotateDeg`. As they part, the headline and CTA reveal line by line between them: split the headline with GSAP SplitText into lines, each in an `overflow: hidden` wrapper, animating `yPercent` from 100 to 0 with a small stagger. The subline and CTA fade up after the headline.
- After the pin ends, normal page content continues below.

### Technical rules

- Animate only `transform` and `opacity`.
- Create the timeline inside a `gsap.context()` (or the framework's GSAP integration) and revert it on unmount.
- Register `ScrollTrigger` and `SplitText` in one place.
- Wait for fonts before splitting text (`document.fonts.ready`), and refresh ScrollTrigger afterwards.
- The headline and CTA must be real DOM text. The CTA must be a real, focusable link or button.
- Every timing, offset, and distance comes from the config. No magic numbers in the component.
- Remove the temporary dev-preview slider section from phase 3 once the real hero works (keep the `FrameCanvas` module).

## Verify

The project builds with no console errors. Scroll through the whole sequence in the dev server and confirm each stage happens in order, in placeholder mode, on a wide viewport and on a narrow one.

## Rules

- Do not run git commit. The runner commits after each phase.
- Do not work on reduced-motion handling yet; that is the next phase.
- End with a short summary of the files you created or changed and any value in the config the user should tune once the real assets exist.
