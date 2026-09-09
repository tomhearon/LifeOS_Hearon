# Handoff: Life OS — Personal Life Dashboard (v2 · 07 Sep 2026)

## Overview
Life OS is one personal app replacing several trackers. Areas: **Today** (cross-module daily briefing), **Health & Mind** (Campaign 95 cut program, training session logger, body-map lift records, cardio, PRs, macros, mood/energy, sleep), **Money** (net worth, accounts, cash flow, bills, subscriptions, goals, retirement), **Admin** (recurring life-admin, TDY prep), **Learning** (Roman History PhD track + full German/Deutsch applet), **Inventory** (library, bookcases, capture flow, cellar, valuables), **Weekly Review**, **AI Agents** (Claude-powered, per-area), **Settings** (theme presets). Single user (Tom, American, lives in Germany), **USD currency**, 24h time, metric units (lb toggle for lifting), dd MMM dates. Demo date: **Mon 07 Sep 2026** — Campaign 95 day 1/106 (07 Sep – 20 Dec), 110.2 → 98.0 kg.

## IMPORTANT: existing production code
This design round-trips with a real working build. Repo: **tomhearon/LifeOS_Hearon** (main). Files there:
- `life-os-health (07 SEP 26).jsx` — the working health app (Campaign 95)
- `home-inventory.jsx` — the working inventory/library app
- `DESIGN-HANDOFF.md` — that build's own contract notes

**Data-layer contracts — never break these when merging designs back:**
1. Health storage key `lifeos.v3.health`; inventory keys `homeinv:v1:books|items|cases|drinks|photo:<id>|shot:<id>`. Renaming orphans months of logged data.
2. Persistence via `window.storage` (get/set/list/delete), NOT localStorage.
3. Health data shape: `days`, `lifts` (per-date → exercise-key → sets[{load,reps}]), `measures`, `tests`, `journal[]`, `affirm`, `deCards`, `deMissions`, `deChat`, `height`, `lb`, `startDate`.
4. Exercise keys (`backsq`, `trapdl`, `bench`, …) with `~t` suffix for travel-kit logs — PRs/history key on these. Loads stored in kg always (`lb` is display-only). Carries log metres in the reps field.
5. Anthropic calls: `/v1/messages`, model `claude-sonnet-4-6`, no API key header needed in that environment; Gespräch persists last 12 messages.
6. Deterministic day-of-year rotation for quotes/quizzes/flashcards.
Adopt visuals onto the existing data layer — never the reverse.

## About the Design Files
`Life OS.dc.html` is the **primary reference**: a working HTML prototype of every screen, all interactions, the theme system, and all Claude prompts. `Life OS Directions.dc.html` holds earlier hi-fi mockups (five themes, phone layouts, area mockups). These are design references to **recreate in the real codebase**, not production code. `image-slot.js`, `ios-frame.jsx`, `support.js` are prototype runtime only.

## Fidelity
High-fidelity: colors, type, spacing, radii, copy in `Life OS.dc.html` are final intent. Fluid layout; phone = single column, bottom tab bar, 44px+ targets (turn-2 mockups in the Directions file).

## Theme System (core architecture)
All styling via CSS custom properties; themes are token sets swapped at runtime, persisted. Default: **Field Ledger**. Full token table per theme (bg/card/card2/ink/sub/mut/line/acc/accInk/health/money/admin/learn/good/bad/glow, display+body fonts) is in the `THEMES` object at the top of `Life OS.dc.html`'s logic — port verbatim. Five presets: Field Ledger (default), Espresso Command, The Ledger, Midnight Signal, Obsidian Atlas (graphics/photo-ready). Labels: `ui-monospace` uppercase, letter-spacing .1–.16em, 9–10px. Cards: 12px radius, 3px area-colored left border, glow only on live elements. Auto dark mode: Field Ledger by day → Midnight Signal after sunset.

