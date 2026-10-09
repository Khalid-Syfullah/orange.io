#!/usr/bin/env bash
# run-prompts.sh — run prompts/NN*.md through Claude Code one after another.
#
#   ./run-prompts.sh            run (or resume) the sequence
#   ./run-prompts.sh --status   show finished / current / pending phases and what is happening now
#   ./run-prompts.sh --reset    forget progress and session, start from 01
#
# What you see while it runs:
#   - a header per phase with an overall progress bar, elapsed time and an ETA
#   - a live line for every step Claude Code takes (files read/edited, commands run, short notes)
#   - a "still working" heartbeat when nothing new has appeared for a while
#   - logs/status.txt, rewritten continuously, so you can follow along from another terminal:
#         watch -n 5 cat logs/status.txt        or        ./run-prompts.sh --status
#
# Settings (environment variables, all optional):
#   PERM_MODE=auto              auto | acceptEdits | dontAsk
#   ALLOWED_TOOLS=""            e.g. "Bash(npm *),Bash(npx *),Bash(git *)"
#                               (needed with acceptEdits; auto mode judges commands itself)
#   CHECK_CMD=""                gate run after each phase, e.g. "npm run build"
#   MAX_FIX=2                   how many times Claude may try to fix a failing check
#   MAX_RETRY=2                 retries when a claude call itself fails (network, overload)
#   RETRY_WAIT=60               seconds between those retries
#   FRESH=0                     1 = every phase starts a new conversation (no shared context)
#   GIT_COMMIT=1                commit after each finished phase (when inside a git repo)
#   PROMPT_DIR=prompts  LOG_DIR=logs  SESSION_FILE=.claude-sequence-session
#
# Status display:
#   STATUS_LEVEL=steps          steps = print every step | quiet = only phase lines and heartbeats
#   STATUS_TEXT=1               also show Claude's short progress notes (1 = yes, 0 = no)
#   HEARTBEAT=30                seconds of silence before a "still working" line
#
# Usage limits (session / weekly / per-model):
#   When Claude Code reports "You've hit your ... limit · resets <time>", the script pauses,
#   sleeps until that reset time (plus a small buffer), then re-sends the interrupted task
#   with a note to finish only what remains. Spend limits are NOT waited out: they need you
#   to raise the limit, so the script stops and says so.
#   WAIT_ON_LIMIT=1             0 = stop on a usage limit instead of waiting
#   RESET_BUFFER=120            extra seconds to wait after the stated reset time
#   LIMIT_POLL=900              fallback: if the reset time can't be read, retry every N seconds
#   MAX_WAIT_HOURS=24           refuse to wait longer than this for one reset (e.g. a weekly limit)
#   MAX_LIMIT_WAITS=8           give up after this many limit waits in a single call
#   Tip: keep the computer awake while it waits (macOS: caffeinate -i ./run-prompts.sh).
#   Progress is saved, so you can also stop it and run it again later; finished phases are skipped.

set -euo pipefail

PROMPT_DIR="${PROMPT_DIR:-prompts}"
LOG_DIR="${LOG_DIR:-logs}"
SESSION_FILE="${SESSION_FILE:-.claude-sequence-session}"
PERM_MODE="${PERM_MODE:-auto}"
ALLOWED_TOOLS="${ALLOWED_TOOLS:-}"
CHECK_CMD="${CHECK_CMD:-}"
MAX_FIX="${MAX_FIX:-2}"
MAX_RETRY="${MAX_RETRY:-2}"
RETRY_WAIT="${RETRY_WAIT:-60}"
FRESH="${FRESH:-0}"
GIT_COMMIT="${GIT_COMMIT:-1}"
WAIT_ON_LIMIT="${WAIT_ON_LIMIT:-1}"
RESET_BUFFER="${RESET_BUFFER:-120}"
LIMIT_POLL="${LIMIT_POLL:-900}"
MAX_WAIT_HOURS="${MAX_WAIT_HOURS:-24}"
MAX_LIMIT_WAITS="${MAX_LIMIT_WAITS:-8}"
STATUS_LEVEL="${STATUS_LEVEL:-steps}"
STATUS_TEXT="${STATUS_TEXT:-1}"
HEARTBEAT="${HEARTBEAT:-30}"
STATUS_FILE="$LOG_DIR/status.txt"

# GNU date is needed to read "resets 3:45pm". macOS ships BSD date; use gdate if installed.
DATE_BIN="date"
command -v gdate >/dev/null 2>&1 && DATE_BIN="gdate"

