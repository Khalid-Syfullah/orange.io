# orange.io hero: prompt pack

Nineteen phases that build a scroll-driven 3D story in Next.js: a man and woman water an orange tree, it grows and fruits, an orange is plucked, floats, splits into two halves, then the brand is revealed. Your Codex scene prompts are the basis for scene phases 9 to 15, 17 and 19; the other phases are new and set up the design system first, because the fonts and look were off before.

| Folder | What it is |
| --- | --- |
| `prompts/` | The thirteen phases plus a `.commit` message for each |
| `skill/build-hero/` | Option 2: run the same phases as a `/build-hero` skill |
| `reference/pear-stack-notes.md` | What the inspiration site is built with and how it is designed, and what Orange.io takes or avoids |
| `alt-frame-sequence/` | The older, lighter video-frame approach. Not used unless you swap it into `prompts/` |

## The phases

Foundation
1. Project setup, fonts and design system (writes `DESIGN.md`, adds a `/design` preview route)
2. UI kit and site chrome (shadcn pill button and tag, character-split reveal, hairline grid, grain, chapter rail)

Scroll system (the core of the experience)
3. Scroll engine, beats and master timeline (tall native stage, Lenis, one progress value)
4. **Scroll script:** pacing budget in vh per scene, beat table, travel stretches, chapter anchors, a validator and a timeline panel
5. **Scroll progress rail:** segmented SVG progress line, chapter anchors, animated labels
6. **Hairline frame choreography:** grid lines slide to the edges and corner marks lock on chapter changes
7. Scene transitions, fly layer and parallax (dither dissolve, camera dolly, the orange flying across scenes)
8. **Pointer and velocity reactions:** sheen following the pointer, scroll-velocity breathing, light parallax

Scenes
9. Opening scene and hero layout
10. Watering
11. Tree growth
12. Ripening
13. Plucking
14. Floating and rotating orange
15. Split into two halves
16. **Pinned card groups:** swapping right-column cards, a terms block, a contact form inside the stage
17. Brand reveal and the content sections after the stage

Hardening
18. **Touch, mobile, scroll restoration and deep links**
19. Integration, scroll pacing, performance, accessibility and design QA

Each scene phase ends with a "handoff" section saying exactly how it moves into the next idea (dolly, dissolve, or the orange flying across).

## Design system (set in phase 1, enforced in every later phase)

- **Fonts (free):** Newsreader 300 for display, Geist for text, Geist Mono for labels, loaded with `next/font`.
- **Look:** light serif headlines with tight tracking, tiny uppercase mono labels, hairline grid with registration marks, film grain and halftone accents, pill buttons, one orange accent, one shared easing curve.
- **Stack roles:** shadcn/ui for components, `motion` (Framer Motion) for DOM and text animation, React Three Fiber for 3D, GSAP + Lenis only for the scroll timeline.
- **Scroll:** native scrolling with Lenis on top, on one tall stage (2400vh by default, tunable in the scroll script). One progress `MotionValue` drives the 3D scene, transitions and text beats.
- Scene scroll ranges from your original prompts were rescaled to fit the new timeline (opening 0-0.08 ... brand 0.93-1.0).

## Other changes from your prompts

- Filenames are `NN-name.md`, which the runner needs; code fences and headings removed; pear.no references removed.
- Every phase starts by inspecting the repo, extends existing code, and must keep `npm run build` and CI scripts passing.
- With no 3D model files available, characters, tree, water and hand are built in code and are stylized; a `models` config lets real GLB files replace them later.
- Each phase ends with "Do not run git commit", with a nature-header `.commit` message per phase.

## Run it

```bash
cd ~/path/to/orange.io        # the repo root
# copy prompts/ and run-prompts.sh here
chmod +x run-prompts.sh
CHECK_CMD="npm run build" ./run-prompts.sh
```

If auto mode is not available on your plan:

```bash
PERM_MODE=acceptEdits ALLOWED_TOOLS="Bash(npm *),Bash(npx *),Bash(git *)" \
CHECK_CMD="npm run build" ./run-prompts.sh
```

It skips finished phases when re-run; `./run-prompts.sh --reset` starts over. Expect this to be long and costly: thirteen phases of 3D work. Run one phase first with `/build-hero next` (Option 2) to see the quality before committing to all ten.

## Progress and status

While it runs, the terminal shows:

```
================================
Phase 3/6 · 03-frame-canvas
overall [██████████░░░░░░░░░░] 2/6 phases · 33% · elapsed 14m05s · ~28m left
================================
    [0s]   session started · model <model>
    [4s]   #1   Read      package.json
    [12s]  · Now adding the canvas frame player.
    [31s]  #2   Write     src/hero/frame-canvas.ts
    [58s]  … still working (2 step(s) so far, last activity 27s ago)
  ✓ phase 3/6 finished in 6m10s · 41 steps · conversation cost so far ≈ $0.42
```

