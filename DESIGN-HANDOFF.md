# Life OS · Health — Design Handoff Brief
**For: Claude Design session · From: the working build (07 Sep 2026)**
Paste this brief into your Design conversation alongside `life-os-health.jsx`. It tells Design what it owns, what it must not touch, and everything the interface has to account for.

---

## What this app is
A single-file React artifact: 15-week "Campaign 95" health tracker (07 Sep – 20 Dec 2026) covering training, nutrition, weight glide path, German learning, body measurements, benchmarks, and mindset. One user (Tom), mobile-first, warm espresso/terracotta palette.

## Design owns (change freely)
- Layout, spacing, typography, iconography, navigation pattern (tabs may become anything)
- Color system (current tokens in the `C` object at the top of the file)
- Component styling: panels, rings, chips, buttons, charts' visual dress
- The body-figure SVGs in the Lifts tab (stylized placeholders — a better generic body is welcome; keep 12 tappable regions: quads, glutes, hamstrings, calves, chest, shoulders, lats, upper back, biceps, triceps, core, grip)
- Empty states, micro-interactions, animation

## Design must NOT change (the data layer)
1. **Storage key: `lifeos.v3.health`** — months of logged data live under it. Any rename orphans everything.
2. **The data shape.** Top-level: `days` (per-date entries), `lifts` (per-date → per-exercise-key → sets[{load,reps}]), `measures`, `tests`, `journal[]`, `affirm`, `deCards`, `deMissions`, `deChat`, `height`, `lb`, `startDate`.
3. **Exercise keys** (`backsq`, `trapdl`, `bench`, …) including the `~t` suffix convention for travel-kit logs — history and PRs are keyed on these.
4. **Logging conventions built into labels/tooltips:** loads stored in kg always (`lb` flag is display-only); carries log metres in the reps field; sleep/RHR/HRV belong to the morning the night ended; knee raises log added load only.
5. **The Gespräch API call** (Anthropic `/v1/messages`, model `claude-sonnet-4-6`, no API key) and its system prompt.
6. **No localStorage/sessionStorage** — persistence goes through `window.storage` only.
7. **Deterministic day-based rotation** for quotes/quizzes/flashcards (keyed on day-of-year).

## Feature inventory the design must house
- **Today:** 4 ring gauges (kcal, protein, steps, water) · daily numbers incl. drinks & water · supplement stack w/ streaks · session toggles + cardio log (min/km/avg HR) · RPE/sleep/hunger 1–5 scales · watch panel (sleep h, resting HR, HRV, active kcal) · travel-day toggle · date-keyed event banners
- **Train:** session header w/ GYM⇄TRAVEL-KIT and KG⇄LB toggles · per-exercise cards: progression chip (+kg / CHASE / REPEAT / HOLD / RE-BASE / KIT), per-set load+rep inputs, rest timer inside each open card, demo links · session tonnage vs last week · auto-progressing mobility/yoga list (+10 s/week on holds, reset week returns to baseline)
- **Lifts:** tappable front/back body figures + muscle chips → filtered exercise records; otherwise grouped by session. Each row: PR (load×reps·date, tiebreak by reps), LAST full session, PR ✦ badge, phase tag (A–B / C–D / A–D), separate KIT line
- **Fuel:** cycled daily targets (travel variant) · 5-feeding meal map w/ ticks · alcohol budget w/ live math · German staples list · adjustment protocol reference
- **Trend:** glide path 110.2→98.0 w/ 7-day avg + ahead/behind · dual forecast (98 & 95 kg ETAs) · weekly review w/ automated verdict · 14-day adherence strip (travel days scored on protein only) · charts: intake kcal+protein vs targets (14d), sleep vs RPE (14d), resting HR (30d), weekly tonnage (cycle)
- **Deutsch:** countdown to 20 Dec + monthly phase · Lektion→Quiz daily flow · Leitner flashcards (boxes 1–5, 🔊 TTS) · Satzbau word-order builder · 3 weekly speaking missions w/ checkboxes · Gespräch AI chat partner (bubbles, corrections, 🔊, persists last 12 msgs)
- **Body:** own date picker (decoupled from Today) · 6 tape sites · Navy body-fat calc · waist trend chart
- **Tests:** 12 benchmarks × base/mid/end columns, grouped Strength/Engine/Mobility/Composition
- **Mind:** 4 daily quotes w/ source + context + READ-MORE links · Latin Lektion+Quiz · rotating affirmation prompt w/ streak · journal + recent entries
- **System:** export overlay (COPY ALL to clipboard — downloads are sandbox-blocked) + import-merge box for cross-device sync · cycle/day-strip header w/ travel days in rose

## Palette reference (current)
ground #171310 · panel #1F1915 · panel2 #262019 · panel3 #2E2620 · ink #EDE4DA · dim #A89B8C · terra #D06248 · camel #C89B6C · rose #C97B8E · sage #8FA38A · teal #6FA3A0 · amber #E8A64C · neon #E4FF5F (PR/accent)

## Round-trip protocol
1. In the app: ⇩ EXPORT → COPY ALL (backs up data before any artifact swap)
2. Design iterates on visuals in its copy
3. Bring Design's output back to the working Claude conversation to merge — visuals adopted onto the current data layer, never the reverse