now() { "$DATE_BIN" +%s; }

# ---------- progress display ----------

PHASE_TOTAL=0 PHASES_DONE=0 PHASE_INDEX=0 PHASE_NAME="" PHASE_START=0 PHASE_WAIT=0
RUN_START="$(now)" MEASURED_N=0 MEASURED_SECS=0 STATE="starting" LAST_STEP="-"

fmt_dur() {
  local s="${1:-0}"; (( s < 0 )) && s=0
  if   (( s >= 3600 )); then printf '%dh%02dm' $((s / 3600)) $((s % 3600 / 60))
  elif (( s >= 60 ));   then printf '%dm%02ds' $((s / 60)) $((s % 60))
  else printf '%ds' "$s"; fi
}

bar() {   # bar <done> <total>
  local n="$1" total="$2" w=20 f i out=""
  f=$(( total > 0 ? n * w / total : 0 ))
  for (( i = 0; i < w; i++ )); do if (( i < f )); then out+="█"; else out+="░"; fi; done
  printf '%s' "$out"
}

eta_text() {
  local remaining=$(( PHASE_TOTAL - PHASES_DONE ))
  if   (( remaining <= 0 )); then printf 'finished'
  elif (( MEASURED_N > 0 )); then printf '~%s left' "$(fmt_dur $(( MEASURED_SECS / MEASURED_N * remaining )))"
  else printf 'estimating'; fi
}

overall_line() {
  local pct=$(( PHASE_TOTAL > 0 ? PHASES_DONE * 100 / PHASE_TOTAL : 0 ))
  printf 'overall [%s] %d/%d phases · %d%% · elapsed %s · %s' \
    "$(bar "$PHASES_DONE" "$PHASE_TOTAL")" "$PHASES_DONE" "$PHASE_TOTAL" "$pct" \
    "$(fmt_dur $(( $(now) - RUN_START )))" "$(eta_text)"
}