## Screens (9) — see the prototype for exact layout; new-in-v2 marked ★
1. **Today** — greeting + Campaign chip row; Today's Orders (cross-area checklist); Health stats w/ quick-logs; glide path + weigh-in input; Next Action card; Money/Admin/Learning minis; Daily Council strip (Claude-generated 4-agent brief).
2. **Health & Mind** — glide path (110.2→98.0, target 20 Dec); sleep card; mood & energy 1–5 taps + 14-day heatmap; ★ **Today's Session** (GYM⇄TRAVEL-KIT and KG⇄LB toggles; per-exercise cards with progression chips (+2.5 KG / CHASE / HOLD / REPEAT / KIT), load×reps set entry, "✓ as planned" quick-fill, set chips, session tonnage vs last week); ★ **Lifts body map** (front/back SVG figures, 12 tappable regions + muscle chips → filtered exercise records with PR (load×reps·date) and LAST lines); ★ **Cardio log** (Intervals/Steady/Tempo/Ruck chips; min/km/avg-HR entry; pace computed); ★ **PR board** (✦ badges for fresh PRs).
3. **Money** — net worth $148,230; accounts; cash flow (Sep); category bars; subscriptions w/ cancel + unused-sub flag; savings goals; retirement projection; bills w/ Pay. All USD.
4. **Admin** — add-task input; recurring tasks w/ due + frequency; TDY banner (14–18 Sep).
5. **Learning** — Via Romana doctorate track (Phase I, SPQR, Latin counter, podcast pairing); Tutor recommends (Claude); ★ **Deutsch applet**: countdown (B1 by 20 Dec), daily Lektion (title + vocab chips) → 3-option quiz with right/wrong states and rotation, Leitner boxes B1–B5 with due count, 3 weekly speaking missions (checkboxes), **Gespräch** — Claude conversation partner replying in simple German with English corrections in parentheses (port the system prompt from the prototype's `_sendDe`).
6. ★ **Inventory** — Library spine-view (arrange by Subject/Colour/Height — simplified from repo's arrangement engine; repo also has designer/hybrid/author/current modes), subject chips, needs-review locators; Cellar summary; Valuables insurance register (name/category/serial/value, total); **Bookcases** (per-case shelf/cube grid with fill % bars, red >85%; add-case chips from catalogue — repo has full CASE_CATALOGUE + Claude bookcase search); **Capture flow** stepper: 1 SHOOT (photo drop) → 2 REVIEW (parsed spines incl. unidentified-book locator strings) → 3 PLACE (pick case/shelf) → confirmation. Repo's `readShelfPhoto`/`readBookcasePhoto`/`identifyFromPhoto`/`enrichBook` implement the real pipeline.
7. **Weekly Review** — week grade; 4 area scorecards; auto-drafted next week + Commit; milestones.
8. **Agents** — 4 agent cards (Coach/Bursar/Adjutant/Tutor) + scoped chat + natural-language Agent Builder. Prompts in the prototype logic; each agent sees only its area's data. Guardrail: agents draft, user approves.
9. **Settings** — 5 theme cards, auto dark mode, reset demo data.

## Interactions
Optimistic instant logging, persisted. Bars animate width .4s; theme switch .35s. Full-row click toggles. Claude buttons show busy labels; inline retry message on error. Weigh-in validates 80–160 kg. Body-map ellipse regions: cursor pointer, acc fill when selected.

## AI prompts
All Claude prompts (Daily Council, per-agent systems, Tutor recs, Agent Builder, Gespräch) live verbatim in `Life OS.dc.html`'s logic class — port them as-is; serialize live user data into the context block the way `ctx()` does. USD amounts in context.

## Build order (phased, each ships usable)
1. Shell + themes + Today (manual logging → real DB)
2. Health & Mind full (session logger on the existing `lifts` shape; body map; cardio; PRs) — **merge with the repo health app rather than rewriting it**
3. Money (manual fields first; CSV import second) + Admin
4. Learning incl. Deutsch (reuse repo `deCards`/`deMissions`/`deChat` data)
5. Inventory (merge `home-inventory.jsx` logic under the new skin)
6. Agents + Weekly Review; then integrations (Apple Health/Garmin, bank CSV)

## Files
- `Life OS.dc.html` — working prototype (primary reference)
- `Life OS Directions.dc.html` — mockup canvas (themes, phone layouts, area mockups)
- `github.md` — repo association + sync state
- `image-slot.js`, `ios-frame.jsx`, `support.js` — prototype runtime only
