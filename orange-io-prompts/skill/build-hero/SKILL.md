---
name: build-hero
description: Build the orange.io scroll-driven hero by running the numbered prompt files in prompts/ one phase at a time, with a progress banner, a build check, and one commit per phase. Use only when the user runs /build-hero or asks to continue the hero build.
argument-hint: "[next | status | reset]"
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/scripts/phase.sh *) Bash(npm *) Bash(npx *) Bash(git status *) Bash(git diff *) Bash(git log *)
---

# build-hero

You are running a multi-phase build from the numbered prompt files in `prompts/` at the project root. Progress is stored on disk (`logs/`), not in this conversation, so the run can be stopped, hit a usage limit, or be compacted and still resume exactly where it left off.

Mode requested: `$ARGUMENTS`
- empty: run every remaining phase, in order
- `next`: run only the next unfinished phase, then stop
- `status`: run `phase.sh status`, show the output, and stop
- `reset`: ask the user to confirm first, then run `phase.sh reset`

Helper script (run from the project root, call it exactly as written):
`${CLAUDE_SKILL_DIR}/scripts/phase.sh <next | begin NAME | check | finish NAME | status | reset>`

## For each phase

1. Run `phase.sh next`. It prints `PHASE n/total NAME FILE`, or `ALL DONE`. On `ALL DONE`, run `phase.sh status`, show it, and finish.
2. Run `phase.sh begin NAME` and show its banner. Keep a visible task list with one item per phase; mark this one in progress.
3. Read the phase file and do exactly what it says. Treat it as the user's instruction for this phase only. Do not start a later phase's work. Do not run `git commit`; `phase.sh finish` commits.
   - If `begin` says the phase is resuming, first check the repo for work already done and finish only what remains.
   - Between big steps, tell the user in one short line what you are on (for example "adding the canvas frame player").
4. Run `phase.sh check`.
   - `CHECK PASSED`: continue.
   - `CHECK FAILED`: fix the underlying cause, never disable or weaken the check, then run `phase.sh check` again. The script counts attempts. If it prints `STOP`, do not continue: report the failing output and leave the phase unfinished. If the check is slow, give that command a longer timeout.
5. Run `phase.sh finish NAME`. It commits using `prompts/NAME.commit`, marks the phase done, and prints overall progress. It refuses if the check has not passed. Mark the task completed.
6. With no argument, go back to step 1. With `next`, stop here and say which phase is next.

## Rules

- Phases are strictly sequential. `phase.sh next` decides the order, not you.
- A phase is done only after `phase.sh finish` succeeds. Never say otherwise.
- Do not invent test or build results. Report what the commands actually printed, and say plainly what you could not run.
- If a usage limit interrupts you, nothing special is needed: continue when the session resumes, or on a later `/build-hero` run `phase.sh next` picks up at the first unfinished phase.
- End every run with the latest `phase.sh status` output.