# write_status "<state>" ["<last step>"]  -> logs/status.txt (replaced atomically)
write_status() {
  STATE="$1"; [[ $# -gt 1 ]] && LAST_STEP="$2"
  local tmp="$STATUS_FILE.tmp"
  {
    echo "phase:      ${PHASE_INDEX}/${PHASE_TOTAL} ${PHASE_NAME}"
    echo "state:      ${STATE}"
    echo "last step:  ${LAST_STEP}"
    echo "phase time: $(fmt_dur $(( $(now) - PHASE_START )))"
    echo "$(overall_line)"
    echo "updated:    $(date '+%F %T')"
  } >"$tmp" 2>/dev/null && mv "$tmp" "$STATUS_FILE" || true
}

# Turns Claude Code's event stream into short lines: SID / INFO / TOOL / TEXT.
read -r -d '' JQ_STATUS <<'JQ' || true
fromjson? | select(type == "object") |
if (.type == "system" and .subtype == "init") then
  (if ((.session_id // "") != "") then "SID\t" + .session_id else empty end),
  ("INFO\tsession started · model " + (.model // "?"))
elif (.type == "system" and .subtype == "api_retry") then
  "INFO\tAPI retry \(.attempt // "?")/\(.max_retries // "?") (\(.error // "error"))"
elif .type == "assistant" then
  ((.message.content // [])[]? |
    if .type == "tool_use" then
      "TOOL\t\(.name)\t" + (((.input.file_path // .input.path // .input.command // .input.pattern // .input.url // .input.description // .input.subject // "") | tostring) | gsub("[\n\t]"; " ") | .[0:90])
    elif (.type == "text" and ((.text // "") | length) > 0) then
      "TEXT\t" + (.text | gsub("[\n\t]"; " ") | .[0:120])
    else empty end)
else empty end
JQ

# Reads Claude Code's stream-json on stdin, prints live status lines.
stream_status() {
  local start last_event line kind rest name detail n=0 rc t
  start="$(now)"; last_event="$start"
  jq -Rr --unbuffered "$JQ_STATUS" 2>/dev/null | while true; do
    if IFS= read -r -t "$HEARTBEAT" line; then
      last_event="$(now)"; t="$(fmt_dur $(( last_event - start )))"
      kind="${line%%$'\t'*}"; rest="${line#*$'\t'}"
      case "$kind" in
        SID)  [[ "$FRESH" == 1 ]] || printf '%s\n' "$rest" >"$SESSION_FILE" ;;
        INFO) printf '    [%s] %s\n' "$t" "$rest" ;;
        TOOL) n=$((n + 1)); name="${rest%%$'\t'*}"; detail="${rest#*$'\t'}"
              [[ "$STATUS_LEVEL" == quiet ]] || printf '    [%s] #%-3d %-9s %s\n' "$t" "$n" "$name" "$detail"
              write_status "working" "#$n $name $detail" ;;
        TEXT) if [[ "$STATUS_TEXT" == 1 && "$STATUS_LEVEL" != quiet ]]; then printf '    [%s] · %s\n' "$t" "$rest"; fi ;;
      esac
    else
      rc=$?
      if (( rc > 128 )); then
        t="$(fmt_dur $(( $(now) - start )))"
        printf '    [%s] … still working (%s step(s) so far, last activity %s ago)\n' "$t" "$n" "$(fmt_dur $(( $(now) - last_event )))"
        write_status "working (no new output for $(fmt_dur $(( $(now) - last_event ))))"
      else
        break
      fi
    fi
  done
}

# ---------- --status / --reset ----------

if [[ "${1:-}" == "--status" ]]; then
  shopt -s nullglob
  cur="$(awk '/^phase:/ {print $3}' "$STATUS_FILE" 2>/dev/null || true)"
  for f in "$PROMPT_DIR"/[0-9][0-9]*.md; do
    p="$(basename "$f" .md)"
    if   [[ -f "$LOG_DIR/$p.done" ]]; then echo "  ✓ $p"
    elif [[ "$p" == "$cur" ]];        then echo "  → $p"
    else echo "  · $p"; fi
  done
  echo
  if [[ -f "$STATUS_FILE" ]]; then cat "$STATUS_FILE"; else echo "(no run recorded yet)"; fi
  exit 0
fi

command -v claude >/dev/null || { echo "claude CLI not found on PATH"; exit 1; }
command -v jq     >/dev/null || { echo "jq is required"; exit 1; }

mkdir -p "$LOG_DIR"

if [[ "${1:-}" == "--reset" ]]; then
  rm -f "$LOG_DIR"/*.done "$STATUS_FILE" "$SESSION_FILE"
  echo "Progress and session cleared."
  shift
fi

SESSION_ID=""
if [[ "$FRESH" != 1 && -f "$SESSION_FILE" ]]; then
  SESSION_ID="$(cat "$SESSION_FILE")"
fi

# ---------- usage-limit handling ----------

# Text Claude Code produced for this call (result + stderr + the tail of the event stream).
call_text() {
  { jq -r '.result // empty' "$1" 2>/dev/null || true
    cat "${1%.json}.err" 2>/dev/null || true
    tail -n 5 "${1%.json}.stream.jsonl" 2>/dev/null || true; }
}

# True when the call stopped on a usage limit that waiting can fix.
# Matches e.g. "You've hit your session limit · resets 3:45pm" (also weekly / Opus / Sonnet).
# A spend limit ("raise it at claude.ai/settings/usage") needs you, not time, so it is excluded.
# $2 = "strict" anchors the match to the start of the result (used on calls that looked successful,
#      so a normal answer that merely mentions limits is never mistaken for one).
hit_usage_limit() {
  local out="$1" mode="${2:-loose}" text
  if [[ "$mode" == strict ]]; then
    text="$(jq -r '.result // empty' "$out" 2>/dev/null | head -n 3 || true)"
    grep -Eiq "^[[:space:]]*you.?ve hit your [a-z ]*limit" <<<"$text" || return 1
  else
    text="$(call_text "$out")"
    grep -Eiq "hit your [a-z ]*limit|session limit|usage limit" <<<"$text" || return 1
  fi
  # spend limits: only waitable if the text also names a reset time
  if grep -Eiq "spend limit|credit balance|raise it at" <<<"$text" \
     && ! grep -Eiq "resets" <<<"$text"; then
    return 1
  fi
  return 0
}

# Is this a spend/credit limit that waiting will not fix?
hit_spend_limit() {
  local text; text="$(call_text "$1")"
  grep -Eiq "spend limit|credit balance|raise it at" <<<"$text" \
    && ! grep -Eiq "resets" <<<"$text"
}

# Epoch seconds of the reset time named in the message, or nothing if it can't be read.
# Handles "resets 3:45pm" and "resets Mon 12:00am" (local time, as Claude Code prints it).
parse_reset_epoch() {
  local text token now_s ts
  text="$(call_text "$1")"
  token="$(grep -oiE "resets? +(on +)?([A-Za-z]{3,9},? +)?[0-9]{1,2}(:[0-9]{2})? *(am|pm)" <<<"$text" | head -n 1 \
           | sed -E 's/^resets? +(on +)?//I')" || true
  [[ -n "$token" ]] || return 0
  ts="$("$DATE_BIN" -d "$token" +%s 2>/dev/null)" || return 0
  now_s="$(now)"
  if (( ts <= now_s )); then
    if grep -Eiq "^[A-Za-z]{3,9}" <<<"$token"; then ts=$((ts + 604800)); else ts=$((ts + 86400)); fi
  fi
  printf '%s' "$ts"
}

# Sleep until the epoch time (wall clock, so it stays correct if the computer sleeps meanwhile).
# $2 = state text shown in logs/status.txt while waiting.
sleep_until() {
  local target="$1" label="$2" now_s left last_print=0
  while true; do
    now_s="$(now)"; left=$((target - now_s))
    (( left > 0 )) || return 0
    write_status "$label (about $(( (left + 59) / 60 )) min left)"
    if (( now_s - last_print >= 600 )); then
      echo "  ... waiting, about $(( (left + 59) / 60 )) min left"; last_print=$now_s
    fi
    sleep $(( left < 30 ? left : 30 ))
  done
}

# Pause until the limit resets. Returns 1 if the script should stop instead.
wait_for_limit_reset() {
  local out="$1" ts now_s secs w0 until_txt
  if hit_spend_limit "$out"; then
    echo "  ✗ spend limit reached. Waiting won't fix this: raise it at claude.ai/settings/usage, then run the script again."
    return 1
  fi
  if [[ "$WAIT_ON_LIMIT" != 1 ]]; then
    echo "  ✗ usage limit reached (WAIT_ON_LIMIT=0). Run the script again after it resets; finished phases are skipped."
    return 1
  fi
  echo "  ⏸ usage limit reached: $(call_text "$out" | head -n 1 | head -c 200)"
  w0="$(now)"
  ts="$(parse_reset_epoch "$out")"
  if [[ -n "$ts" ]]; then
    now_s="$(now)"; secs=$((ts - now_s + RESET_BUFFER))
    if (( secs > MAX_WAIT_HOURS * 3600 )); then
      echo "  ✗ reset is more than ${MAX_WAIT_HOURS}h away. Stopping; run the script again after it resets (progress is saved)."
      return 1
    fi
    until_txt="$("$DATE_BIN" -d "@$((ts + RESET_BUFFER))" '+%a %H:%M')"
    echo "  ⏸ pausing until $until_txt (~$(( (secs + 59) / 60 )) min), then continuing this task"
    sleep_until $((ts + RESET_BUFFER)) "PAUSED: usage limit, resumes $until_txt"
  else
    echo "  ⏸ couldn't read the reset time; checking again in ${LIMIT_POLL}s"
    sleep_until $(( $(now) + LIMIT_POLL )) "PAUSED: usage limit, reset time unknown, rechecking"
  fi
  PHASE_WAIT=$(( PHASE_WAIT + $(now) - w0 ))
  echo "  ▶ resuming"
  return 0
}

# Remember the session ID without failing (used when a call was cut off by a limit).
try_save_session() {
  [[ "$FRESH" == 1 ]] && return 0
  local sid; sid="$(jq -r '.session_id // empty' "$1" 2>/dev/null || true)"
  if [[ -n "$sid" ]]; then SESSION_ID="$sid"; printf '%s\n' "$SESSION_ID" >"$SESSION_FILE"; fi
  return 0
}

RESUME_NOTE='Note: an earlier attempt at the task below was interrupted when the usage limit was reached, so it may be partly done. First check the repository for work that already exists, then finish only what remains. Do not redo completed work and do not start any other phase.'

# ---------- running one prompt ----------

# Pull the final "result" event out of one call's event stream into <out.json>.
# If the call died before producing one, synthesise an error result that still carries the session ID.
extract_result() {   # extract_result <call stream> <out.json>
  local cur="$1" out="$2" sid
  jq -Rc 'fromjson? | select(type == "object" and .type == "result")' "$cur" 2>/dev/null | tail -n 1 >"$out" || true
  if [[ ! -s "$out" ]]; then
    sid="$(jq -Rr 'fromjson? | select(type == "object") | .session_id // empty' "$cur" 2>/dev/null | head -n 1 || true)"
    jq -n --arg sid "$sid" \
      '{is_error: true, result: "no result message received from claude", session_id: (if $sid == "" then null else $sid end)}' >"$out"
  fi
}

# Run one prompt. Succeeds only if claude exits 0 AND its result says is_error=false.
# Streams live status while it works. Retries transient failures; on a usage limit it waits for the
# reset and re-sends the task. Usage: run_claude "<prompt>" <out.json>
run_claude() {
  local original="$1" out="$2" prompt="$1" attempt=0 limit_waits=0 ok rc
  local cur="${out%.json}.cur.jsonl" stream="${out%.json}.stream.jsonl" err="${out%.json}.err"
  local args

  while true; do
    args=(-p "$prompt" --output-format stream-json --verbose
          --permission-mode "$PERM_MODE" --permission-prompts none)
    [[ -n "$ALLOWED_TOOLS" ]] && args+=(--allowedTools "$ALLOWED_TOOLS")
    [[ "$FRESH" != 1 && -n "$SESSION_ID" ]] && args+=(--resume "$SESSION_ID")

    : >"$cur"
    write_status "working (waiting for Claude Code's first output)"
    set +e
    claude "${args[@]}" 2>"$err" | tee "$cur" | stream_status
    rc="${PIPESTATUS[0]}"
    set -e
    extract_result "$cur" "$out"
    cat "$cur" >>"$stream"; rm -f "$cur"

    ok=0
    if (( rc == 0 )) && [[ "$(jq -r '.is_error // false' "$out" 2>/dev/null || echo true)" == "false" ]]; then
      ok=1
    fi

    if (( ok )); then
      # a call can look successful yet be the limit message itself
      hit_usage_limit "$out" strict || return 0
    fi

    if hit_usage_limit "$out"; then
      limit_waits=$((limit_waits + 1))
      if (( limit_waits > MAX_LIMIT_WAITS )); then
        echo "  ✗ still hitting the usage limit after $MAX_LIMIT_WAITS waits. Stopping; run again later."
        return 1
      fi
      try_save_session "$out"
      wait_for_limit_reset "$out" || return 1
      prompt="$RESUME_NOTE"$'\n\n'"$original"   # tell Claude to continue, not restart
      continue
    fi

    # spend limit or empty credit balance: retrying can't help, so stop right away
    if hit_spend_limit "$out"; then
      echo "  ✗ $(jq -r '.result // empty' "$out" 2>/dev/null | head -c 200)"
      echo "  ✗ Waiting won't fix this: raise the limit or add credit at claude.ai/settings/usage, then run the script again."
      return 1
    fi

    attempt=$((attempt + 1))
    if (( attempt > MAX_RETRY )); then
      echo "  ✗ claude failed: $(jq -r '.result // empty' "$out" 2>/dev/null | head -c 300)"
      return 1
    fi
    echo "  ! call failed, retry $attempt/$MAX_RETRY in ${RETRY_WAIT}s"
    write_status "retrying after a failed call ($attempt/$MAX_RETRY)"
    sleep "$RETRY_WAIT"
  done
}

# Remember the (possibly new) session ID so the next call continues the conversation.
save_session() {
  [[ "$FRESH" == 1 ]] && return 0
  local sid
  sid="$(jq -r '.session_id // empty' "$1")"
  [[ -n "$sid" ]] || { echo "  ✗ no session_id in $1"; return 1; }
  SESSION_ID="$sid"
  printf '%s\n' "$SESSION_ID" >"$SESSION_FILE"
}

# Optional quality gate. If it fails, hand the error back to Claude to fix.
run_check() {
  local phase="$1" n=0 log="$LOG_DIR/$1.check.log" fix
  [[ -n "$CHECK_CMD" ]] || return 0
  while true; do
    write_status "checking: $CHECK_CMD"
    echo "  … running check: $CHECK_CMD"
    if bash -c "$CHECK_CMD" >"$log" 2>&1; then
      echo "  ✓ check passed: $CHECK_CMD"
      return 0
    fi
    n=$((n + 1))
    if (( n > MAX_FIX )); then
      echo "  ✗ check still failing after $MAX_FIX fix attempts. See $log"
      return 1
    fi
    echo "  ! check failed, asking Claude to fix ($n/$MAX_FIX)"
    write_status "fixing a failed check (attempt $n/$MAX_FIX)"
    fix="$(printf 'The check `%s` failed after the last phase. Fix the underlying problem; do not disable, skip, or weaken the check. Last output:\n\n%s' \
           "$CHECK_CMD" "$(tail -n 80 "$log")")"
    run_claude "$fix" "$LOG_DIR/$phase.fix$n.json" || return 1
    save_session "$LOG_DIR/$phase.fix$n.json" || return 1
  done
}

commit_phase() {
  [[ "$GIT_COMMIT" == 1 ]] || return 0
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 0
  git add -A -- . ":!$LOG_DIR" ":!$SESSION_FILE" ":!$PROMPT_DIR" ":!run-prompts.sh" ":!.claude" >/dev/null 2>&1 || true

  # Commit message: "<type>(<scope>): <summary>" header, blank line, description.
  # Taken from prompts/<phase>.commit when present; otherwise built from the file name.
  local msg_file="$PROMPT_DIR/$1.commit" fallback
  if [[ -f "$msg_file" ]]; then
    git commit -q -F "$msg_file" >/dev/null 2>&1 || true   # nothing to commit is fine
  else
    fallback="$(printf 'chore: %s\n\nCompleted build step %s.' "$(sed -E 's/^[0-9]+-//; s/-/ /g' <<<"$1")" "${1%%-*}")"
    git commit -q -m "$fallback" >/dev/null 2>&1 || true
  fi
}

# ---------- main ----------

shopt -s nullglob
files=("$PROMPT_DIR"/[0-9][0-9]*.md)
(( ${#files[@]} )) || { echo "No prompts found in $PROMPT_DIR/ (expected 01.md, 02-name.md, ...)"; exit 1; }

PHASE_TOTAL=${#files[@]}
for f in "${files[@]}"; do
  [[ -f "$LOG_DIR/$(basename "$f" .md).done" ]] && PHASES_DONE=$((PHASES_DONE + 1))
done
RUN_START="$(now)"
echo "$PHASES_DONE of $PHASE_TOTAL phases already done."

for file in "${files[@]}"; do
  PHASE_INDEX=$((PHASE_INDEX + 1))
  phase="$(basename "$file" .md)"
  PHASE_NAME="$phase"

  if [[ -f "$LOG_DIR/$phase.done" ]]; then
    echo "Skipping completed phase $PHASE_INDEX/$PHASE_TOTAL: $phase"
    continue
  fi

  PHASE_START="$(now)"; PHASE_WAIT=0; LAST_STEP="-"
  : >"$LOG_DIR/$phase.stream.jsonl"

  echo "================================"
  echo "Phase $PHASE_INDEX/$PHASE_TOTAL · $phase"
  echo "$(overall_line)"
  echo "================================"
  write_status "starting"

  run_claude "$(cat "$file")" "$LOG_DIR/$phase.json" || { write_status "STOPPED in this phase (see terminal output)"; echo "Stopped at phase $phase."; exit 1; }
  save_session "$LOG_DIR/$phase.json" || { write_status "STOPPED: no session id"; exit 1; }
  jq -r '.result // ""' "$LOG_DIR/$phase.json" >"$LOG_DIR/$phase.txt"

  run_check "$phase" || { write_status "STOPPED: check failed"; echo "Stopped at phase $phase (check)."; exit 1; }

  write_status "committing"
  commit_phase "$phase"
  touch "$LOG_DIR/$phase.done"

  PHASES_DONE=$((PHASES_DONE + 1))
  active=$(( $(now) - PHASE_START - PHASE_WAIT ))
  MEASURED_N=$((MEASURED_N + 1)); MEASURED_SECS=$((MEASURED_SECS + active))
  steps="$(jq -Rr 'fromjson? | select(type == "object" and .type == "assistant") | (.message.content // [])[]? | select(.type == "tool_use") | .name' \
           "$LOG_DIR/$phase.stream.jsonl" 2>/dev/null | wc -l | tr -d ' ')"
  cost="$(jq -r '.total_cost_usd // empty' "$LOG_DIR/$phase.json" 2>/dev/null || true)"
  if [[ "$FRESH" == 1 ]]; then cost_label="phase cost"; else cost_label="conversation cost so far"; fi

  echo "  ✓ phase $PHASE_INDEX/$PHASE_TOTAL finished in $(fmt_dur "$active") · ${steps:-0} steps${cost:+ · $cost_label ≈ \$$cost}"
  echo "  $(overall_line)"
  echo
  write_status "phase finished"
done

write_status "ALL PHASES COMPLETE"
echo "All phases processed in $(fmt_dur $(( $(now) - RUN_START )))."
