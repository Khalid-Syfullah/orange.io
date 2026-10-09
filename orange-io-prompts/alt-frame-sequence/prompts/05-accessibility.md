# Phase 5 of 6: Accessibility, reduced motion, and no-JS fallback

This is phase 5 of 6 in building the scroll-driven hero sequence for the orange.io landing page. Earlier phases built the hero config, Lenis smooth scrolling, the `FrameCanvas` player, and the pinned `Hero` with its master timeline. Check the repo for what exists before you start.

## What to do

1. **Reduced motion.** When `prefers-reduced-motion: reduce` is set:
   - Lenis is not initialized (native scrolling).
   - The hero is not pinned and nothing is scrubbed.
   - Show the final composition statically: the two orange halves apart with the headline, subline, and CTA visible between them.
   - Listen for the preference changing while the page is open and switch modes cleanly, without a reload. Kill the timeline and ScrollTriggers when switching to reduced motion, and rebuild them when switching back.
2. **Semantics.**
   - The canvas and every decorative image or SVG is `aria-hidden="true"`.
   - The headline is a real heading at the right level for the page, the CTA is a real link or button, and the DOM order matches the visual reading order.
   - The captions are real text. If they appear and disappear during the scroll, they must not leave stale, hidden-but-focusable content behind.
3. **No-JavaScript fallback.** Make sure that without JS the page shows the final composition (halves, headline, CTA) rather than an empty dark stage. The initial DOM and CSS should represent the end state, and the JS adds the animated starting state when it boots.
4. **Keyboard and focus.** Tabbing reaches the CTA, focus styles are visible, and keyboard scrolling (arrows, space, page up and down, home and end) works with Lenis active. In-page anchors still go through `lenis.scrollTo`, and a user who lands on `#something` below the hero is not stuck.
5. **Contrast.** Check that the headline, subline, and CTA meet WCAG AA contrast against the background they appear on, and fix any that do not.

## Verify

The project builds with no console errors. Test with reduced motion emulated on (browser devtools or a Playwright `reducedMotion: "reduce"` context if available) and with JavaScript disabled, and confirm the final composition shows in both. If you cannot run a browser here, say so plainly and describe how to check.

## Rules

- Do not run git commit. The runner commits after each phase.
- End with a short summary of the files you changed and what you verified versus what still needs a manual check.
