# Phase 6 of 6: Performance pass, QA, and documentation

This is the final phase of building the scroll-driven hero sequence for the orange.io landing page. Earlier phases built the hero config, Lenis smooth scrolling, the `FrameCanvas` player, the pinned `Hero` timeline, and the accessibility behavior. Check the repo for what exists before you start.

## What to do

1. **Performance review.** Read through the hero code and fix anything that does avoidable work:
   - Nothing is drawn to the canvas unless the frame index changed.
   - Only `transform` and `opacity` are animated; no layout-triggering properties.
   - No listeners, observers, tickers, or ScrollTriggers leak after unmount. Add a quick test or a documented manual check for this.
   - `will-change` is used only where it helps and removed when the animation is done.
   - Frame loading is progressive and capped in concurrency.
   - GSAP, Lenis, and SplitText are not loaded in a way that blocks the first paint more than necessary. If the framework supports it, load the hero's scroll code after first paint.
2. **Responsive QA.** Run the dev server (or a production preview) and check the sequence at 1440x900 and 390x844. If a headless browser such as Playwright can be installed in this environment, use it: scroll through the page in steps, take screenshots at roughly 0%, 35%, 70%, 80%, and 100% of the pin, and check the browser console for errors. If you cannot run a browser here, say so plainly and list exactly what the user should check by hand.
3. **Lighthouse.** If Lighthouse can be run here, run it for mobile and report the performance score and the main findings. The target is 85 or higher on mobile. Fix what is within the hero's control. If it cannot be run, say so.
4. **Documentation.** Add a README section (or a `docs/hero.md`) titled "Hero scroll sequence" that explains, briefly and concretely:
   - What the hero does and which files make it up.
   - How to replace the placeholders with real assets: the frame sequence folders and naming (`public/frames/desktop/0001.webp` and so on), the three cutout images, and then setting `useGeneratedPlaceholders` to `false` and updating `frames.count`.
   - How to line the whole-orange cutout up with the last video frame using `orangePosition`, and how to tune every timing in the config.
   - The ffmpeg and background-removal commands used to produce frames and cutouts (these are in `asset-prompts/03-process-assets.md` if that file is present; otherwise write sensible equivalents).
   - How reduced-motion and no-JS behavior work.
   - A list of every placeholder copy string marked TODO.
5. Run the production build once more and confirm it passes.

## Rules

- Do not run git commit. The runner commits after each phase.
- Do not invent test results. Report what you actually ran and what you could not.
- End with a short summary: what you fixed, what the QA found, what the user must still do by hand.
