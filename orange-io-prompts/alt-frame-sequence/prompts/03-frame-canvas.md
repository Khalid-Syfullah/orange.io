# Phase 3 of 6: Canvas frame-sequence player

This is phase 3 of 6 in building the scroll-driven hero sequence for the orange.io landing page. Earlier phases created the hero config module (`frames`, `useGeneratedPlaceholders`, and related fields) and the smooth-scroll module. Check the repo for what exists before you start. If something is missing, create it.

## What to build

A reusable frame-sequence player that draws a numbered image sequence onto a `<canvas>`, so a later phase can scrub it with scroll. It must not use a `<video>` element.

### API

Create a `FrameCanvas` module (class or factory, matching the repo's style) with:

- `mount(canvasElement)`, `destroy()`
- `setProgress(p)`, where `p` is 0 to 1 and maps to a frame index
- `ready` state or promise for the first frame
- a way to read the current frame index and the total frame count

### Behavior

1. **Sizing:** the canvas fills its container. Account for `devicePixelRatio` (cap it at 2) and redraw on resize using a `ResizeObserver`.
2. **Drawing:** use object-fit: cover math so the image fills the canvas with no stretching. Draw only when the frame index actually changes (or on resize), never every tick.
3. **Source selection:** choose the desktop or mobile frame set at load time with `matchMedia` (mobile frames when the viewport is 768px wide or less, or portrait). The paths, count, padding, and extension come from the config. File names look like `0001.webp`.
4. **Progressive loading:** load frame 1 immediately and draw it as soon as it arrives. Then load a spread of evenly spaced frames first (for example every 10th), then fill in the rest. While scrubbing, always draw the nearest frame that has loaded, so scrubbing works early. Limit concurrent requests to about 6.
5. **Placeholder mode:** while `useGeneratedPlaceholders` is true in the config, do not request any files. Instead generate each frame procedurally on the canvas: a warm golden-hour gradient background, a simple tree silhouette with orange dots, and the frame number in a corner. This lets everything be tested before the real video frames exist, and produces no 404 errors in the console.
6. **Cleanup:** `destroy()` cancels pending loads, disconnects the observer, and releases image references.

### Dev preview

Add a temporary route or section (named clearly as a dev preview, easy to delete) containing the canvas and a plain range slider from 0 to 1 that calls `setProgress`. Use it to check that the frames change smoothly.

## Verify

The project builds, there are no console errors, and dragging the slider steps through the placeholder frames on both a wide and a narrow viewport.

## Rules

- Do not run git commit. The runner commits after each phase.
- Do not add ScrollTrigger or the pinned hero yet.
- End with a short summary of the files you created or changed.