- Every step Claude Code takes (files read and written, commands run) appears as it happens, with a short progress note now and then.
- If nothing new appears for `HEARTBEAT` seconds (default 30), it prints a "still working" line, so a quiet stretch is not mistaken for a hang.
- The ETA is the average time of the phases finished in this run times the phases left. It appears after the first phase completes, and time spent waiting on usage limits is not counted.
- Cost figures are Claude Code's own client-side estimates. In a shared conversation the number is the conversation's running total, not a per-phase amount.

Follow along from a second terminal:

```bash
./run-prompts.sh --status             # which phases are done / current / pending, plus the live state
watch -n 5 cat logs/status.txt        # the same state file, refreshed
```

Options: `STATUS_LEVEL=quiet` (only phase lines and heartbeats), `STATUS_TEXT=0` (hide Claude's short notes), `HEARTBEAT=60`.

Per-phase logs in `logs/`: `<phase>.stream.jsonl` (full event log), `<phase>.json` (final result), `<phase>.txt` (Claude's final message), `<phase>.check.log` (build check output).

## Usage limits

Interactive Claude Code waits out a usage limit by itself, but a scripted `claude -p` run does not, so the runner does it:

1. It detects "You've hit your session limit · resets 3:45pm" (also weekly and per-model limits).
2. It pauses, shows `PAUSED: usage limit, resumes <time>` in the terminal and in `logs/status.txt`, and sleeps until the reset time plus 2 minutes.
3. It re-sends the interrupted task in the same conversation, with a note telling Claude to check what already exists and finish only what remains.

Good to know:
- Reading the reset time needs GNU `date`. On macOS run `brew install coreutils` (it provides `gdate`). Without it, the runner rechecks every 15 minutes (`LIMIT_POLL`).
- Keep the computer awake while it waits (`caffeinate -i ./run-prompts.sh` on macOS), or run it on a server.
- A reset more than `MAX_WAIT_HOURS` (default 24) away, such as a weekly limit, stops the run cleanly. Run it again after the reset; finished phases are skipped.
- A spend limit or empty credit balance is not waited out. It stops immediately and tells you to raise the limit.
- `WAIT_ON_LIMIT=0` stops on any usage limit instead of waiting.

## Commit messages

After each finished phase the runner commits with a plain header and a description, for example:

```
feat(scroll): add smooth scrolling synced with ScrollTrigger

Add a Lenis smooth-scroll module driven by the GSAP ticker, with
reduced-motion handling and anchor links routed through the scroller.
```

- The message for each phase lives next to its prompt, in `prompts/<phase>.commit` (header on the first line, blank line, then the description). Edit them freely.
- If a phase has no `.commit` file, the runner falls back to `chore: <phase name>` with a one-line description.
- The commits are made with your own git identity and carry no tool name or co-author trailer.
- Claude Code does not commit during these phases (each prompt says so). If you ever let it commit in an interactive session, it may add its own attribution trailer. To turn that off, put this in `.claude/settings.json` (or `~/.claude/settings.json`) and check the next commit to confirm:

```json
{
  "attribution": { "commit": "", "pr": "" }
}
```

## Option 2: run it as a skill (`/build-hero`)

The same six phases, run from inside an interactive Claude Code session instead of the shell script.

**Install** (from the orange.io repo root):

```bash
mkdir -p .claude/skills && cp -r skill/build-hero .claude/skills/
chmod +x .claude/skills/build-hero/scripts/phase.sh
# prompts/ must also be in the repo root. Optional: cp .claude/skills/build-hero/config.env.example .claude/skills/build-hero/config.env
```

**Use:**

| Command | What it does |
| --- | --- |
| `/build-hero` | Runs every unfinished phase in order |
| `/build-hero next` | Runs one phase, then stops |
| `/build-hero status` | Shows the phase table and overall progress |
| `/build-hero reset` | Clears progress (asks first) |

**Hands-off run** (start Claude Code in auto mode):

```
/goal Use the build-hero skill to finish every phase. Done when running .claude/skills/build-hero/scripts/phase.sh status prints ALL PHASES COMPLETE. Or stop after 40 turns.
```

**How the script's features map over**

| `run-prompts.sh` | Skill |
| --- | --- |
| Sequential phases | `phase.sh next` decides the order |
| Skip finished / resume | `logs/<phase>.done` markers; a re-run continues at the first unfinished phase |
| Build check + fix loop | `phase.sh check` (stops after `MAX_FIX` failures); `finish` refuses until it passes |
| Commit per phase | `phase.sh finish` uses `prompts/<phase>.commit`; prompts, `.claude/` and `logs/` are left out |
| Live progress | Banner with bar, % and ETA, `logs/status.txt`, Claude's task list |
| Pause at usage limit | Interactive Claude Code waits and continues by itself; `/goal` keeps the run going afterwards |

**Caveats**
- `phase.sh` is tested (order, check gate, commits, status, reset). The skill itself is not tested in a live Claude Code session.
- The session must stay open. `claude -p` does not wait out limits, so for unattended runs use `run-prompts.sh`.
- All phases share one conversation. For fresh context, `/clear` then `/build-hero next` (`/clear` also removes an active `/goal`).
