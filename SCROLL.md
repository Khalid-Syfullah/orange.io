# Orange.io scroll script

The choreography every phase follows. The data lives in `src/scroll/script.ts` (this file is the same content in prose); `src/lib/timeline.ts` adds helpers (`sceneProgress`, `currentScene`, `currentChapter`, `vh`). Change numbers in the script, never in components. `npm test` runs `validateScript()`, and the dev server runs it at startup and in the dev overlay.

**Units.** "vh" here is nominal stage vh: `progress x STAGE_VH`. Real scroll travel is `STAGE_VH - 100` viewport heights, because the last screen is the sticky viewport itself.

## Method (copied as a technique, not as content)
- The stage is long and mostly *travel*, not text. A beat holds for about 1 to 1.3 screens (100 to 130vh), then a short gap (25 to 40vh) before the next beat replaces it in the same spot. One beat per slot at a time.
- The hero beat leaves within the first screen (out by 60vh) so the scene can start moving.
- Chapters are anchored at fixed fractions of the stage and the rail label switches exactly there.

## Stage
`STAGE_VH = 2400` (24 screens). Exported from the script, rendered as `2400svh` on the stage section.

## Pacing budget
Derived from the `SCENES` fractions (not typed twice), rounded so the total is exact.

| Scene | Range | Budget (vh) | Starts at (vh) |
| --- | --- | --- | --- |
| opening | 0.00 to 0.08 | 192 | 0 |
| watering | 0.08 to 0.22 | 336 | 192 |
| growth | 0.22 to 0.42 | 480 | 528 |
| ripening | 0.42 to 0.56 | 336 | 1008 |
| plucking | 0.56 to 0.68 | 288 | 1344 |
| floating | 0.68 to 0.80 | 288 | 1632 |
| split | 0.80 to 0.93 | 312 | 1920 |
| brand | 0.93 to 1.00 | 168 | 2232 |

The brief's round numbers (190, 335, 480, 335, 290, 290, 310, 170) sum to 2400 too; the derived numbers differ by at most 2vh because they follow the scene fractions exactly.

## Beat table
Slots: `hero` (big line at the start and end), `left-line` (headline + lead, left column), `right-card` (Tag, title, paragraph in the right column). All copy is TODO placeholder.

| id | slot | scene | in (vh) | out (vh) | dwell | at / out (progress) | Tag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hero | hero | opening | 2 | 58 | 56 (exempt, out by 60) | 0.0008 / 0.0242 | no |
| plant | left-line | watering | 212 | 312 | 100 | 0.0883 / 0.1300 | no |
| tend | left-line | watering | 342 | 442 | 100 | 0.1425 / 0.1842 | no |
| wait | left-line | growth | 553 | 663 | 110 | 0.2304 / 0.2762 | no |
| grow | left-line | ripening | 1038 | 1148 | 110 | 0.4325 / 0.4783 | no |
| pick | left-line | plucking | 1369 | 1469 | 100 | 0.5704 / 0.6121 | no |
| floating-card | right-card | floating | 1672 | 1792 | 120 | 0.6967 / 0.7467 | yes |
| inside | left-line | split | 1950 | 2070 | 120 | 0.8125 / 0.8625 | no |
| brand | hero | brand | 2294 | 2400 (holds to end) | 106 | 0.9558 / end | no |

Rules enforced by `validateScript()`: dwell 100 to 130vh (hero excepted, out by 60vh); no overlap inside a slot; gap of at least 25vh between consecutive beats of a slot, and at most 40vh when they share a scene (the plant to tend gap is 30vh); beats stay inside their scene; scenes tile 0 to 1 and the pacing sums to `STAGE_VH`; every scene has a beat-free travel stretch of at least 60vh.

## Travel table
Beat-free stretches (stage vh) and what moves in them, so nothing is dead. The long stretch in each scene (60vh or more) is marked.

| Scene | Stretches (vh) | What moves |
| --- | --- | --- |
| opening | 0-2, **58-192 (134)** | slow camera dolly toward the tree; halftone clouds drift; light warms from apricot |
| watering | 192-212, 312-342, **442-528 (86)** | water arcs from the can into the soil; soil darkens; a sprout rises |
| growth | 528-553, **663-1008 (345)** | trunk and canopy grow; camera dollies up the trunk; clouds drift |
| ripening | 1008-1038, **1148-1344 (196)** | blossoms turn to green then orange fruit; camera pushes toward one branch |
| plucking | 1344-1369, **1469-1632 (163)** | a hand reaches and plucks the fruit; the fruit flies across the transition |
| floating | 1632-1672, **1792-1920 (128)** | the orange floats and rotates; camera orbits; dither dissolve into the next scene |
| split | 1920-1950, **2070-2232 (162)** | the orange opens into two halves; halves drift apart; camera dollies into the interior |
| brand | **2232-2294 (62)** | halves settle on the press-dark panel; wordmark and mark resolve |

## Chapter anchors
Used by the rail and `lenis.scrollTo`. The active label switches at the start of each range.

| Chapter | Anchor (`at`) | Active from |
| --- | --- | --- |
| Ch. 1 The Seed | 0.012 | 0.00 |
| Ch. 2 The Growth | 0.22 | 0.22 |
| Ch. 3 The Harvest | 0.56 | 0.56 |
| Ch. 4 The Inside | 0.80 | 0.80 |

## Dev panel
In dev builds the overlay draws the script as a horizontal timeline: scenes, chapter anchors, one row per slot, travel stretches (green when 60vh or more), and a playhead. Click it to seek. Keys 1 to 8 jump to scene starts, `h` hides the panel.

## Frame states
Per-scene hairline frame state (`FRAME` in the script; transition length `FRAME_TRANSITION_VH` = 40vh, scrubbed):

| Scene | State | Notes |
| --- | --- | --- |
| opening | hero | lines in the grid, crosses at intersections |
| watering | open | opens from 100vh (after the first screen), done by 140vh |
| growth, ripening, plucking, floating | open | lines at the screen edges, crosses in the corners |
| split | open + lock | vertical lines pulled in to 32% / 68% to frame the two halves |
| brand | closed | parts exit along `data-out` and fade |

Registration marks pulse (1 to 1.4 to 1) within 18vh of each beat in/out point.

## Dissolve windows
Each scene change dissolves (except into watering, growth, ripening, plucking and split, where the same world simply continues under a slow camera dolly) over the 45vh before the scene starts (`TRANSITION_VH`), so the new scene is fully resolved exactly at its start. `validateScript()` rejects any beat that overlaps a window.

| Boundary | Window (vh) |
| --- | --- |
| plucking to floating | 1587 to 1632 (the orange travels hand to center here) |
