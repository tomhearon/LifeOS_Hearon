import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";

/* ════════════════════  CONFIG  ════════════════════ */

const KEY = "lifeos.v3.health"; // unchanged so existing logged data carries over
const NUTRITION_START = "2026-08-05";

/* Warm palette — espresso ground, terracotta / camel / rose accents, neon peach highlight */
const C = {
  ground: "#1B1410", panel: "#251C16", panel2: "#2E231B", panel3: "#382B20",
  rule: "#42332699", ruleSoft: "#3A2D2266",
  ink: "#F4EADB", dim: "#B39C87", dimmer: "#7E6B5A",
  terra: "#E2725B", terraSoft: "rgba(226,114,91,0.13)",
  camel: "#E8A64C", camelSoft: "rgba(232,166,76,0.13)",
  rose: "#D98594", roseSoft: "rgba(217,133,148,0.13)",
  sage: "#9DBE8D", sageSoft: "rgba(157,190,141,0.13)",
  teal: "#7FB5A8",
  neon: "#FFB454",
  behind: "#D06248",
  cream: "#F1E4D0",
};
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " exercise form")}`;

/* ── Sessions ── */
/* Every exercise carries a travel-kit substitute (a/at) — bands + bodyweight, hotel-proof. */
const SESSIONS_1 = {
  lowerA: { name: "Lower A — Quad emphasis", color: "terra", ex: [
    { k: "backsq", m: ["quads", "glutes"], n: "Barbell back squat", sets: 4, reps: "8–10", inc: 2.5, tip: "Bar on the traps, brace, 3-sec eccentric. Total bar weight. Rack safeties just below your bottom position.", a: "Band front squat / tempo BW squat", at: "Band under feet, over shoulders. No band: 4-sec descent, 1-sec pause bodyweight squats — tempo is the load." },
    { k: "bss", m: ["quads", "glutes"], n: "DB Bulgarian split squat", sets: 3, reps: "8–10 /leg", inc: 2.5, tip: "Rear foot on a bench, front shin vertical. Load per hand.", a: "BW Bulgarian split squat (3-1-1 tempo)", at: "Rear foot on the hotel chair or bed. Slow tempo replaces the dumbbells." },
    { k: "legpress", m: ["quads"], n: "Leg press", sets: 3, reps: "12–15", inc: 5, tip: "Feet mid-platform, lower back on the pad. Safe close to failure.", a: "Banded squat + wall sit finisher", at: "Band squats to near-failure, then a 45–60 sec wall sit per set." },
    { k: "rdl", m: ["hamstrings", "glutes"], n: "DB Romanian deadlift", sets: 3, reps: "10–12", inc: 2.5, tip: "Hips back, DBs on the thighs, stop at the hamstring stretch.", a: "Band RDL / single-leg hip hinge", at: "Stand on the band, hinge. No band: single-leg RDL, fingertips on the wall for balance." },
    { k: "calf", m: ["calves"], n: "Standing calf raise", sets: 4, reps: "12–15", inc: 2.5, tip: "Full stretch, 1-sec top squeeze. Running prep.", a: "Single-leg calf raise (stair edge)", at: "Any stair or curb. Single-leg makes bodyweight enough." },
    { k: "kneeraise", m: ["core"], n: "Hanging knee raise", sets: 3, reps: "12–15", inc: 0, tip: "Slow lowering, no swing. Log 0 for bodyweight.", a: "Lying leg raise", at: "Hands under hips, lower back pressed down, slow lowering." },
  ]},
  upperA: { name: "Upper A — Push emphasis", color: "camel", ex: [
    { k: "bench", m: ["chest", "triceps"], n: "DB flat bench press", sets: 4, reps: "8–10", inc: 2.5, tip: "Shoulder blades pinned, DBs level with the chest. Load per hand.", a: "Banded push-up", at: "Band across the back, ends under palms. Elevate feet to make it harder, hands to make it easier." },
    { k: "ohp", m: ["shoulders"], n: "Seated DB shoulder press", sets: 3, reps: "8–10", inc: 2.5, tip: "Back supported, elbows in front of the torso.", a: "Band overhead press / pike push-up", at: "Stand on the band and press. No band: pike push-ups, hips high." },
    { k: "csrow", m: ["upperback", "lats"], n: "Chest-supported DB row", sets: 3, reps: "10–12", inc: 2.5, tip: "Chest down on the incline bench, pull to the hip, 1-sec pause.", a: "Seated band row", at: "Band around feet, pull to the hip, 1-sec squeeze." },
    { k: "fly", m: ["chest"], n: "Incline DB fly", sets: 3, reps: "12–15", inc: 2.5, tip: "Soft elbows, big stretch.", a: "Band fly", at: "Band anchored behind (door or bedpost), soft elbows, squeeze." },
    { k: "latraise", m: ["shoulders"], n: "DB lateral raise", sets: 3, reps: "12–15", inc: 1, tip: "Light. Lead with the elbow, stop at shoulder height.", a: "Band lateral raise", at: "Stand on the band. Lighter tension than it looks — go slow." },
    { k: "triext", m: ["triceps"], n: "DB overhead triceps extension", sets: 3, reps: "10–12", inc: 2.5, tip: "Single DB, elbows tight, deep stretch.", a: "Band overhead extension / diamond push-up", at: "Band behind the back, press overhead. No band: diamond push-ups." },
  ]},
  lowerB: { name: "Lower B — Hinge emphasis", color: "rose", ex: [
    { k: "trapdl", m: ["hamstrings", "glutes"], n: "Barbell deadlift", sets: 4, reps: "6–8", inc: 5, tip: "Conventional from the floor, total bar weight, hips and shoulders rise together. Every set 2 reps in reserve.", a: "Heavy band deadlift / single-leg RDL", at: "Doubled band under feet. No band: slow single-leg RDLs — balance is the load." },
    { k: "revlunge", m: ["quads", "glutes"], n: "Barbell reverse lunge", sets: 3, reps: "10 /leg", inc: 2.5, tip: "Bar on the traps, step back, front shin vertical. Total bar weight.", a: "BW reverse lunge (3-1-1 tempo)", at: "Slow descent, pause at the bottom, drive up." },
    { k: "hipthrust", m: ["glutes"], n: "Hip thrust", sets: 3, reps: "10–12", inc: 5, tip: "2-sec squeeze at lockout, ribs down.", a: "Single-leg glute bridge", at: "Shoulders on the bed edge or floor, one leg, 2-sec squeeze." },
    { k: "legcurl", m: ["hamstrings"], n: "Seated leg curl", sets: 3, reps: "12–15", inc: 2.5, tip: "Hamstring insurance for the running block.", a: "Sliding leg curl (towel on floor)", at: "Heels on a towel, bridge up, slide out and back. Brutal and free." },
    { k: "stepup", m: ["quads"], n: "Single-leg leg press", sets: 2, reps: "10 /leg", inc: 5, tip: "One foot mid-platform, full control down. Load = machine setting per leg.", a: "Chair step-up", at: "Sturdy chair or bench, drive through the top foot, control down." },
    { k: "suitcase", m: ["core", "grip"], n: "Suitcase carry", sets: 3, reps: "40 m /side", inc: 0, unit: "m", tip: "One heavy DB, ribs stacked. Log metres (weaker side if asymmetric).", a: "Loaded-bag suitcase carry", at: "Your packed duffel or laptop bag, one hand. Hotel corridors count." },
  ]},
  upperB: { name: "Upper B — Pull emphasis", color: "sage", ex: [
    { k: "pulldown", m: ["lats"], n: "Neutral-grip lat pulldown", sets: 4, reps: "8–10", inc: 2.5, tip: "Full stretch at the top, elbows to the ribs.", a: "Band pulldown / doorframe row", at: "Band over the door top, kneel and pull. No anchor: towel row on the doorframe, feet forward." },
    { k: "incline", m: ["chest", "shoulders"], n: "DB incline bench press (30°)", sets: 4, reps: "8–10", inc: 2.5, tip: "Upper chest. Load per hand.", a: "Feet-elevated push-up", at: "Feet on the bed or chair — elevation shifts load to the upper chest." },
    { k: "onearm", m: ["lats", "upperback"], n: "One-arm DB row", sets: 3, reps: "10–12 /arm", inc: 2.5, tip: "Bench-supported, long stretch, no torso twist.", a: "One-arm band row", at: "Band around a table leg or under the opposite foot." },
    { k: "arnold", m: ["shoulders"], n: "DB Arnold press", sets: 3, reps: "10–12", inc: 2.5, tip: "Rotate as you press, controlled.", a: "Band Arnold press", at: "Stand on the band, rotate through the press." },
    { k: "reardelt", m: ["shoulders", "upperback"], n: "Rear-delt fly", sets: 3, reps: "15", inc: 1, tip: "Insurance for the pressing volume.", a: "Band pull-apart", at: "Arms straight, band to the chest, 2-sec squeeze. Do these forever." },
    { k: "hammer", m: ["biceps"], n: "DB hammer curl", sets: 3, reps: "10–12", inc: 2.5, tip: "No swinging.", a: "Band hammer curl", at: "Stand on the band, neutral grip." },
    { k: "farmer", m: ["grip", "core"], n: "Farmer's carry", sets: 3, reps: "40 m", inc: 0, unit: "m", tip: "Heaviest DBs with posture. Per-hand weight and metres.", a: "Loaded-bag farmer carry", at: "A bag per hand, corridor laps." },
  ]},
};

/* Phase C/D accessory rotation (from 19 Oct) — big lifts keep their keys so benchmarks stay continuous. */
const SESSIONS_2 = {
  lowerA: { name: "Lower A — Quad emphasis · Phase C", color: "terra", ex: [
    SESSIONS_1.lowerA.ex[0],
    { k: "walklunge", m: ["quads", "glutes"], n: "DB walking lunge", sets: 3, reps: "10 /leg", inc: 2.5, tip: "Continuous steps, torso tall. Load per hand.", a: "BW walking lunge (long strides)", at: "Corridor or garden. Long, slow strides." },
    { k: "hacksq", m: ["quads"], n: "Hack squat or goblet squat", sets: 3, reps: "12–15", inc: 5, tip: "Machine if the gym has one; heavy goblet squat if not.", a: "Band goblet squat", at: "Band under feet, held at the chest." },
    { k: "sldl", m: ["hamstrings"], n: "DB stiff-leg deadlift", sets: 3, reps: "10–12", inc: 2.5, tip: "Straighter knees than the RDL — deeper hamstring stretch, lighter load.", a: "Band good morning", at: "Band under feet and behind the neck, hinge." },
    { k: "seatedcalf", m: ["calves"], n: "Seated calf raise", sets: 4, reps: "15–20", inc: 2.5, tip: "Hits the soleus — the running muscle the standing raise misses.", a: "Bent-knee single-leg calf raise", at: "Knee slightly bent on a stair edge." },
    { k: "cablecrunch", m: ["core"], n: "Cable crunch", sets: 3, reps: "12–15", inc: 2.5, tip: "Rounding the spine on purpose — the one place that's the goal.", a: "Hollow-body hold", at: "20–30 sec holds, lower back pressed down." },
  ]},
  upperA: { name: "Upper A — Push emphasis · Phase C", color: "camel", ex: [
    SESSIONS_1.upperA.ex[0],
    { k: "landmine", m: ["shoulders"], n: "Landmine or machine shoulder press", sets: 3, reps: "10–12", inc: 2.5, tip: "Bar in a corner or the machine — shoulder-friendlier angle for phase two.", a: "Pike push-up (elevated)", at: "Feet on the chair, hips high." },
    { k: "sealrow", m: ["upperback", "lats"], n: "Seal row or cable row", sets: 3, reps: "10–12", inc: 2.5, tip: "Strict, chest supported, zero momentum.", a: "Seated band row (pause)", at: "2-sec pause at the chest every rep." },
    { k: "cablefly", m: ["chest"], n: "Cable crossover", sets: 3, reps: "12–15", inc: 2.5, tip: "Constant tension the DBs can't give.", a: "Band fly (slow)", at: "4-sec negatives." },
    { k: "cablelat", m: ["shoulders"], n: "Cable lateral raise", sets: 3, reps: "12–15", inc: 1, tip: "Tension at the bottom where DBs have none.", a: "Band lateral raise (pause)", at: "1-sec hold at shoulder height." },
    { k: "skull", m: ["triceps"], n: "EZ-bar skullcrusher", sets: 3, reps: "10–12", inc: 2.5, tip: "To the forehead or just behind, elbows tucked.", a: "Bench dip", at: "Hands on the chair edge, feet forward." },
  ]},
  lowerB: { name: "Lower B — Hinge emphasis · Phase C", color: "rose", ex: [
    SESSIONS_1.lowerB.ex[0],
    { k: "fwdlunge", m: ["quads"], n: "DB forward lunge", sets: 3, reps: "10 /leg", inc: 2.5, tip: "More knee demand than reverse — you've earned it by phase C.", a: "BW forward lunge (tempo)", at: "Slow and controlled." },
    { k: "gluteham", m: ["glutes", "hamstrings"], n: "Back extension (glute focus)", sets: 3, reps: "12–15", inc: 2.5, tip: "45° bench, squeeze glutes at the top, don't hyperextend.", a: "Single-leg glute bridge (pause)", at: "3-sec squeeze at the top." },
    { k: "nordic", m: ["hamstrings"], n: "Nordic curl (assisted) or leg curl", sets: 3, reps: "6–8", inc: 0, tip: "Knees padded, partner or band assist. The best hamstring insurance running money can buy.", a: "Sliding leg curl (single-leg)", at: "One heel on the towel if two is easy." },
    { k: "stepup2", m: ["quads", "glutes"], n: "DB step-up (knee height)", sets: 2, reps: "10 /leg", inc: 2.5, tip: "The original returns — no push-off from the bottom leg.", a: "Chair step-up (slow)", at: "3-sec descents." },
    SESSIONS_1.lowerB.ex[5],
  ]},
  upperB: { name: "Upper B — Pull emphasis · Phase C", color: "sage", ex: [
    { k: "pullup", m: ["lats", "biceps"], n: "Pull-up (assisted ok)", sets: 4, reps: "6–10", inc: 2.5, tip: "The graduation from pulldowns. Log assistance as negative, added load as positive.", a: "Doorframe row / band pulldown", at: "Slow negatives if a bar exists anywhere." },
    SESSIONS_1.upperB.ex[1],
    { k: "cablerow", m: ["upperback", "lats"], n: "Seated cable row", sets: 3, reps: "10–12", inc: 2.5, tip: "Neutral grip, pull to the navel, 1-sec squeeze.", a: "One-arm band row (pause)", at: "2-sec squeeze at the hip." },
    { k: "facepull", m: ["shoulders", "upperback"], n: "Cable face pull", sets: 3, reps: "15", inc: 1, tip: "Rope to the bridge of the nose, thumbs back.", a: "Band face pull", at: "Band over the door, pull high." },
    { k: "ezcurl", m: ["biceps"], n: "EZ-bar curl", sets: 3, reps: "10–12", inc: 2.5, tip: "Full stretch at the bottom, no swing.", a: "Band curl (slow negative)", at: "4-sec down." },
    SESSIONS_1.upperB.ex[6],
  ]},
};

const PHASE2_START = "2026-10-19"; // Phase C: accessory rotation begins
const sessionsFor = (date) => (date >= PHASE2_START ? SESSIONS_2 : SESSIONS_1);
const SESSIONS = SESSIONS_1; // legacy references
const EX_INC = {};
[SESSIONS_1, SESSIONS_2].forEach((set) => Object.values(set).forEach((s) => s.ex.forEach((e) => { EX_INC[e.k] = e.inc; })));

const MOBILITY = {
  quick: { name: "Quick Flow · 15 min (pre-lift)", items: [
    ["Cat-cow", "10 rounds"], ["World's greatest stretch", "5 /side"], ["90/90 hip switches", "10 rounds"],
    ["Deep squat hold + elbow pry", "60 sec"], ["Ankle knee-to-wall rocks", "15 /side"],
    ["Shoulder pass-through", "10"], ["Scapular wall slides", "10"]]},
  standard: { name: "Yoga · Standard 25–30 min", items: [
    ["Sun Salutation A", "3 slow rounds"], ["Warrior II → Triangle flow", "5 breaths each /side"],
    ["Crescent lunge (low)", "90 sec /side"], ["Pyramid fold", "90 sec /side"],
    ["Half pigeon", "90 sec /side"], ["Thread the needle", "90 sec /side"],
    ["Tree pose (balance)", "30 sec /side"], ["Seated forward fold", "90 sec"],
    ["Supine twist + slow breathing", "90 sec /side"]]},
  deep: { name: "Yin Yoga · Deep 45 min", items: [
    ["Butterfly", "2–3 min"], ["Dragon (lizard lunge)", "2–3 min /side"],
    ["Frog", "2–3 min"], ["Half saddle (quad)", "2 min /side"],
    ["Caterpillar (seated fold)", "3 min"], ["Straddle — centre & both sides", "3 min"],
    ["Wall calf & soleus stretch", "2 min /side"], ["Reclined twist", "2 min /side"],
    ["Legs up the wall + box breathing", "5 min"]]},
};

const SCHED_1 = {
  1: { mob: "quick", key: "lowerA", kcal: 2400, carbs: 250 },
  2: { mob: "quick", key: "upperA", kcal: 2400, carbs: 250 },
  3: { mob: "standard", cardio: "Run 1 · easy trail", run: true, kcal: 2300, carbs: 220 },
  4: { mob: "quick", key: "lowerB", kcal: 2400, carbs: 250 },
  5: { mob: "quick", key: "upperB", hiit: "Hill sprints (from wk 3) · after lifting or PM", kcal: 2450, carbs: 260 },
  6: { mob: "quick", cardio: "Family day · rest, walk", kcal: 1900, carbs: 140 },
  0: { mob: "deep", cardio: "Long run · trails", run: true, longrun: true, kcal: 2400, carbs: 230 },
};
const SCHED_2 = {
  1: { mob: "quick", key: "lowerA", kcal: 2650, carbs: 300 },
  2: { mob: "quick", key: "upperA", hiit: "Finisher · 10 min", kcal: 2650, carbs: 300 },
  3: { mob: "standard", cardio: "Zone 2 run · 40 min", kcal: 2400, carbs: 230 },
  4: { mob: "quick", key: "lowerB", kcal: 2650, carbs: 300 },
  5: { mob: "quick", key: "upperB", hiit: "Finisher · 10 min", kcal: 2650, carbs: 300 },
  6: { mob: "deep", hiit: "Circuit · 25–30 min", kcal: 2500, carbs: 260 },
  0: { mob: "quick", cardio: "Rest · long walk", kcal: 2200, carbs: 180 },
};
const CYCLES = [
  { id: "c1", name: "Campaign 95", weeks: 15, start: "2026-09-07", end: "2026-12-20",
    startW: 110.2, targetW: 98.0, sched: SCHED_1, protein: 190, deloadWeek: 6 },
  { id: "c2", name: "Finisher → Build", weeks: 12, start: "2027-01-04", end: "2027-03-28",
    startW: 98.0, targetW: 95.0, sched: SCHED_2, protein: 195, deloadWeek: 6 },
];

const RUN_BLOCK = [
  "Wed 8 km easy · Sun 10 km long", "Wed 8 km · Sun 11 km", "Wed 8–10 km · Sun 12 km · hills begin (6×10s)",
  "Wed 10 km · Sun 12 km · hills 8×10s", "Wed 8 km · Sun 10 km · birthday week, keep it easy",
  "RESET — two easy 6–8 km, no hills, maintenance eating", "Wed 10 km · Sun 12 km · hills 8×12s",
  "Wed 10 km · Sun 13 km · hills 8×12s", "Wed 10 km · Sun 14 km · hills 10×12s",
  "Wed 10 km · Sun 12 km · hills 10×12s", "Wed 10 km · Sun 14 km · hills 8×12s",
  "Wed 10 km · Sun 14 km · hills 10×15s (Phoenix week — treadmill or desert paths)", "Wed 10 km · Sun 15 km · hills 10×15s",
  "Wed 8 km · Sun 12 km · hills 6×12s", "Wed 8 km · Sun 10 km easy · arrive at the 20th fresh"];

/* ── Travel & events ── */
const TRAVEL_RANGES = [
  ["2026-11-23", "2026-11-29", "Phoenix · Thanksgiving week"],
];
const EVENTS = {
  "2026-10-06": "Your birthday — and the checkpoint the original plan aimed at. Whatever the scale says today, look at the Tests tab instead.",
  "2026-10-12": "RESET week begins: maintenance eating (~2,800/day, protein unchanged), halved lifting volume, easy runs only. This week is what makes phases C and D work.",
  "2026-10-19": "Phase C: accessory exercises rotate today — new movements carry fresh prompts, big lifts keep their history.",
  "2026-11-26": "Thanksgiving in Phoenix — one plate, everything on it, zero tracking today. Back to protein-first tomorrow.",
  "2026-12-20": "Der Tag. Wife's birthday — end of Campaign 95. Say something conversational in German and mean it.",
};
const CYCLE2_REMINDER_FROM = "2026-09-07";
const CYCLE2_DEADLINE = "2026-09-15";

const STACK = [
  { k: "creatine", label: "Creatine 5 g", note: "Any time. Consistency beats timing.",
    tip: "Best-evidenced legal ergogenic. Helps hold strength and lean mass in a deficit. ~1 kg water gain in the first two weeks is intramuscular, not fat." },
  { k: "im8", label: "IM8 Daily Ultimate", note: "12 g in water · includes 1,200 IU D3",
    tip: "Your multivitamin/greens base — and your D3 source (1,200 IU). Adequate Aug–Oct with summer sun; recheck 25-OH-D at your next bloodwork before winter." },
  { k: "protein", label: "Protein target hit", note: "The one that decides the outcome",
    tip: "190 g — 2.5 g per kg of lean mass. The single biggest determinant of whether the muscle survives the deficit." },
];

const SLEEP_ANCHORS = {
  1: "Broken — under 5 h or repeated waking", 2: "Restless or short. Woke unrefreshed",
  3: "Adequate. Neither rested nor wrecked", 4: "Solid, mostly unbroken, woke on your own",
  5: "Full duration, unbroken, restored" };
const HUNGER_ANCHORS = {
  1: "No appetite at all", 2: "Comfortable, food was easy", 3: "Normal hunger between meals",
  4: "Hungry often, thinking about food", 5: "Ravenous — deficit may be too steep" };

/* ── Fuel: meal map, staples, alcohol, adjustment rules ── */
const MEALS = [
  { k: "m1", t: "Breakfast", when: "On waking", what: "Magerquark or Skyr + berries + oats, or eggs + rye bread", pro: "45–50 g" },
  { k: "m2", t: "Lunch", when: "Midday", what: "Lean protein + large carb portion + a lot of vegetables", pro: "50 g" },
  { k: "m3", t: "Pre-training", when: "60–90 min before", what: "Fruit or rice cakes + small protein source", pro: "20–25 g" },
  { k: "m4", t: "Dinner", when: "Post-training", what: "Largest carb serving of the day + protein + vegetables", pro: "50 g" },
  { k: "m5", t: "Evening · optional", when: "If hungry", what: "Quark or casein", pro: "25 g" },
];
const STAPLES = "Magerquark (~12 g/100 g) · Skyr · Hüttenkäse · Puten- & Hähnchenbrust · Kabeljau & Seelachs · Harzer Käse (~30 g/100 g) · Eiweißbrot · Linsen · whey isolate to close gaps";
const ALCOHOL_RULES = [
  ["Budget, don't ban", "Up to 2 drinks on one evening per week, never within 24 h of a lower-body session."],
  ["The exchange rate", "Each drink ≈150 kcal: cut ~250 kcal of carbs the same day OR add 20 min Zone 2 the next. One, not both."],
  ["TDY events", "Protein first at the meal, water between drinks, log the count in Today. Budgeted drinks change nothing; unbudgeted ones add up."],
];
const ADJUST_RULES = [
  ["0.8–1.2 kg/wk", "Change nothing", "sage"],
  ["> 1.4 kg/wk × 2 wks", "Add 150 kcal of carbs to training days — you're outrunning muscle retention", "behind"],
  ["< 0.5 kg/wk × 2 wks", "Cut 150 kcal of carbs OR add 15 min Sunday Zone 2 — one, not both", "behind"],
  ["Flat × 3 wks", "Audit the log before cutting: untracked oils, drinks, and portion drift cause almost all true plateaus", "camel"],
  ["Strength falling at wk 5", "Raise intake 200 kcal and accept a slower rate — muscle is the asset", "camel"],
];

/* ── Language quiz banks — deterministic daily rotation ── */
const QUIZ_DE = [
  { q: "Politely order: 'I would like a coffee.'", o: ["Ich hätte gern einen Kaffee.", "Ich will Kaffee.", "Gib mir Kaffee."], a: 0, n: "'Ich hätte gern…' is the all-purpose polite order — restaurants, bakeries, everywhere." },
  { q: "'Wie geht's?' means…", o: ["Where are you going?", "How are you?", "What time is it?"], a: 1, n: "Short for 'Wie geht es dir/Ihnen?'" },
  { q: "'Entschuldigung, wo ist der Bahnhof?'", o: ["Excuse me, where is the station?", "Sorry, when is the train?", "Excuse me, who is the driver?"], a: 0, n: "Bahnhof = train station; Hauptbahnhof = main station." },
  { q: "Ask for the bill:", o: ["Das Essen, bitte.", "Die Rechnung, bitte.", "Der Preis, bitte."], a: 1, n: "Or 'Zahlen, bitte' — to pay, please." },
  { q: "'Ich verstehe nicht.' means…", o: ["I don't agree.", "I don't understand.", "I can't hear."], a: 1, n: "Your most useful sentence for the next month. Pair with 'Langsamer, bitte' — slower, please." },
  { q: "___ Wein (the wine)", o: ["das", "die", "der"], a: 2, n: "der Wein — masculine, like most alcoholic drinks except das Bier." },
  { q: "'Können Sie das bitte wiederholen?'", o: ["Can you please repeat that?", "Can you please translate that?", "Can you please write that?"], a: 0, n: "wiederholen = to repeat (wieder = again + holen = fetch)." },
  { q: "'Feierabend' means…", o: ["a public holiday", "the end of the working day", "a party evening"], a: 1, n: "Untranslatable and beloved. 'Schönen Feierabend!' is the 17:00 goodbye at any German office." },
  { q: "'Schönes Wochenende!'", o: ["Beautiful weather!", "Have a nice weekend!", "See you next week!"], a: 1, n: "Standard Friday farewell." },
  { q: "___ Bier (the beer)", o: ["das", "der", "die"], a: 0, n: "das Bier — one of the few neuter drinks." },
  { q: "'I speak only a little German.'", o: ["Ich spreche nur ein bisschen Deutsch.", "Ich spreche klein Deutsch.", "Ich habe wenig Deutsch."], a: 0, n: "'ein bisschen' = a little bit. Saying this well ironically proves otherwise." },
  { q: "'Gern geschehen' is the reply to…", o: ["Entschuldigung", "Danke", "Hallo"], a: 1, n: "= 'you're welcome', literally 'gladly happened'." },
  { q: "'lecker' means…", o: ["delicious", "expensive", "empty"], a: 0, n: "What you'll say about the Riesling on 21 August." },
  { q: "'Ich muss morgen arbeiten.'", o: ["I want to work tomorrow.", "I have to work tomorrow.", "I worked yesterday."], a: 1, n: "müssen = must/have to; morgen = tomorrow (but 'der Morgen' = morning)." },
  { q: "The opposite of 'teuer' (expensive):", o: ["billig", "klein", "schwer"], a: 0, n: "billig = cheap; günstig = good value (the politer word)." },
  { q: "'halb acht' is what time?", o: ["8:30", "7:30", "8:00"], a: 1, n: "The classic trap: German 'half eight' means half-way TO eight. Miss this and you're an hour late." },
  { q: "'das Frühstück' means…", o: ["breakfast", "early train", "spring"], a: 0, n: "früh = early + Stück = piece." },
  { q: "Order two glasses of Riesling:", o: ["Zwei Gläser Riesling, bitte.", "Zwei Riesling Glas, bitte.", "Doppel Riesling, bitte."], a: 0, n: "Field-testable on 21 August at the Weinwoche." },
  { q: "'Es tut mir leid.' means…", o: ["It hurts me.", "I'm sorry.", "I'm tired."], a: 1, n: "Literally 'it does me sorrow'. For small stuff, 'Entschuldigung' suffices." },
  { q: "'Wie viel kostet das?'", o: ["How much does that cost?", "How long does that take?", "What is that made of?"], a: 0, n: "kosten = to cost, same Latin root (constare) as Italian 'costare'." },
  { q: "'Ich freue mich.' means…", o: ["I'm free.", "I'm glad / looking forward.", "I'm early."], a: 1, n: "'Ich freue mich auf…' = I'm looking forward to… — the warmest phrase in office German." },
  { q: "Plural of 'die Frau':", o: ["die Frauen", "die Fraus", "das Frauen"], a: 0, n: "Plural article is always 'die', whatever the singular gender." },
  { q: "'Bis später!'", o: ["Until later! / See you later!", "Best wishes!", "Good night!"], a: 0, n: "bis = until. Bis morgen, bis Montag, bis gleich (in a moment)." },
  { q: "'Ich wohne in Wiesbaden.'", o: ["I work in Wiesbaden.", "I live in Wiesbaden.", "I was born in Wiesbaden."], a: 1, n: "wohnen = to reside; leben = to live in the broader sense." }];

const QUIZ_LA = [
  { q: "'bellum' means…", o: ["beautiful", "war", "city"], a: 1, n: "False friend for an Italian speaker — 'bello' is beautiful, but bellum is war (cf. It. 'bellico')." },
  { q: "'urbs' means…", o: ["city", "world", "crowd"], a: 0, n: "THE city meant Rome — Italian keeps it in 'urbe' and 'urbano'." },
  { q: "The subject of a sentence takes which case?", o: ["accusative", "genitive", "nominative"], a: 2, n: "Nominative names, accusative receives, genitive possesses — the core triangle." },
  { q: "'amat' means…", o: ["he/she loves", "they love", "I love"], a: 0, n: "-t = third person singular. Amo, amas, amat — same skeleton Italian inherited: amo, ami, ama." },
  { q: "In SPQR, the '-que' in 'Populusque' means…", o: ["of", "and", "for"], a: 1, n: "Senatus Populusque Romanus — 'the Senate AND people of Rome'. -que glues 'and' onto a word's tail." },
  { q: "'aqua' means…", o: ["water", "sky", "field"], a: 0, n: "Identical in Italian minus a letter. Your Italian is a master key for Latin vocabulary." },
  { q: "'milites' means…", o: ["miles", "soldiers", "walls"], a: 1, n: "Singular 'miles' = soldier. Italian 'militare'. Every page of Caesar contains this word." },
  { q: "'Gallia est omnis divisa in partes tres' opens which work?", o: ["Livy, Ab Urbe Condita", "Caesar, De Bello Gallico", "Tacitus, Annales"], a: 1, n: "The traditional first real text for Latin learners — and a primary source you'll read for the PhD." },
  { q: "'rex' means…", o: ["law", "king", "thing"], a: 1, n: "Italian 're'. The Romans' hatred of the word shaped 500 years of the Republic." },
  { q: "'non' means…", o: ["not", "now", "nine"], a: 0, n: "Unchanged into Italian. Some things survive 2,000 years intact." },
  { q: "'magnus' means…", o: ["great, large", "bad", "new"], a: 0, n: "Pompeius Magnus, Carolus Magnus (Charlemagne), It. 'magno'." },
  { q: "'esse' is the infinitive of…", o: ["to eat", "to be", "to see"], a: 1, n: "sum, es, est — Italian 'essere' descends directly. The most irregular and most essential verb." },
  { q: "The '-orum' ending signals…", o: ["genitive plural", "accusative singular", "dative singular"], a: 0, n: "'of the ___s': bellorum = of the wars, Romanorum = of the Romans." },
  { q: "'pax' means…", o: ["peace", "part", "punishment"], a: 0, n: "Pax Romana; Italian 'pace'." },
  { q: "'imperator' originally meant…", o: ["emperor by birth", "a victorious commander", "a senator"], a: 1, n: "A title troops acclaimed after victory — Augustus turned an army honour into a throne. PhD material in one word." },
  { q: "'vale' means…", o: ["farewell", "valley", "strength"], a: 0, n: "Literally 'be strong/well' — how Roman letters end. Plural: valete." },
  { q: "'et' means…", o: ["and", "but", "or"], a: 0, n: "Italian 'e'. 'Et tu, Brute' — Shakespeare's Latin, but grammatical." },
  { q: "'Romam ire' (to go to Rome) — why accusative 'Romam'?", o: ["motion toward takes accusative", "cities are always accusative", "ire demands it"], a: 0, n: "Motion toward a city drops the preposition and takes the accusative — a classic early grammar landmark." }];

/* ── Daily lesson concepts — one per language per day, taught before the quiz ── */
const LESSON_DE = [
  { t: "The three genders", b: "Every German noun is der (m), die (f), or das (n) — and the gender is part of the word, not logic. Learn nouns WITH their article from day one: 'der Wein', never just 'Wein'. Rule worth its weight: words ending in -ung, -heit, -keit are always die." },
  { t: "Verb second (V2)", b: "In a German main clause the conjugated verb is ALWAYS the second element, whatever comes first: 'Heute trinke ich Kaffee' — today drink I coffee. Front-load time or place for emphasis, but the verb never leaves slot two." },
  { t: "Sie vs. du", b: "Sie (capital S) is formal 'you' — colleagues, shops, strangers. du is family and friends. In a German office, wait for the senior person to offer 'du' (das Du anbieten). When hosting on 21 Aug: Sie until invited otherwise." },
  { t: "Separable verbs", b: "Many verbs split: the prefix flies to the end. 'aufstehen' (get up) → 'Ich stehe um sechs auf' — I get up at six. The sentence isn't finished until the last word lands. This is why Germans don't interrupt." },
  { t: "Time–Manner–Place", b: "Adverbs order themselves WHEN–HOW–WHERE: 'Ich fahre morgen mit dem Zug nach Berlin' — tomorrow, by train, to Berlin. English does the reverse; drilling this one pattern removes half of beginner word-salad." },
  { t: "Modal verbs", b: "können (can), müssen (must), wollen (want), dürfen (may), sollen (should), mögen (like). The modal takes slot two; the main verb goes to the END as an infinitive: 'Ich muss morgen arbeiten.' Master these six and you can say most of daily life." },
  { t: "The universal plural 'die'", b: "Whatever a noun's gender, its plural article is die: der Mann → die Männer, das Kind → die Kinder. One of German's rare freebies — bank it." },
  { t: "Clock times", b: "halb acht = 7:30 (half TO eight, not half past). Viertel nach sieben = 7:15, Viertel vor acht = 7:45. Germans also use the 24-hour clock in speech: 'um vierzehn Uhr' for a 14:00 meeting." },
  { t: "Two-way prepositions", b: "in, an, auf, über take dative for location (Ich bin im Büro — I'm in the office) but accusative for motion toward (Ich gehe ins Büro — I'm going into it). Location asks wo?, motion asks wohin? One question sorts every case." },
  { t: "W-questions", b: "wer (who), was (what), wo (where), wann (when), warum (why), wie (how), wie viel (how much). Question word first, verb second, done: 'Wo ist der Bahnhof?' You already know this pattern — it's English's." }];

const LESSON_LA = [
  { t: "A language of endings", b: "Latin has no articles and flexible word order because the ENDINGS carry the grammar. 'Marcus Iuliam amat' and 'Iuliam Marcus amat' both mean Marcus loves Julia — the -us marks the subject, the -am marks the object. Read endings first, order second." },
  { t: "The case triangle", b: "Start with three cases: nominative (subject), accusative (direct object), genitive ('of'). Rome's self-image in one line: 'Roma caput mundi' — Rome, head OF THE WORLD (mundi = genitive). The other cases join once these are reflex." },
  { t: "Verb endings = pronouns", b: "-o (I), -s (you), -t (he/she), -mus (we), -tis (you pl.), -nt (they). That's why Latin drops pronouns: amo already means 'I love'. Italian kept the whole system — amo, ami, ama, amiamo — so you know this in your bones." },
  { t: "The five declensions", b: "Nouns come in five families, each with its own ending set. First (-a: via, aqua) is mostly feminine; second (-us/-um: dominus, bellum) mostly masculine/neuter. Learn one model noun per family and thousands of words snap into place." },
  { t: "SOV by default", b: "Latin's neutral order is Subject–Object–Verb: 'Caesar Galliam vicit' — Caesar Gaul conquered. The verb usually lands last. Departures from SOV are emphasis — which is exactly what historians analyse in Roman speeches." },
  { t: "The infinitive in -re", b: "amare (to love), videre (to see), ducere (to lead), audire (to hear) — four conjugations, one -re signature. Italian kept most of them nearly intact: amare, vedere, sentire. You're not learning these; you're remembering them." },
  { t: "Enclitic -que", b: "-que staples 'and' onto the word it follows: Senatus Populusque Romanus. 'Arma virumque cano' — arms and the man I sing, the Aeneid's first line. Spotting -que instantly makes real texts readable." },
  { t: "No word for 'the'", b: "Latin never says 'the' or 'a' — 'urbs' is city, the city, or a city as context decides. Translating into English you supply the articles; reading, you stop missing them within a week." },
  { t: "Principal parts", b: "Dictionaries list verbs in four parts: amo, amare, amavi, amatum. Part three gives the perfect (amavi = I loved); part four builds participles. When you look up a verb, note all four — future-you needs them." },
  { t: "Why this matters for the PhD", b: "Epigraphy — inscriptions — is Roman history's raw evidence, and it's ALL abbreviations: SPQR, IMP CAES AVG, D M (Dis Manibus). Every abbreviation expands into the grammar you're drilling now. Today's case endings read tombstones and triumphal arches later." }];

/* ── Deutsch tab: flashcards (Leitner), sentence builder, speaking missions ── */
const DE_CARDS = [
  { id: "bahnhof", de: "der Bahnhof", en: "the train station" },
  { id: "rechnung", de: "die Rechnung", en: "the bill" },
  { id: "fruehstueck", de: "das Frühstück", en: "breakfast" },
  { id: "bestellen", de: "bestellen", en: "to order" },
  { id: "moechte", de: "ich möchte…", en: "I would like…" },
  { id: "links", de: "links", en: "left" },
  { id: "rechts", de: "rechts", en: "right" },
  { id: "geradeaus", de: "geradeaus", en: "straight ahead" },
  { id: "heute", de: "heute", en: "today" },
  { id: "morgen", de: "morgen", en: "tomorrow" },
  { id: "gestern", de: "gestern", en: "yesterday" },
  { id: "woche", de: "die Woche", en: "the week" },
  { id: "wochenende", de: "das Wochenende", en: "the weekend" },
  { id: "arbeiten", de: "arbeiten", en: "to work" },
  { id: "arbeit", de: "die Arbeit", en: "the work / job" },
  { id: "feierabend", de: "der Feierabend", en: "the end of the working day" },
  { id: "lecker", de: "lecker", en: "delicious" },
  { id: "teuer", de: "teuer", en: "expensive" },
  { id: "billig", de: "billig", en: "cheap" },
  { id: "wasser", de: "das Wasser", en: "the water" },
  { id: "wein", de: "der Wein", en: "the wine" },
  { id: "bier", de: "das Bier", en: "the beer" },
  { id: "termin", de: "der Termin", en: "the appointment" },
  { id: "besprechung", de: "die Besprechung", en: "the meeting" },
  { id: "vielleicht", de: "vielleicht", en: "maybe / perhaps" },
  { id: "natuerlich", de: "natürlich", en: "of course" },
  { id: "leider", de: "leider", en: "unfortunately" },
  { id: "genau", de: "genau", en: "exactly (the universal German agreement word)" },
  { id: "frau", de: "die Frau", en: "the woman / wife" },
  { id: "geburtstag", de: "der Geburtstag", en: "the birthday" },
  { id: "verstehen", de: "verstehen", en: "to understand" },
  { id: "langsamer", de: "Langsamer, bitte!", en: "Slower, please!" }];

const DE_SENTENCES = [
  { w: ["Ich", "hätte", "gern", "einen", "Kaffee"], en: "I would like a coffee.", tip: "The polite-order template." },
  { w: ["Heute", "trinke", "ich", "Wein"], en: "Today I'm drinking wine.", tip: "V2 rule: 'Heute' takes slot one, so the verb comes before 'ich'." },
  { w: ["Wo", "ist", "der", "Bahnhof"], en: "Where is the station?", tip: "Question word, then verb — same as English." },
  { w: ["Ich", "muss", "morgen", "arbeiten"], en: "I have to work tomorrow.", tip: "Modal in slot two, main verb exiled to the end." },
  { w: ["Wir", "treffen", "uns", "um", "halb", "acht"], en: "We're meeting at 7:30.", tip: "halb acht = half TO eight." },
  { w: ["Ich", "stehe", "um", "sechs", "auf"], en: "I get up at six.", tip: "Separable verb: aufstehen splits, 'auf' lands last." },
  { w: ["Meine", "Frau", "hat", "im", "Dezember", "Geburtstag"], en: "My wife has her birthday in December.", tip: "The sentence this whole tab exists for." },
  { w: ["Ich", "spreche", "ein", "bisschen", "Deutsch"], en: "I speak a little German.", tip: "Say it well and nobody believes you." }];

const DE_MISSIONS = [
  "Order at the Bäckerei entirely in German — no English fallback.",
  "Greet the gym front desk auf Deutsch and add one sentence.",
  "10-minute German-only dinner segment with your wife.",
  "Watch 10 minutes of Tagesschau (or listen to DW's 'Langsam gesprochene Nachrichten').",
  "Order your coffee at work in German, including one follow-up sentence.",
  "Ask a colleague: 'Wie war dein Wochenende?' — and survive the answer.",
  "Label 5 objects at home with sticky notes (article included: DER Kühlschrank).",
  "Count your gym sets and reps in German for one full session.",
  "Text your wife one complete German sentence.",
  "Order at a restaurant in German, drinks and food.",
  "Make weather small talk with a neighbour: 'Schönes Wetter heute, oder?'",
  "Read one short German news article and note 3 new words into the chat below."];

const DE_PHASES = [
  ["Aug", "Überleben", "Ordering, greetings, numbers & time, W-questions"],
  ["Sep", "Alltag", "Daily routine, modals, first past tense (Perfekt)"],
  ["Okt", "Gespräch", "Opinions, connectors (weil, aber, dann), longer answers"],
  ["Nov", "Fluss", "Storytelling, Konjunktiv II politeness, faster reps"],
  ["Dez", "Konsolidierung", "Review + the birthday conversation, live"]];

const speak = (t) => {
  try { const u = new SpeechSynthesisUtterance(t); u.lang = "de-DE"; u.rate = 0.9;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch {}
};

const AFFIRM_PROMPTS = [
  "What is one thing today's training buys your future self?",
  "Name the version of you standing on the scale on 06 October.",
  "What did you do yesterday that you're quietly proud of?",
  "One sentence: why does this block matter beyond the number?",
  "What would today look like if it were easy?",
  "Which habit is becoming automatic? Say it out loud.",
  "What are you grateful your body could do this week?"];

/* ── Quote libraries ── */
const ROME = [
  { la: "Faber est suae quisque fortunae.", en: "Every man is the maker of his own fortune.", by: "Appius Claudius Caecus",
    src: "Sententiae (via Sallust)", ctx: "Censor of 312 BC — builder of the Via Appia and Rome's first aqueduct. The oldest surviving Latin prose maxim.", url: "https://en.wikipedia.org/wiki/Appius_Claudius_Caecus" },
  { la: "Gutta cavat lapidem, non vi sed saepe cadendo.", en: "The drop hollows the stone — not by force, but by falling often.", by: "Ovid",
    src: "Epistulae ex Ponto IV", ctx: "Written in exile on the Black Sea, where Ovid spent his last decade after Augustus banished him in AD 8.", url: "https://en.wikipedia.org/wiki/Epistulae_ex_Ponto" },
  { la: "Festina lente.", en: "Make haste slowly.", by: "Augustus",
    src: "Suetonius, Life of Augustus 25", ctx: "The emperor's favourite maxim — he considered haste the mark of a careless commander.", url: "https://en.wikipedia.org/wiki/Festina_lente" },
  { la: "Amat victoria curam.", en: "Victory favours preparation.", by: "Catullus",
    src: "Carmen 62", ctx: "From a wedding hymn, c. 55 BC; later the motto of military academies across Europe.", url: "https://en.wikipedia.org/wiki/Catullus" },
  { la: "Ignis aurum probat, miseria fortes viros.", en: "Fire tests gold; adversity tests the strong.", by: "Seneca",
    src: "De Providentia 5", ctx: "Stoic essay answering why bad things happen to good men: hardship is training, not punishment.", url: "https://en.wikipedia.org/wiki/De_Providentia" },
  { la: "Fortes fortuna adiuvat.", en: "Fortune favours the brave.", by: "Terence",
    src: "Phormio (161 BC)", ctx: "A comedy line that outlived the play — Pliny the Elder reportedly quoted it sailing toward Vesuvius in AD 79.", url: "https://en.wikipedia.org/wiki/Fortune_favours_the_bold" },
  { la: "Vires acquirit eundo.", en: "It gathers strength as it goes.", by: "Virgil",
    src: "Aeneid IV.175", ctx: "Describing Rumor racing through Carthage — repurposed for centuries as a motto for momentum.", url: "https://en.wikipedia.org/wiki/Aeneid" },
  { la: "Sapere aude.", en: "Dare to know.", by: "Horace",
    src: "Epistles I.2", ctx: "A minor line until Kant made it the motto of the entire Enlightenment in 1784.", url: "https://en.wikipedia.org/wiki/Sapere_aude" },
  { la: "Dum spiro, spero.", en: "While I breathe, I hope.", by: "attr. Cicero",
    src: "attributed; echoes Letters to Atticus", ctx: "Now the state motto of South Carolina, among others.", url: "https://en.wikipedia.org/wiki/Dum_spiro_spero" },
  { la: "Nemo sine vitio est.", en: "No one is without fault.", by: "Seneca the Elder",
    src: "Controversiae II", ctx: "From a collection of courtroom rhetoric exercises that trained a generation of Roman lawyers.", url: "https://en.wikipedia.org/wiki/Seneca_the_Elder" }];

const ON_THIS_DAY = {
  "08-04": { t: "1936 — Jesse Owens wins the 100 m at the Berlin Olympics, the first of four golds under Hitler's gaze.", url: "https://en.wikipedia.org/wiki/Jesse_Owens" },
  "08-06": { t: "1926 — Gertrude Ederle becomes the first woman to swim the English Channel, beating the men's record by nearly two hours.", url: "https://en.wikipedia.org/wiki/Gertrude_Ederle" },
  "08-10": { t: "1793 — The Louvre opens as a public museum: royal collection becomes public property.", url: "https://en.wikipedia.org/wiki/Louvre" },
  "08-13": { t: "1961 — Berlin wakes to barbed wire: construction of the Berlin Wall begins overnight.", url: "https://en.wikipedia.org/wiki/Berlin_Wall" },
  "08-15": { t: "1969 — Woodstock opens on a dairy farm in upstate New York; 400,000 attend a festival planned for 50,000.", url: "https://en.wikipedia.org/wiki/Woodstock" },
  "08-21": { t: "1911 — The Mona Lisa is stolen from the Louvre by a handyman; the two-year search makes it the most famous painting on Earth.", url: "https://en.wikipedia.org/wiki/Mona_Lisa" },
  "08-28": { t: "1963 — Martin Luther King Jr. delivers 'I Have a Dream' to a quarter-million people in Washington.", url: "https://en.wikipedia.org/wiki/I_Have_a_Dream" },
  "09-02": { t: "31 BC — Octavian defeats Antony and Cleopatra at Actium, clearing his path to become Augustus.", url: "https://en.wikipedia.org/wiki/Battle_of_Actium" },
  "09-22": { t: "1862 — Lincoln issues the preliminary Emancipation Proclamation, five days after Antietam.", url: "https://en.wikipedia.org/wiki/Emancipation_Proclamation" },
  "09-28": { t: "1928 — Fleming notices a mould killing bacteria in a discarded petri dish: penicillin.", url: "https://en.wikipedia.org/wiki/Alexander_Fleming" },
  "10-03": { t: "1990 — German reunification. Tag der Deutschen Einheit.", url: "https://en.wikipedia.org/wiki/German_reunification" },
  "10-05": { t: "1962 — The Beatles release their first single, 'Love Me Do'.", url: "https://en.wikipedia.org/wiki/Love_Me_Do" },
};
const HISTORY_FALLBACK = [
  { t: "1953 — Hillary and Norgay had trained for years; the summit took one morning.", url: "https://en.wikipedia.org/wiki/1953_British_Mount_Everest_expedition" },
  { t: "480 BC — At Thermopylae, preparation and terrain held off an empire for three days.", url: "https://en.wikipedia.org/wiki/Battle_of_Thermopylae" },
  { t: "1969 — Apollo 11's checklists were rehearsed until boring. Then they worked.", url: "https://en.wikipedia.org/wiki/Apollo_11" },
  { t: "1954 — Bannister breaks 4:00 for the mile; within a year, three others follow. Limits are often beliefs.", url: "https://en.wikipedia.org/wiki/Four-minute_mile" },
  { t: "218 BC — Hannibal crosses the Alps: logistics beats heroics.", url: "https://en.wikipedia.org/wiki/Hannibal%27s_crossing_of_the_Alps" },
  { t: "1911 — Amundsen reaches the South Pole on schedule, on routine, on margin.", url: "https://en.wikipedia.org/wiki/Amundsen%27s_South_Pole_expedition" },
  { t: "1440s — Gutenberg's press: small daily output, compounding forever.", url: "https://en.wikipedia.org/wiki/Printing_press" },
  { t: "1869 — The transcontinental railroad meets at Promontory: two teams, one glide path.", url: "https://en.wikipedia.org/wiki/First_transcontinental_railroad" },
  { t: "1963 — The Washington–Moscow hotline opens: communication as infrastructure.", url: "https://en.wikipedia.org/wiki/Moscow%E2%80%93Washington_hotline" },
  { t: "1815 — Waterloo: won, as the saying goes, on the playing fields — fitness as strategy.", url: "https://en.wikipedia.org/wiki/Battle_of_Waterloo" }];

const GERMAN = [
  { de: "Übung macht den Meister.", en: "Practice makes the master.",
    src: "German proverb", ctx: "From the medieval craft-guild tradition — mastery (Meisterschaft) was a formal rank earned by years of supervised repetition." },
  { de: "Wer rastet, der rostet.", en: "He who rests, rusts.",
    src: "German proverb", ctx: "A machinist's-era saying; German gyms still print it on walls." },
  { de: "Aller Anfang ist schwer.", en: "Every beginning is hard.",
    src: "German proverb", ctx: "Popularised through Goethe's use of it; the standard consolation for week one of anything." },
  { de: "Ohne Fleiß kein Preis.", en: "No prize without effort.",
    src: "German proverb", ctx: "A rhymed schoolroom maxim descending from Hesiod's 'the gods placed sweat before excellence.'" },
  { de: "Es ist noch kein Meister vom Himmel gefallen.", en: "No master has ever fallen from the sky.",
    src: "German proverb", ctx: "The guild tradition again: everyone you admire was once a beginner." },
  { de: "Der Weg ist das Ziel.", en: "The way is the goal.",
    src: "modern aphorism", ctx: "Often misattributed to Confucius; in German it became the motto of process over outcome." },
  { de: "Was mich nicht umbringt, macht mich stärker.", en: "What does not kill me makes me stronger.",
    src: "Nietzsche, Götzen-Dämmerung (1888), 'Sprüche und Pfeile' 8", ctx: "Written months before his collapse — read it as a training principle, not a medical one.",
    url: "https://en.wikipedia.org/wiki/Twilight_of_the_Idols" },
  { de: "Es ist nicht genug zu wissen, man muss auch anwenden.", en: "Knowing is not enough; we must apply.",
    src: "attr. Goethe", ctx: "The full attributed line continues: 'Wollen ist nicht genug, man muss auch tun' — willing is not enough, we must do.",
    url: "https://en.wikipedia.org/wiki/Johann_Wolfgang_von_Goethe" },
  { de: "Auch der längste Weg beginnt mit dem ersten Schritt.", en: "Even the longest road begins with the first step.",
    src: "proverb, after Laozi", ctx: "The German rendering of Tao Te Ching ch. 64 — 'a journey of a thousand miles…'",
    url: "https://en.wikipedia.org/wiki/A_journey_of_a_thousand_miles_begins_with_a_single_step" }];

const ROTATING = [
  { d: "Economics", q: "By failing to prepare, you are preparing to fail.", by: "attr. Benjamin Franklin",
    src: "attributed; not found in his writings", ctx: "Whoever said it, it compounds like interest — Franklin's actual specialty.",
    url: "https://en.wikipedia.org/wiki/Benjamin_Franklin" },
  { d: "Politics", q: "Politics is the art of the possible.", by: "Otto von Bismarck",
    src: "interview, 1867", ctx: "The Iron Chancellor's whole method in one line: work with the constraints that exist, not the ones you wish existed.",
    url: "https://en.wikipedia.org/wiki/Otto_von_Bismarck" },
  { d: "Strategy", q: "Plans are worthless, but planning is everything.", by: "Dwight D. Eisenhower",
    src: "speech to the National Defense Executive Reserve, 1957", ctx: "From the man who planned D-Day — the plan broke on contact; the planning didn't.",
    url: "https://en.wikipedia.org/wiki/Dwight_D._Eisenhower" },
  { d: "History", q: "The secret of happiness is freedom, and the secret of freedom is courage.", by: "Thucydides",
    src: "Pericles' Funeral Oration, History of the Peloponnesian War II", ctx: "Athens, 431 BC — a eulogy for the war dead that became a definition of the open society.",
    url: "https://en.wikipedia.org/wiki/Pericles%27_Funeral_Oration" },
  { d: "Economics", q: "When the facts change, I change my mind.", by: "attr. J. M. Keynes",
    src: "attributed", ctx: "The epistemics behind your own adjustment protocol: react to two-week trends, not to opinions.",
    url: "https://en.wikipedia.org/wiki/John_Maynard_Keynes" },
  { d: "Strategy", q: "Every battle is won before it is fought.", by: "attr. Sun Tzu",
    src: "after The Art of War III", ctx: "The 5th-century BC text's core claim: preparation decides; the event only reveals.",
    url: "https://en.wikipedia.org/wiki/The_Art_of_War" },
  { d: "Politics", q: "Everyone sees what you appear to be; few experience what you really are.", by: "Machiavelli",
    src: "The Prince, ch. 18 (1513)", ctx: "Written in exile after torture and dismissal — advice from a man who had watched appearances beat substance.",
    url: "https://en.wikipedia.org/wiki/The_Prince" },
  { d: "History", q: "Study the past if you would define the future.", by: "attr. Confucius",
    src: "attributed, after Analects II.11", ctx: "The Analects' actual line: 'reviewing the old as a means of knowing the new.'",
    url: "https://en.wikipedia.org/wiki/Confucius" }];

const MEASURES = [
  { k: "waist", label: "Waist at navel", tip: "Most informative single site. Morning, fasted, relaxed exhale, tape parallel to the floor." },
  { k: "neck", label: "Neck", tip: "Feeds the Navy body-fat formula with waist and hips." },
  { k: "hips", label: "Hips", tip: "Widest point." },
  { k: "chest", label: "Chest", tip: "Nipple line, mid-breath." },
  { k: "arm", label: "Upper arm", tip: "Flexed, at the peak. Same arm every time." },
  { k: "thigh", label: "Thigh", tip: "Mid-point hip crease to knee. Mark the spot." }];

const TESTS = [
  { k: "bench", label: "DB flat bench — heaviest 8", unit: "kg", g: "Strength", tip: "Per-hand. Holding this while weight falls = muscle retained." },
  { k: "squat", label: "Barbell back squat — heaviest 8", unit: "kg", g: "Strength", tip: "Total bar weight, full depth. Yesterday's session is your baseline." },
  { k: "dead", label: "Barbell deadlift — heaviest 6", unit: "kg", g: "Strength", tip: "Total bar weight, conventional from the floor." },
  { k: "carry", label: "Farmer's carry 40 m", unit: "kg", g: "Strength", tip: "Per-hand, unbroken." },
  { k: "cooper", label: "12-min Cooper test", unit: "m", g: "Engine", tip: "Distance in 12 min, same surface each time." },
  { k: "rhr", label: "Resting heart rate", unit: "bpm", g: "Engine", tip: "Weekly average of morning readings. Falling = engine growing." },
  { k: "rec60", label: "60-sec recovery HR drop", unit: "bpm", g: "Engine", tip: "HR fall 60 sec after a hard interval." },
  { k: "toe", label: "Toe touch — floor gap", unit: "cm", g: "Mobility", tip: "Knees straight. Negative = past your toes." },
  { k: "ankle", label: "Knee-to-wall ankle test", unit: "cm", g: "Mobility", tip: "Toe-to-wall with knee on wall, heel down." },
  { k: "sqhold", label: "Deep squat hold", unit: "sec", g: "Mobility", tip: "Heels down, unsupported, upright." },
  { k: "smm", label: "Skeletal muscle mass (scan)", unit: "kg", g: "Composition", tip: "Baseline 43 kg — the number the program defends." },
  { k: "bf", label: "Body fat (scan)", unit: "%", g: "Composition", tip: "Baseline 34.2%. Expect ~27–28% at target." }];

/* ════════════════════  UTILS  ════════════════════ */

const iso = (d) => d.toISOString().slice(0, 10);
const parse = (s) => new Date(s + "T12:00:00");
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const pretty = (s) => parse(s).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
const cycleFor = (date) => CYCLES.find((c) => date >= c.start && date <= c.end) || null;
/* Mobility auto-progression: timed holds grow +10 s per week (cap +60 s); deload resets to baseline; rounds/reps stay fixed. */
const scaleDose = (dose, week, deload) => {
  if (!week || deload || week <= 1) return dose;
  const inc = Math.min((week - 1) * 10, 60);
  const secM = dose.match(/^(\d+)\s*sec(.*)$/);
  if (secM) return `${+secM[1] + inc} sec${secM[2]}`;
  const minM = dose.match(/min/);
  if (minM) return `${dose} +${inc}s`;
  return dose;
};
const inTravel = (date) => TRAVEL_RANGES.find(([a, b]) => date >= a && date <= b);
const repRange = (s) => { const m = s.match(/(\d+)[–-](\d+)/); if (m) return [+m[1], +m[2]];
  const one = s.match(/(\d+)/); return one ? [+one[1], +one[1]] : [null, null]; };

/* ════════════════════  ATOMS  ════════════════════ */

function Info({ tip }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6 }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, border: `1px solid ${C.rule}`,
        borderRadius: "50%", width: 15, height: 15, display: "inline-flex", alignItems: "center",
        justifyContent: "center", cursor: "help", userSelect: "none" }}>i</span>
      {open && (
        <span style={{ position: "absolute", zIndex: 60, bottom: "130%", left: "50%",
          transform: "translateX(-50%)", width: 235, background: C.panel3,
          border: `1px solid ${C.rule}`, borderRadius: 8, padding: "10px 12px",
          fontSize: 12, lineHeight: 1.5, color: C.ink, fontFamily: SANS,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)", pointerEvents: "none" }}>{tip}</span>
      )}
    </span>
  );
}

const Label = ({ children, tip, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
    color: C.dimmer, marginBottom: 8, display: "flex", alignItems: "center", ...style }}>
    {children}{tip && <Info tip={tip} />}</div>
);

const Panel = ({ children, style, glow }) => (
  <div style={{ background: glow
      ? `linear-gradient(135deg, ${C.panel} 0%, ${C.panel2} 100%)` : C.panel,
    border: `1px solid ${C.ruleSoft}`, borderRadius: 14, padding: 18, ...style }}>{children}</div>
);

function Ring({ value, goal, color, label, unit, invert }) {
  const size = 100, sw = 9, r = (size - sw) / 2, circ = 2 * Math.PI * r;
  const frac = goal > 0 && value != null ? Math.min(1, value / goal) : 0;
  const over = invert && value != null && value > goal;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.panel3} strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={over ? C.behind : color} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)}
            style={{ transition: "stroke-dashoffset .5s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 17, color: C.ink, lineHeight: 1 }}>
            {value != null ? (value >= 1000 ? (value / 1000).toFixed(1) + "k" : value) : "—"}</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.dimmer, marginTop: 3 }}>
            /{goal >= 1000 ? goal / 1000 + "k" : goal}{unit}</div>
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
        color: C.dim }}>{label}</div>
    </div>
  );
}

function Num({ value, onChange, suffix, placeholder, small }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      <input type="number" inputMode="decimal" value={value ?? ""} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        onFocus={(e) => (e.target.style.borderColor = C.camel)}
        onBlur={(e) => (e.target.style.borderColor = "transparent")}
        style={{ flex: 1, minWidth: 0, width: "100%", background: C.panel3,
          border: "1px solid transparent", borderRadius: 8, color: C.ink, fontFamily: MONO,
          fontSize: small ? 13 : 16, padding: small ? "7px 9px" : "9px 11px", outline: "none",
          MozAppearance: "textfield", transition: "border-color .15s" }} />
      {suffix && <span style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer }}>{suffix}</span>}
    </div>
  );
}

function Toggle({ on, onClick, children, color = C.camel }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: on ? color : C.panel3, border: "none", borderRadius: 20,
      cursor: "pointer", color: on ? C.ground : C.dim, fontFamily: MONO, fontSize: 11,
      letterSpacing: "0.08em", textTransform: "uppercase", padding: "11px 12px",
      fontWeight: on ? 700 : 400, transition: "all .15s" }}>
      {on ? "✓ " : ""}{children}</button>
  );
}

function Scale5({ value, onChange, anchors, lowLabel, highLabel, color = C.camel }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 5 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(value === n ? null : n)} title={anchors?.[n]} style={{
            flex: 1, padding: "9px 0", cursor: "pointer", borderRadius: 10, border: "none",
            background: value === n ? color : C.panel3,
            color: value === n ? C.ground : C.dim, fontFamily: MONO, fontSize: 13,
            fontWeight: value === n ? 700 : 400, transition: "all .12s" }}>{n}</button>
        ))}
      </div>
      <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 10, color: value ? C.dim : C.dimmer,
        minHeight: 14, lineHeight: 1.4 }}>
        {value && anchors ? anchors[value] : `${lowLabel} → ${highLabel}`}</div>
    </div>
  );
}

const Field = ({ label, tip, children }) => (
  <div><Label tip={tip} style={{ marginBottom: 6 }}>{label}</Label>{children}</div>
);
const Stat = ({ label, value, tone, tip }) => (
  <div><Label tip={tip} style={{ marginBottom: 3 }}>{label}</Label>
    <div style={{ fontFamily: MONO, fontSize: 17, color: tone || C.ink }}>{value}</div></div>
);
const DemoLink = ({ q }) => (
  <a href={yt(q)} target="_blank" rel="noopener noreferrer"
    style={{ fontFamily: MONO, fontSize: 10, color: C.teal, textDecoration: "none",
      letterSpacing: "0.06em", whiteSpace: "nowrap" }}
    onClick={(e) => e.stopPropagation()}>▸ DEMO</a>
);

/* ════════════════════  APP  ════════════════════ */

export default function LifeOS() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [tab, setTab] = useState("today");
  const [cursor, setCursor] = useState(iso(new Date()));
  const [bCursor, setBCursor] = useState(iso(new Date()));
  const [openEx, setOpenEx] = useState(null);
  const [muscle, setMuscle] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importTxt, setImportTxt] = useState("");
  const [importMsg, setImportMsg] = useState(null);

  const runImport = () => {
    try {
      const inc = JSON.parse(importTxt);
      if (!inc || typeof inc !== "object" || (!inc.days && !inc.lifts && !inc.measures && !inc.tests))
        throw new Error("shape");
      const mergeMap = (a = {}, b = {}) => {
        const out = { ...a };
        Object.keys(b).forEach((k) => {
          out[k] = a[k] && typeof a[k] === "object" && typeof b[k] === "object"
            ? { ...a[k], ...b[k] } : b[k];
        });
        return out;
      };
      const merged = { ...data,
        days: mergeMap(data.days, inc.days),
        lifts: mergeMap(data.lifts, inc.lifts),
        measures: mergeMap(data.measures, inc.measures),
        tests: mergeMap(data.tests, inc.tests),
        height: inc.height ?? data.height };
      persist(merged);
      const n = Object.keys(inc.days || {}).length + Object.keys(inc.lifts || {}).length;
      setImportMsg({ ok: true, t: `Merged ${n} day/session records into this device.` });
      setImportTxt("");
    } catch {
      setImportMsg({ ok: false, t: "Couldn't read that — paste the complete JSON from the other device's COPY ALL, including the outer { }." });
    }
  };

  const copyExport = async () => {
    const txt = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.getElementById("export-ta");
      if (ta) { ta.select(); document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    }
  };

  useEffect(() => {
    (async () => {
      const blank = { v: 4, days: {}, measures: {}, tests: {}, lifts: {} };
      try {
        const res = await window.storage.get(KEY);
        setData(res ? { ...blank, ...JSON.parse(res.value) } : blank);
      } catch { setData(blank); }
      setStatus("ready");
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setData(next); setStatus("saving");
    try {
      await window.storage.set(KEY, JSON.stringify(next));
      setStatus("saved"); setTimeout(() => setStatus("ready"), 900);
    } catch { setStatus("offline"); }
  }, []);

  const setDay = (d, f, v) =>
    persist({ ...data, days: { ...data.days, [d]: { ...(data.days[d] || {}), [f]: v } } });
  const setMeasure = (d, f, v) =>
    persist({ ...data, measures: { ...data.measures, [d]: { ...(data.measures[d] || {}), [f]: v } } });
  const setTest = (k, s, v) =>
    persist({ ...data, tests: { ...data.tests, [k]: { ...(data.tests[k] || {}), [s]: v } } });
  const setSet = (d, exK, i, f, v) => {
    const day = data.lifts[d] || {}; const rec = day[exK] || { sets: [] };
    const sets = [...(rec.sets || [])]; while (sets.length <= i) sets.push({});
    sets[i] = { ...sets[i], [f]: v };
    persist({ ...data, lifts: { ...data.lifts, [d]: { ...day, [exK]: { sets } } } });
  };
  const setField = (f, v) => persist({ ...data, [f]: v });

  const today = iso(new Date());
  const cyc = cycleFor(today) || CYCLES[0];
  const totalDays = dayDiff(cyc.start, cyc.end) + 1;

  const series = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(cyc.start, i);
      const target = cyc.startW + ((cyc.targetW - cyc.startW) * i) / (totalDays - 1);
      const win = [];
      for (let j = Math.max(0, i - 6); j <= i; j++) {
        const v = data.days[addDays(cyc.start, j)]?.w;
        if (typeof v === "number") win.push(v);
      }
      out.push({ date: d, short: parse(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        target: Number(target.toFixed(2)), weight: data.days[d]?.w ?? null,
        avg: win.length >= 3 ? Number((win.reduce((a, b) => a + b, 0) / win.length).toFixed(2)) : null });
    }
    return out;
  }, [data, cyc, totalDays]);

  const elapsed = Math.max(0, Math.min(dayDiff(cyc.start, today), totalDays - 1));
  const latest = useMemo(() => {
    for (let i = Math.min(elapsed, series.length - 1); i >= 0; i--) if (series[i]?.avg != null) return series[i];
    return null;
  }, [series, elapsed]);
  const gap = latest ? latest.target - latest.avg : null;
  const weekNo = Math.min(cyc.weeks, Math.floor(elapsed / 7) + 1);

  const streak = useCallback((field) => {
    if (!data) return 0;
    let n = 0;
    for (let i = 0; i < 300; i++) { if (data.days[addDays(today, -i)]?.[field]) n++; else break; }
    return n;
  }, [data, today]);

  const week7 = useMemo(() => {
    if (!data) return null;
    const acc = { kcal: [], pro: [], steps: [], sleep: [], hunger: [], drinks: 0, logged: 0 };
    for (let i = 0; i < 7; i++) {
      const e = data.days[addDays(today, -i)] || {};
      if (e.kcal != null) { acc.kcal.push(e.kcal); acc.logged++; }
      if (e.pro != null) acc.pro.push(e.pro);
      if (e.steps != null) acc.steps.push(e.steps);
      if (e.sleep != null) acc.sleep.push(e.sleep);
      if (e.hunger != null) acc.hunger.push(e.hunger);
      if (e.drinks != null) acc.drinks += e.drinks;
    }
    const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    return { kcal: avg(acc.kcal), pro: avg(acc.pro), steps: avg(acc.steps),
      sleep: avg(acc.sleep), hunger: avg(acc.hunger), drinks: acc.drinks, logged: acc.logged };
  }, [data, today]);

  const last14 = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      const e = data.days[d] || {};
      const dc = cycleFor(d);
      out.push({ short: parse(d).toLocaleDateString("en-GB", { day: "2-digit" }),
        kcal: e.kcal ?? null, tgt: dc ? dc.sched[parse(d).getDay()].kcal : null,
        pro: e.pro ?? null, pTgt: dc ? dc.protein : 190,
        sleep: e.sleep ?? null, rpe: e.rpe ?? null });
    }
    return out;
  }, [data, today]);

  const rhr30 = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(today, -i);
      out.push({ short: parse(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        rhr: data.days[d]?.rhr ?? null });
    }
    return out;
  }, [data, today]);

  const weeklyVol = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (let w = 1; w <= cyc.weeks; w++) {
      if (w > weekNo) { out.push({ wk: `W${w}`, t: null }); continue; }
      let t = 0;
      for (let d = 0; d < 7; d++) {
        const day = addDays(cyc.start, (w - 1) * 7 + d);
        const lifts = data.lifts[day] || {};
        Object.keys(lifts).forEach((k) => {
          if (EX_INC[k] == null || EX_INC[k] === 0) return;
          (lifts[k].sets || []).forEach((s) => {
            if (s.load != null && s.reps != null) t += s.load * s.reps; });
        });
      }
      out.push({ wk: `W${w}`, t: t > 0 ? Number((t / 1000).toFixed(2)) : null });
    }
    return out;
  }, [data, cyc, weekNo]);

  /* All-time records per exercise key: PR (heaviest set) + most recent session */
  const liftRecords = useMemo(() => {
    const rec = {};
    if (!data) return rec;
    Object.keys(data.lifts).sort().forEach((d) => {
      const day = data.lifts[d];
      Object.keys(day).forEach((k) => {
        const sets = (day[k].sets || []).filter((s) => s.load != null || s.reps != null);
        if (!sets.length) return;
        const r = rec[k] || (rec[k] = { pr: null, last: null });
        r.last = { date: d, sets };
        sets.forEach((s) => {
          if (s.load == null) return;
          if (!r.pr || s.load > r.pr.load || (s.load === r.pr.load && (s.reps ?? 0) > (r.pr.reps ?? 0)))
            r.pr = { load: s.load, reps: s.reps ?? null, date: d };
        });
      });
    });
    return rec;
  }, [data]);

  const verdict = useMemo(() => {
    if (!series.length || elapsed < 20) return null;
    const now = series[elapsed]?.avg ?? latest?.avg;
    let then = null;
    for (let i = Math.max(0, elapsed - 14); i <= elapsed - 10; i++) if (series[i]?.avg != null) { then = series[i].avg; break; }
    if (now == null || then == null) return null;
    const rate = (then - now) / 2;
    if (rate > 1.4) return { rate, text: "Faster than 1.4 kg/wk — add 150 kcal of carbs on training days.", tone: C.behind };
    if (rate < 0.5) return { rate, text: "Under 0.5 kg/wk — cut 150 kcal of carbs OR add 15 min to Sunday Zone 2. One, not both.", tone: C.behind };
    return { rate, text: "Rate is in the target band. Change nothing.", tone: C.sage };
  }, [series, elapsed, latest]);

  if (status === "loading" || !data) {
    return <div style={{ background: C.ground, minHeight: "100vh", display: "grid", placeItems: "center",
      fontFamily: MONO, color: C.dimmer, fontSize: 12, letterSpacing: "0.16em" }}>LOADING LOG…</div>;
  }

  /* cursor derivations */
  const cCyc = cycleFor(cursor);
  const sched = cCyc ? cCyc.sched[parse(cursor).getDay()] : null;
  const session = sched?.key ? sessionsFor(cursor)[sched.key] : null;
  const mob = sched ? MOBILITY[sched.mob] : null;
  const entry = data.days[cursor] || {};
  const cWeek = cCyc ? Math.min(cCyc.weeks, Math.max(1, Math.floor(dayDiff(cCyc.start, cursor) / 7) + 1)) : null;
  const isDeload = cCyc && cWeek === cCyc.deloadWeek;
  const travel = inTravel(cursor);
  const isTravel = !!travel || !!entry.travel;
  const event = EVENTS[cursor];
  const nutritionOn = cursor >= NUTRITION_START;
  const nightOf = `${parse(addDays(cursor, -1)).toLocaleDateString("en-GB", { day: "2-digit" })}→${parse(cursor).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
  const prompt = AFFIRM_PROMPTS[Math.abs(dayDiff("2026-08-04", cursor)) % AFFIRM_PROMPTS.length];
  const hour = new Date().getHours();
  const greet = hour < 11 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const doy = Math.abs(dayDiff("2026-01-01", cursor));
  const mmdd = cursor.slice(5);
  const showC2Banner = false;

  /* progression engine */
  const lastFull = (exK) => {
    for (let i = 1; i <= 90; i++) {
      const d = addDays(cursor, -i);
      const rec = data.lifts[d]?.[exK];
      if (rec?.sets?.some((s) => s.load != null || s.reps != null)) return { rec, date: d, sleepThat: data.days[cursor]?.sleep };
    }
    return null;
  };
  const progression = (ex) => {
    const last = lastFull(ex.k);
    if (!last) return { label: "FIRST LOG", text: "Log honest starting loads — 3–4 reps in reserve.", tone: C.dim };
    if (dayDiff(last.date, cursor) > 14)
      return { label: "RE-BASE", text: `Over two weeks since this lift (last: ${pretty(last.date)}). Start ~10% below that load, re-log honestly — prompts resume next session.`, tone: C.camel, last };
    const [lo, hi] = repRange(ex.reps);
    if (ex.inc === 0 || lo == null) return { label: "BY FEEL", text: "Progress when the distance/hold feels controlled.", tone: C.dim, last };
    const done = (last.rec.sets || []).filter((s) => s.reps != null);
    if (done.length < ex.sets) return { label: "HOLD", text: `Complete all ${ex.sets} sets at this load first.`, tone: C.camel, last };
    const allTop = done.every((s) => s.reps >= hi);
    const anyBelow = done.filter((s) => s.reps < lo).length >= 2;
    const badSleep = (entry.sleep ?? 3) <= 2;
    if (allTop && !badSleep) return { label: `+${ex.inc} KG`, text: `All sets hit ${hi} last time — add ${ex.inc} kg${ex.k === "trapdl" || ex.k === "hipthrust" || ex.k === "legpress" ? " total" : " per DB"} today.`, tone: C.sage, last };
    if (allTop && badSleep) return { label: "HOLD", text: "Earned the increase, but sleep was ≤2 — repeat the load today, take it next session.", tone: C.camel, last };
    if (anyBelow) return { label: "REPEAT", text: `Two or more sets fell below ${lo} — repeat this load until all sets clear the bottom.`, tone: C.behind, last };
    return { label: "CHASE", text: `Same load — push every set toward ${hi} reps.`, tone: C.camel, last };
  };

  const colorOf = (name) => C[name] || C.camel;
  const effSets = (ex) => (isDeload ? Math.max(1, Math.ceil(ex.sets / 2)) : ex.sets);

  return (
    <div style={{ background: `radial-gradient(1200px 500px at 50% -10%, #2A1E15 0%, ${C.ground} 60%)`,
      minHeight: "100vh", color: C.ink, fontFamily: SANS, paddingBottom: 64 }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.terra}, ${C.camel}, ${C.rose}, ${C.terra})`, opacity: 0.8 }} />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "22px 16px 0" }}>

        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>
              {greet}, Tom <span style={{ fontSize: 18 }}>☀️</span></div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginTop: 4, letterSpacing: "0.08em" }}>
              {pretty(today).toUpperCase()} · {cyc.name.toUpperCase()} · WEEK {weekNo}/{cyc.weeks}
              {isDeload && cursor === today ? " · DELOAD" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setShowExport(true)} title="Show all logged data as JSON to copy out — downloads are blocked in this sandbox, so export works by copy-paste"
              style={{ background: C.panel2, border: `1px solid ${C.ruleSoft}`, borderRadius: 20, color: C.dim,
                fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", padding: "8px 14px", cursor: "pointer" }}>
              ⇩ EXPORT</button>
            <div style={{ fontFamily: MONO, fontSize: 10, color: status === "offline" ? C.behind : C.dimmer,
              letterSpacing: "0.1em" }}>{status === "saving" ? "SAVING…" : status === "offline" ? "OFFLINE" : "SAVED"}</div>
          </div>
        </div>

        {/* Cycle-2 build reminder */}
        {showC2Banner && (
          <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 12,
            background: C.camelSoft, border: `1px solid ${C.camel}`, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 16 }}>📐</span>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <strong>Build Cycle 2 with Claude — deadline 15 Sep.</strong> Bring your week-5 test numbers so Build 01 starts from reality, not the plan.</div>
          </div>
        )}

        {/* day strip */}
        <div style={{ display: "flex", gap: 2, marginTop: 18, height: 26, alignItems: "flex-end" }}>
          {Array.from({ length: totalDays }).map((_, i) => {
            const d = addDays(cyc.start, i);
            const logged = data.days[d]?.w != null;
            const isToday = d === today;
            const trv = inTravel(d);
            return <div key={i} title={pretty(d) + (trv ? ` · ${trv[2]}` : "")} style={{ flex: 1, borderRadius: 2,
              height: isToday ? 26 : logged ? 18 : 10,
              background: isToday ? C.neon : logged ? C.camel : trv ? C.rose : i <= elapsed ? C.panel3 : C.panel,
              opacity: logged || isToday ? 1 : 0.8, transition: "height .2s" }} />;
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontFamily: MONO,
          fontSize: 10, color: C.dimmer, letterSpacing: "0.1em" }}>
          <span>{parse(cyc.start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase()}</span><span>{elapsed + 1} / {totalDays} DAYS · ROSE = TRAVEL</span><span>{parse(cyc.end).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase()}</span>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", marginTop: 20, gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {[["today", "Today"], ["train", "Train"], ["lifts", "Lifts"], ["fuel", "Fuel"], ["trend", "Trend"], ["de", "Deutsch"], ["body", "Body"], ["tests", "Tests"], ["mind", "Mind"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              background: tab === k ? C.terra : C.panel2, border: "none", cursor: "pointer",
              padding: "10px 18px", whiteSpace: "nowrap", borderRadius: 20,
              fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
              fontWeight: tab === k ? 700 : 400,
              color: tab === k ? C.ground : C.dim, transition: "all .15s" }}>{l}</button>
          ))}
        </div>

        {/* date nav */}
        {(tab === "today" || tab === "train" || tab === "fuel" || tab === "mind") && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
            <button onClick={() => setCursor(addDays(cursor, -1))} style={navBtn}>←</button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: MONO, fontSize: 15 }}>{pretty(cursor)}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, letterSpacing: "0.1em", marginTop: 3 }}>
                {cCyc ? `WEEK ${cWeek}` : "BETWEEN CYCLES"}
                {isDeload ? " · DELOAD" : ""}{isTravel ? " · TRAVEL" : ""}{cursor === today ? " · TODAY" : ""}</div>
            </div>
            <button onClick={() => setCursor(addDays(cursor, 1))} style={navBtn}>→</button>
          </div>
        )}

        {/* ══════ TODAY ══════ */}
        {tab === "today" && (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>

            {event && (
              <div style={{ padding: "12px 16px", borderRadius: 12, background: C.roseSoft,
                border: `1px solid ${C.rose}`, fontSize: 13, lineHeight: 1.55 }}>
                🍷 {event}</div>
            )}

            {/* ring row */}
            {nutritionOn && sched && (
              <Panel glow>
                <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 14 }}>
                  <Ring value={entry.kcal} goal={isTravel ? 2600 : sched.kcal} color={C.camel} label="Calories" unit="" invert />
                  <Ring value={entry.pro} goal={cCyc.protein} color={C.rose} label="Protein" unit="g" />
                  <Ring value={entry.steps} goal={10000} color={C.terra} label="Steps" unit="" />
                  <Ring value={entry.water} goal={4} color={C.teal} label="Water" unit="L" />
                </div>
              </Panel>
            )}

            {/* prescription */}
            {!sched ? (
              <Panel><Label>Transition week</Label>
                <div style={{ fontSize: 14, color: C.dim, lineHeight: 1.6 }}>
                  No programmed sessions. Maintenance intake, walks, mobility habit. Build 01 opens 13 October.</div></Panel>
            ) : (
              <Panel style={{ borderLeft: `3px solid ${session ? colorOf(session.color) : C.camel}` }}>
                <Label tip="The program's prescription for this day. Full lifting detail is in the Train tab. Travel days switch the target to: protein precise, calories approximate.">
                  On the plan{isDeload ? " · DELOAD WEEK" : ""}{isTravel ? " · TRAVEL MODE" : ""}</Label>
                <div style={{ display: "grid", gap: 7, fontSize: 14 }}>
                  {session && <div>🏋 {session.name}{isDeload && <span style={{ color: C.camel, fontFamily: MONO, fontSize: 11 }}> — half volume, same loads</span>}</div>}
                  {sched.cardio && <div>🏃 {sched.cardio}
                    {sched.run && <span style={{ color: C.dim, fontFamily: MONO, fontSize: 12 }}> — {RUN_BLOCK[cWeek - 1]}</span>}</div>}
                  {sched.hiit && (cWeek == null || cWeek >= 3) && <div>⚡ {sched.hiit}</div>}
                  <div>🧘 {mob.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim, paddingTop: 6, borderTop: `1px solid ${C.ruleSoft}` }}>
                    {!nutritionOn ? "Intake plan starts 05 Aug — eat normally today"
                      : isTravel ? `TRAVEL: ${cCyc.protein} g protein precise · calories approximate (~2,600 ceiling) · 10k steps · log drinks`
                      : `${sched.kcal} kcal · ${cCyc.protein} g protein · ${sched.carbs} g carbs · 70 g fat`}</div>
                </div>
              </Panel>
            )}

            {/* daily numbers */}
            <Panel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <Label tip="MyFitnessPal is the source of truth for calories and protein — copy the day's totals here each evening. Weight fasted, post-toilet, pre-food.">Daily numbers</Label>
                <button onClick={() => setDay(cursor, "travel", !entry.travel)} style={{
                  background: isTravel ? C.rose : C.panel3, border: "none", borderRadius: 16, cursor: "pointer",
                  color: isTravel ? C.ground : C.dim, fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em",
                  padding: "7px 13px", fontWeight: isTravel ? 700 : 400 }}>
                  {isTravel ? "✓ TRAVEL DAY" : "MARK TRAVEL"}</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 14 }}>
                <Field label="Weight" tip="Same scale, same conditions. Only the 7-day average matters.">
                  <Num value={entry.w} suffix="kg" placeholder="—" onChange={(v) => setDay(cursor, "w", v)} /></Field>
                <Field label="Steps" tip="From the watch at day's end.">
                  <Num value={entry.steps} placeholder="—" onChange={(v) => setDay(cursor, "steps", v)} /></Field>
                {nutritionOn && <>
                  <Field label="Calories" tip="MyFitnessPal daily total. Within +100 of target = adherence hit.">
                    <Num value={entry.kcal} suffix="kcal" placeholder="—" onChange={(v) => setDay(cursor, "kcal", v)} /></Field>
                  <Field label="Protein" tip="MyFitnessPal daily total. 190 g every day, travel included.">
                    <Num value={entry.pro} suffix="g" placeholder="—" onChange={(v) => setDay(cursor, "pro", v)} /></Field>
                  <Field label="Water" tip="3.5–4 L including coffee.">
                    <Num value={entry.water} suffix="L" placeholder="—" onChange={(v) => setDay(cursor, "water", v)} /></Field>
                  <Field label="Drinks" tip="Alcoholic drinks. Each ≈150 kcal that displaces nothing useful. Budget: cut ~250 kcal of carbs that day OR add 20 min Zone 2 the next.">
                    <Num value={entry.drinks} suffix="🍷" placeholder="0" onChange={(v) => setDay(cursor, "drinks", v)} /></Field>
                </>}
              </div>
            </Panel>

            {/* stack */}
            <Panel>
              <Label tip="Tick each the moment it happens. The streak is the motivator.">Daily stack</Label>
              <div style={{ display: "grid", gap: 8 }}>
                {STACK.map((s) => {
                  const on = !!entry[s.k]; const st = streak(s.k);
                  return (
                    <div key={s.k} onClick={() => setDay(cursor, s.k, !on)} style={{
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "11px 13px",
                      borderRadius: 12, background: on ? C.sageSoft : C.panel2,
                      border: `1px solid ${on ? C.sage : "transparent"}`, transition: "all .15s" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${on ? C.sage : C.rule}`, background: on ? C.sage : "transparent",
                        color: C.ground, fontFamily: MONO, fontSize: 12, textAlign: "center", lineHeight: "17px" }}>
                        {on ? "✓" : ""}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, display: "flex", alignItems: "center" }}>{s.label}<Info tip={s.tip} /></div>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, marginTop: 2 }}>{s.note}</div>
                      </div>
                      {cursor === today && st > 0 && (
                        <div style={{ fontFamily: MONO, fontSize: 11, color: C.sage,
                          background: C.sageSoft, borderRadius: 12, padding: "4px 10px" }}>🔥 {st}d</div>)}
                    </div>);
                })}
              </div>
            </Panel>

            {/* sessions & signals */}
            {sched && (
              <Panel>
                <Label tip="Toggle sessions when done. Sleep scores the night that ENDED this morning. Sustained hunger 4–5 = check the adjustment verdict.">Sessions & signals</Label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {session && <Toggle color={colorOf(session.color)} on={!!entry.lift} onClick={() => setDay(cursor, "lift", !entry.lift)}>Lift</Toggle>}
                  {sched.cardio && <Toggle color={C.terra} on={!!entry.cardio} onClick={() => setDay(cursor, "cardio", !entry.cardio)}>Cardio</Toggle>}
                  {sched.hiit && <Toggle color={C.neon} on={!!entry.hiit} onClick={() => setDay(cursor, "hiit", !entry.hiit)}>HIIT</Toggle>}
                  <Toggle color={C.teal} on={!!entry.mob} onClick={() => setDay(cursor, "mob", !entry.mob)}>Mobility</Toggle>
                </div>
                {sched.cardio && (
                  <div style={{ marginTop: 14, padding: "11px 13px", borderRadius: 12, background: C.panel2 }}>
                    <Label tip="Detail for the day's cardio session — duration always; distance for runs (treadmill or watch); average HR from the watch if worn. This is what feeds your pace-at-fixed-HR comparison at weeks 5 and 9." style={{ marginBottom: 8 }}>
                      Cardio log · {sched.cardio}</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
                      <Num small value={entry.cardioMin} suffix="min" placeholder="duration"
                        onChange={(v) => setDay(cursor, "cardioMin", v)} />
                      <Num small value={entry.cardioKm} suffix="km" placeholder="distance"
                        onChange={(v) => setDay(cursor, "cardioKm", v)} />
                      <Num small value={entry.cardioHr} suffix="Ø bpm" placeholder="avg HR"
                        onChange={(v) => setDay(cursor, "cardioHr", v)} />
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 18, marginTop: 18 }}>
                  <div><Label tip="Whole-session effort. Three weeks climbing at unchanged loads = deload early.">RPE</Label>
                    <Scale5 color={C.terra} value={entry.rpe} onChange={(v) => setDay(cursor, "rpe", v)} lowLabel="EASY" highLabel="BRUTAL" /></div>
                  <div><Label tip="The night that ended this morning. Weekly avg below 3.0 while RPE climbs = deload signal. A 1–2 also pauses load increases in the Train tab.">Sleep · {nightOf}</Label>
                    <Scale5 color={C.rose} value={entry.sleep} anchors={SLEEP_ANCHORS} onChange={(v) => setDay(cursor, "sleep", v)} lowLabel="POOR" highLabel="RESTORED" /></div>
                  <div><Label tip="Sustained 4–5 all week = the deficit is biting too hard.">Hunger</Label>
                    <Scale5 color={C.camel} value={entry.hunger} anchors={HUNGER_ANCHORS} onChange={(v) => setDay(cursor, "hunger", v)} lowLabel="NONE" highLabel="RAVENOUS" /></div>
                </div>
              </Panel>
            )}

            {/* watch */}
            <Panel>
              <Label tip="Manual bridge from Apple Watch / Health — ~20 sec each morning. Direct HealthKit sync arrives with the self-hosted version.">From your watch</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(122px,1fr))", gap: 14 }}>
                <Field label="Sleep duration" tip="Health → Sleep. Time asleep, not in bed.">
                  <Num value={entry.sleepH} suffix="h" placeholder="—" onChange={(v) => setDay(cursor, "sleepH", v)} /></Field>
                <Field label="Resting HR" tip="Weekly trend is the engine gauge — falling is good.">
                  <Num value={entry.rhr} suffix="bpm" placeholder="—" onChange={(v) => setDay(cursor, "rhr", v)} /></Field>
                <Field label="HRV" tip="Noisy on a Series 7 — weekly averages only.">
                  <Num value={entry.hrv} suffix="ms" placeholder="—" onChange={(v) => setDay(cursor, "hrv", v)} /></Field>
                <Field label="Active kcal" tip="Reference only. Never eat these back.">
                  <Num value={entry.activeKcal} placeholder="—" onChange={(v) => setDay(cursor, "activeKcal", v)} /></Field>
              </div>
            </Panel>
          </div>
        )}

        {/* ══════ TRAIN ══════ */}
        {tab === "train" && (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
            {isDeload && session && (
              <div style={{ padding: "12px 16px", borderRadius: 12, background: C.camelSoft,
                border: `1px solid ${C.camel}`, fontSize: 13, lineHeight: 1.5 }}>
                🔧 <strong>RESET week.</strong> Sets halved automatically, no progression prompts, easy runs only — and eat at maintenance (~2,800, protein unchanged). Recovery is the training this week.</div>
            )}
            {!session ? (
              <Panel>
                <Label>{sched?.cardio || sched?.hiit ? "No lifting today" : "Rest day"}</Label>
                <div style={{ fontSize: 14, color: C.dim, lineHeight: 1.6 }}>
                  {sched?.cardio ? `Today: ${sched.cardio}${sched.run ? ` — ${RUN_BLOCK[cWeek - 1]}` : ""}.` : ""}
                  {sched?.hiit ? ` HIIT: ${sched.hiit}.` : ""}
                  {!sched ? "Between cycles." : " Mobility below."}</div>
              </Panel>
            ) : (
              <Panel style={{ borderLeft: `3px solid ${colorOf(session.color)}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                  <Label style={{ marginBottom: 12 }} tip="Log every working set. The verdict chip applies double progression automatically: all sets at the top of the range last time → add load; two sets below the bottom → repeat; sleep ≤2 pauses increases.">
                    {session.name}</Label>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, letterSpacing: "0.1em" }}>
                    LOAD = PER HAND FOR DB WORK</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <button onClick={() => setDay(cursor, "kit", !entry.kit)}
                    title="Swap every exercise for its band/bodyweight travel substitute. Kit sessions log separately, so hotel weeks never corrupt your gym progression."
                    style={{ flex: 1, minWidth: 130, padding: "10px 12px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: entry.kit ? C.rose : C.panel3, color: entry.kit ? C.ground : C.dim,
                      fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", fontWeight: entry.kit ? 700 : 400 }}>
                    {entry.kit ? "✓ TRAVEL KIT — BANDS/BW" : "GYM MODE · TAP FOR TRAVEL KIT"}</button>
                  <button onClick={() => setField("lb", !data.lb)}
                    title="Display and enter loads in pounds (for US gym plates, e.g. Phoenix). Everything is stored in kg underneath, so history and progression stay consistent."
                    style={{ padding: "10px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: data.lb ? C.camel : C.panel3, color: data.lb ? C.ground : C.dim,
                      fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", fontWeight: data.lb ? 700 : 400 }}>
                    {data.lb ? "LB" : "KG"}</button>
                </div>
                {(() => {
                  const tonnage = (d) => session.ex.reduce((t, ex) => ex.inc === 0 ? t :
                    t + ((data.lifts[d]?.[ex.k]?.sets || []).reduce((a, s) =>
                      s.load != null && s.reps != null ? a + s.load * s.reps : a, 0)), 0);
                  const now = tonnage(cursor);
                  let prevD = null;
                  for (let i = 7; i <= 90; i += 7) { const d = addDays(cursor, -i); if (tonnage(d) > 0) { prevD = d; break; } }
                  const prev = prevD ? tonnage(prevD) : 0;
                  return (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      flexWrap: "wrap", gap: 10, marginBottom: 12, padding: "10px 12px",
                      borderRadius: 10, background: C.panel3 }}>
                      <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim }} title="Sum of load × reps across all logged sets (carries and bodyweight excluded). The week-over-week trend of this number is your volume gauge.">
                        TONNAGE {now > 0 ? `${(now / 1000).toFixed(1)} t` : "—"}
                        {prev > 0 && now > 0 && (
                          <span style={{ color: now >= prev ? C.sage : C.behind }}>
                            {" "}· {now >= prev ? "▲" : "▼"} {Math.abs(((now - prev) / prev) * 100).toFixed(0)}% vs last</span>)}
                      </div>
                    </div>);
                })()}
                <div style={{ display: "grid", gap: 10 }}>
                  {session.ex.map((ex) => {
                    const exKey = entry.kit ? ex.k + "~t" : ex.k;
                    const rec = data.lifts[cursor]?.[exKey] || { sets: [] };
                    const prog = entry.kit
                      ? { label: "KIT", text: "Travel variant — match the gym version's effort by feel. Log band level (1–5) or 0 for bodyweight; reps as normal.", tone: C.rose }
                      : progression(ex);
                    const isOpen = openEx === ex.k;
                    const nSets = effSets(ex);
                    const done = rec.sets?.filter((s) => s.load != null && s.reps != null).length || 0;
                    return (
                      <div key={ex.k} style={{ borderRadius: 12, background: C.panel2, overflow: "hidden",
                        border: `1px solid ${isOpen ? C.rule : "transparent"}` }}>
                        <div onClick={() => setOpenEx(isOpen ? null : ex.k)} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                              {entry.kit ? ex.a : ex.n}<Info tip={entry.kit ? ex.at : ex.tip} /><DemoLink q={entry.kit ? ex.a : ex.n} /></div>
                            <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, marginTop: 3 }}>
                              {nSets} × {ex.reps}{isDeload && " (deload)"}
                              {!entry.kit && prog.last && <span style={{ color: C.dim }}> · last {prog.last.rec.sets?.filter(s => s.load != null).map(s => `${data.lb ? Math.round(s.load * 2.20462) : s.load}×${s.reps ?? "?"}`).join(", ")}{data.lb ? " lb" : ""}</span>}</div>
                          </div>
                          {!isDeload && (
                            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: C.ground,
                              background: prog.tone, borderRadius: 10, padding: "5px 10px", fontWeight: 700,
                              whiteSpace: "nowrap" }} title={prog.text}>{prog.label}</div>)}
                          <div style={{ fontFamily: MONO, fontSize: 11,
                            color: done >= nSets ? C.sage : done > 0 ? C.camel : C.dimmer }}>{done}/{nSets}</div>
                        </div>
                        {isOpen && (
                          <div style={{ padding: "0 14px 14px", display: "grid", gap: 8 }}>
                            {!isDeload && <div style={{ fontSize: 12, color: prog.tone, lineHeight: 1.5,
                              background: C.panel3, borderRadius: 8, padding: "8px 11px" }}>{prog.text}</div>}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}><RestTimer /></div>
                            {Array.from({ length: nSets }).map((_, i) => {
                              const s = rec.sets?.[i] || {};
                              return (
                                <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 1fr 1fr", gap: 8, alignItems: "center" }}>
                                  <div style={{ fontFamily: MONO, fontSize: 11, color: C.dimmer }}>SET {i + 1}</div>
                                  <Num small value={s.load != null ? (data.lb ? Math.round(s.load * 2.20462 * 2) / 2 : s.load) : null}
                                    suffix={entry.kit ? "band" : data.lb ? "lb" : "kg"} placeholder="load"
                                    onChange={(v) => setSet(cursor, exKey, i, "load", v == null ? null : (data.lb && !entry.kit ? Math.round((v / 2.20462) * 4) / 4 : v))} />
                                  <Num small value={s.reps} suffix={ex.unit === "m" ? "m" : "rep"}
                                    placeholder={ex.unit === "m" ? "metres" : "reps"}
                                    onChange={(v) => setSet(cursor, exKey, i, "reps", v)} />
                                </div>);
                            })}
                            <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, lineHeight: 1.5 }}>
                              First sets 3–4 in reserve · last set 1–2 from failure · rest 2–3 min compounds, 60–90 s accessories</div>
                          </div>)}
                      </div>);
                  })}
                </div>
              </Panel>
            )}

            {mob && (
              <Panel>
                <Label tip={`Timed holds grow +10 sec per week automatically (currently week ${cWeek ?? 1}${isDeload ? " — reset week: back to baseline" : `, +${Math.min(((cWeek ?? 1) - 1) * 10, 60)} s over baseline`}), capped at +60 s. In every hold: settle in, breathe 4 in / 6 out, and sink deeper on exhales rather than pulling. The Sunday yin session is the long-range-of-motion work; Tree pose is the balance training your 60s will thank you for.`}>
                  Mobility · {mob.name}</Label>
                <div>
                  {mob.items.map(([n, dose], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      gap: 10, padding: "9px 0", borderBottom: i < mob.items.length - 1 ? `1px solid ${C.ruleSoft}` : "none" }}>
                      <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {n}<DemoLink q={n + " yoga pose"} /></div>
                      <div style={{ fontFamily: MONO, fontSize: 11, whiteSpace: "nowrap",
                        color: scaleDose(dose, cWeek, isDeload) !== dose ? C.neon : C.dim }}>
                        {scaleDose(dose, cWeek, isDeload)}</div>
                    </div>))}
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* ══════ LIFTS ══════ */}
        {tab === "lifts" && (() => {
          const groups = [["lowerA", "Lower A", C.terra], ["upperA", "Upper A", C.camel],
            ["lowerB", "Lower B", C.rose], ["upperB", "Upper B", C.sage]];
          const allEx = [];
          const seen = new Set();
          groups.forEach(([g]) =>
            [[SESSIONS_1[g], "A–B"], [SESSIONS_2[g], "C–D"]].forEach(([s, ph]) =>
              s.ex.forEach((ex) => {
                if (seen.has(ex.k)) { const r = allEx.find((x) => x.k === ex.k); if (r) r.ph = "A–D"; return; }
                seen.add(ex.k); allEx.push({ ...ex, ph, g });
              })));
          const filtered = muscle ? allEx.filter((ex) => ex.m?.includes(muscle)) : null;
          const mLabel = muscle ? (MUSCLES.find(([k]) => k === muscle) || [])[1] : null;
          return (
            <div style={{ marginTop: 22, display: "grid", gap: 14 }}>

              <Panel glow>
                <Label tip="Tap a highlighted region on either figure to filter every exercise that primarily trains it — with each one's PR and latest session. Tap again (or ALL) to clear. The chips below do the same thing.">
                  Select a muscle group</Label>
                <div style={{ display: "flex", justifyContent: "center", gap: 26, flexWrap: "wrap" }}>
                  <BodyFig regions={BODY_FRONT} sel={muscle} onSel={setMuscle} label="FRONT" />
                  <BodyFig regions={BODY_BACK} sel={muscle} onSel={setMuscle} label="BACK" />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
                  <button onClick={() => setMuscle(null)} style={{
                    padding: "7px 13px", borderRadius: 14, border: "none", cursor: "pointer",
                    background: !muscle ? C.terra : C.panel3, color: !muscle ? C.ground : C.dim,
                    fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", fontWeight: !muscle ? 700 : 400 }}>ALL</button>
                  {MUSCLES.map(([k, l]) => (
                    <button key={k} onClick={() => setMuscle(muscle === k ? null : k)} style={{
                      padding: "7px 13px", borderRadius: 14, border: "none", cursor: "pointer",
                      background: muscle === k ? C.amber : C.panel3, color: muscle === k ? C.ground : C.dim,
                      fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", fontWeight: muscle === k ? 700 : 400 }}>{l}</button>))}
                </div>
              </Panel>

              {filtered ? (
                <Panel style={{ borderLeft: `3px solid ${C.amber}` }}>
                  <Label>{mLabel} · {filtered.length} exercise{filtered.length === 1 ? "" : "s"}</Label>
                  {filtered.length === 0 ? (
                    <div style={{ fontSize: 13, color: C.dim }}>Nothing targets this primarily — it's covered as secondary work elsewhere.</div>
                  ) : (
                    <div>
                      {filtered.map((ex, i) => (
                        <RecordRow key={ex.k} ex={ex} r={liftRecords[ex.k]} kt={liftRecords[ex.k + "~t"]}
                          lb={data.lb} last={i === filtered.length - 1} showPhase />))}
                    </div>)}
                </Panel>
              ) : (
                groups.map(([g, label, col]) => {
                  const rows = allEx.filter((ex) => ex.g === g);
                  return (
                    <Panel key={g} style={{ borderLeft: `3px solid ${col}` }}>
                      <Label tip="PR = heaviest single set logged (load first, reps as tiebreak). 'Last' is your most recent session. Travel-kit history shows on its own line and never mixes with gym numbers.">
                        {label} · records</Label>
                      <div>
                        {rows.map((ex, i) => (
                          <RecordRow key={ex.k} ex={ex} r={liftRecords[ex.k]} kt={liftRecords[ex.k + "~t"]}
                            lb={data.lb} last={i === rows.length - 1} showPhase />))}
                      </div>
                    </Panel>);
                })
              )}
            </div>);
        })()}

        {/* ══════ FUEL ══════ */}
        {tab === "fuel" && (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>

            {sched && nutritionOn && (
              <Panel glow style={{ borderLeft: `3px solid ${C.camel}` }}>
                <Label tip="Calories are cycled to put food where the work is: 2,400 on lifting days, 2,150 on cardio days, 1,850 on Monday's rest. Protein never moves. Fat is a floor, not a target.">
                  Today's targets{isTravel ? " · TRAVEL" : ""}</Label>
                {isTravel ? (
                  <div style={{ fontSize: 14, lineHeight: 1.65 }}>
                    <strong>{cCyc.protein} g protein — precise.</strong> Calories approximate, ~2,600 ceiling.
                    Order protein and the vegetable first, skip the bread basket, water between drinks, log the drink count.
                    Don't attempt precision tracking on the road — protein and steps are the whole job.
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
                    <Stat label="Calories" value={sched.kcal} />
                    <Stat label="Protein" value={`${cCyc.protein} g`} tip="~2.5 g per kg of lean mass. Identical every day." />
                    <Stat label="Carbs" value={`${sched.carbs} g`} tip="The flexible lever — concentrated on lifting days so top sets feel normal." />
                    <Stat label="Fat" value="70 g" tip="A floor. Don't go lower to buy carbs — hormones and joints pay for it." />
                    <Stat label="Fibre" value="35–40 g" tip="Satiety and digestion — the thing most people wreck in a cut." />
                  </div>
                )}
              </Panel>
            )}

            <Panel>
              <Label tip="Four to five protein feedings of 45–50 g beat one big dinner — muscle protein synthesis responds per meal, not just per day. Tick each feeding as it happens; 4 of 5 is a full day.">
                Meal map · protein feedings</Label>
              <div style={{ display: "grid", gap: 8 }}>
                {MEALS.map((m) => {
                  const on = !!entry[m.k];
                  return (
                    <div key={m.k} onClick={() => setDay(cursor, m.k, !on)} style={{
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "11px 13px",
                      borderRadius: 12, background: on ? C.roseSoft : C.panel2,
                      border: `1px solid ${on ? C.rose : "transparent"}`, transition: "all .15s" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${on ? C.rose : C.rule}`, background: on ? C.rose : "transparent",
                        color: C.ground, fontFamily: MONO, fontSize: 12, textAlign: "center", lineHeight: "17px" }}>
                        {on ? "✓" : ""}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14 }}>{m.t}
                          <span style={{ fontFamily: MONO, fontSize: 10, color: C.rose, marginLeft: 8 }}>{m.pro}</span></div>
                        <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{m.when} — {m.what}</div>
                      </div>
                    </div>);
                })}
              </div>
              <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 11,
                color: [1,2,3,4,5].filter((n) => entry[`m${n}`]).length >= 4 ? C.sage : C.dimmer }}>
                {[1,2,3,4,5].filter((n) => entry[`m${n}`]).length}/5 feedings
                {[1,2,3,4,5].filter((n) => entry[`m${n}`]).length >= 4 ? " · full protein day ✓" : ""}</div>
            </Panel>

            <Panel style={{ borderLeft: `3px solid ${C.rose}` }}>
              <Label tip="The one variable that can quietly erase the whole deficit — alcohol suppresses fat oxidation while it clears, blunts post-training protein synthesis, and degrades the sleep that everything else depends on.">
                Alcohol budget</Label>
              <div style={{ display: "grid", gap: 10 }}>
                {ALCOHOL_RULES.map(([t, txt], i) => (
                  <div key={i} style={{ fontSize: 13, lineHeight: 1.55 }}>
                    <strong style={{ color: C.rose }}>{t}.</strong> <span style={{ color: C.ink }}>{txt}</span></div>))}
              </div>
              {(entry.drinks ?? 0) > 0 && (
                <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: C.roseSoft,
                  fontFamily: MONO, fontSize: 12 }}>
                  {entry.drinks} logged today ≈ {entry.drinks * 150} kcal → cut {Math.min(entry.drinks * 125, 300)} kcal of carbs today or +{entry.drinks * 20} min Zone 2 tomorrow</div>)}
            </Panel>

            <Panel>
              <Label tip="The cheapest protein in the country is in the Quark aisle. Rotate these and 190 g stops being hard.">German-shelf staples</Label>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: C.ink }}>{STAPLES}</div>
            </Panel>

            <Panel>
              <Label tip="Applied automatically in the Trend tab from week 3 — this is the reference card. Never react to a single day; only to two-week trends of the 7-day average.">
                Adjustment protocol · reference</Label>
              <div style={{ display: "grid", gap: 0 }}>
                {ADJUST_RULES.map(([trig, act, tone], i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(110px,0.9fr) 2fr", gap: 12,
                    padding: "10px 0", borderBottom: i < ADJUST_RULES.length - 1 ? `1px solid ${C.ruleSoft}` : "none" }}>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: C[tone] || C.dim }}>{trig}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>{act}</div>
                  </div>))}
              </div>
            </Panel>
          </div>
        )}

        {/* ══════ TREND ══════ */}
        {tab === "trend" && (
          <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
            <Panel glow>
              <Label tip={`7-day rolling average vs the straight line ${cyc.startW} → ${cyc.targetW} across this block. The rolling average is the only weight number worth reacting to.`}>Against the glide path</Label>
              {gap == null ? (
                <div style={{ color: C.dim, fontSize: 14 }}>Log weight on at least three days and this fills in.</div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontFamily: MONO, fontSize: 46, color: gap >= 0 ? C.sage : C.behind, letterSpacing: "-0.02em" }}>
                      {gap >= 0 ? "−" : "+"}{Math.abs(gap).toFixed(1)}</div>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: C.dim, letterSpacing: "0.1em" }}>
                      KG {gap >= 0 ? "AHEAD OF" : "BEHIND"} PLAN</div>
                  </div>
                  <div style={{ display: "flex", gap: 26, marginTop: 14, flexWrap: "wrap" }}>
                    <Stat label="7-day avg" value={`${latest.avg.toFixed(1)} kg`} />
                    <Stat label="Plan says" value={`${latest.target.toFixed(1)} kg`} />
                    <Stat label="Lost" value={`${(cyc.startW - latest.avg).toFixed(1)} kg`} />
                    <Stat label="To go" value={`${Math.max(0, latest.avg - cyc.targetW).toFixed(1)} kg`} />
                  </div>
                  {verdict && verdict.rate > 0.1 && latest.avg > cyc.targetW && (
                    <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 12, color: C.dim }}>
                      At the current rate ({verdict.rate.toFixed(2)} kg/wk): {cyc.targetW} kg ≈{" "}
                      <span style={{ color: C.neon }}>
                        {pretty(addDays(today, Math.round(((latest.avg - cyc.targetW) / verdict.rate) * 7)))}
                      </span>
                      {latest.avg > 95 && <> · 95 kg ≈ <span style={{ color: C.rose }}>
                        {pretty(addDays(today, Math.round(((latest.avg - 95) / verdict.rate) * 7)))}</span></>}
                      {" "}· plan says {pretty(cyc.end)}</div>)}
                </>
              )}
            </Panel>

            <Panel style={{ padding: "18px 8px 8px 0" }}>
              <div style={{ paddingLeft: 18 }}><Label>{cyc.startW} → {cyc.targetW} kg</Label></div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke={C.ruleSoft} strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="short" tick={{ fill: C.dimmer, fontSize: 10, fontFamily: MONO }} interval={13} stroke={C.rule} />
                    <YAxis domain={[Math.floor(cyc.targetW - 2), Math.ceil(cyc.startW + 2)]} tick={{ fill: C.dimmer, fontSize: 10, fontFamily: MONO }} stroke={C.rule} width={44} />
                    <RTooltip contentStyle={{ background: C.panel3, border: `1px solid ${C.rule}`, borderRadius: 10, fontFamily: MONO, fontSize: 12 }} labelStyle={{ color: C.dim }} />
                    <Line type="linear" dataKey="target" stroke={C.dimmer} strokeWidth={1} strokeDasharray="4 4" dot={false} name="Plan" />
                    <Line type="monotone" dataKey="weight" stroke={C.rule} strokeWidth={0} dot={{ r: 2, fill: C.dim }} name="Daily" />
                    <Line type="monotone" dataKey="avg" stroke={C.neon} strokeWidth={2.6} dot={false} connectNulls name="7-day avg" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel>
              <Label tip="Rolled up live from daily entries. The verdict applies the intake plan's adjustment rules to your actual 14-day rate — active from week 3.">Weekly review · last 7 days</Label>
              <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
                <Stat label="Avg kcal" value={week7?.kcal ? Math.round(week7.kcal) : "—"} />
                <Stat label="Avg protein" value={week7?.pro ? `${Math.round(week7.pro)} g` : "—"} />
                <Stat label="Avg steps" value={week7?.steps ? Math.round(week7.steps).toLocaleString() : "—"} />
                <Stat label="Avg sleep" value={week7?.sleep ? week7.sleep.toFixed(1) : "—"}
                  tone={week7?.sleep && week7.sleep < 3 ? C.behind : C.ink} />
                <Stat label="Avg hunger" value={week7?.hunger ? week7.hunger.toFixed(1) : "—"}
                  tone={week7?.hunger && week7.hunger > 4 ? C.behind : C.ink} />
                <Stat label="Drinks" value={week7?.drinks ?? 0}
                  tone={(week7?.drinks ?? 0) > 4 ? C.behind : C.ink}
                  tip="Weekly total. Above ~4 the deficit and sleep both start paying for it." />
                <Stat label="Logged" value={`${week7?.logged ?? 0}/7`} />
              </div>
              {verdict && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.ruleSoft}` }}>
                  <Label>Adjustment verdict · {verdict.rate.toFixed(2)} kg/week</Label>
                  <div style={{ fontSize: 14, color: verdict.tone, lineHeight: 1.55 }}>{verdict.text}</div>
                </div>)}
            </Panel>

            <Panel>
              <Label tip="Filled = calorie target met (+100 tolerance). Travel days score on protein instead and dim when unlogged rather than counting as misses. 85% across the cycle is enough.">Adherence · last 14 days</Label>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 14 }).map((_, i) => {
                  const d = addDays(today, i - 13);
                  const e = data.days[d] || {};
                  const dc = cycleFor(d);
                  const pre = d < NUTRITION_START || !dc;
                  const trv = !!inTravel(d) || !!e.travel;
                  const hit = !pre && (trv ? (e.pro != null && e.pro >= dc.protein * 0.9)
                    : (e.kcal != null && e.kcal <= dc.sched[parse(d).getDay()].kcal + 100));
                  const some = !pre && (e.kcal != null || (trv && e.pro != null));
                  return <div key={i} title={pretty(d) + (trv ? " · travel" : "")} style={{ flex: 1, height: 34, borderRadius: 6,
                    opacity: pre ? 0.3 : 1,
                    background: hit ? C.sage : some ? C.panel3 : C.panel2,
                    border: trv ? `1px solid ${C.rose}` : `1px solid transparent` }} />;
                })}
              </div>
            </Panel>

            <Panel>
              <Label tip="MyFitnessPal totals vs the cycled target (dashed). Points at or below the dashed line are on-plan days. Gaps = unlogged.">Intake · last 14 days</Label>
              <div style={{ height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last14} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                    <CartesianGrid stroke={C.ruleSoft} strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="short" tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} interval={1} />
                    <YAxis domain={[1500, 3200]} tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} width={40} />
                    <RTooltip contentStyle={{ background: C.panel3, border: `1px solid ${C.rule}`, borderRadius: 10, fontFamily: MONO, fontSize: 12 }} labelStyle={{ color: C.dim }} />
                    <Line type="stepAfter" dataKey="tgt" stroke={C.dimmer} strokeWidth={1} strokeDasharray="4 4" dot={false} name="Target" />
                    <Line type="monotone" dataKey="kcal" stroke={C.camel} strokeWidth={2.2} dot={{ r: 2.5, fill: C.camel }} connectNulls name="kcal" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: 140, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last14} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                    <CartesianGrid stroke={C.ruleSoft} strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="short" tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} interval={1} />
                    <YAxis domain={[100, 260]} tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} width={40} />
                    <RTooltip contentStyle={{ background: C.panel3, border: `1px solid ${C.rule}`, borderRadius: 10, fontFamily: MONO, fontSize: 12 }} labelStyle={{ color: C.dim }} />
                    <Line type="stepAfter" dataKey="pTgt" stroke={C.dimmer} strokeWidth={1} strokeDasharray="4 4" dot={false} name="Target" />
                    <Line type="monotone" dataKey="pro" stroke={C.rose} strokeWidth={2.2} dot={{ r: 2.5, fill: C.rose }} connectNulls name="Protein g" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel>
              <Label tip="Sleep and RPE on the same 1–5 axis. The pattern to watch: RPE climbing while sleep sinks = recovery debt → take the deload early. RPE climbing on good sleep = the program working as intended.">
                Recovery · sleep vs effort</Label>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last14} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={C.ruleSoft} strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="short" tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} interval={1} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} width={30} />
                    <RTooltip contentStyle={{ background: C.panel3, border: `1px solid ${C.rule}`, borderRadius: 10, fontFamily: MONO, fontSize: 12 }} labelStyle={{ color: C.dim }} />
                    <Line type="monotone" dataKey="sleep" stroke={C.rose} strokeWidth={2.2} dot={{ r: 2.5, fill: C.rose }} connectNulls name="Sleep" />
                    <Line type="monotone" dataKey="rpe" stroke={C.terra} strokeWidth={2.2} dot={{ r: 2.5, fill: C.terra }} connectNulls name="RPE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, letterSpacing: "0.08em", marginTop: 4 }}>
                <span style={{ color: C.rose }}>● SLEEP</span> · <span style={{ color: C.terra }}>● RPE</span></div>
            </Panel>

            <Panel>
              <Label tip="Morning resting HR from your watch, 30 days. A gently falling line is aerobic adaptation; a sudden +5 bpm above your recent norm often precedes illness or under-recovery by a day or two.">
                Engine · resting HR · 30 days</Label>
              <div style={{ height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rhr30} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke={C.ruleSoft} strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="short" tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} interval={6} />
                    <YAxis domain={["dataMin - 3", "dataMax + 3"]} tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} width={34} />
                    <RTooltip contentStyle={{ background: C.panel3, border: `1px solid ${C.rule}`, borderRadius: 10, fontFamily: MONO, fontSize: 12 }} labelStyle={{ color: C.dim }} />
                    <Line type="monotone" dataKey="rhr" stroke={C.teal} strokeWidth={2.2} dot={{ r: 2 }} connectNulls name="bpm" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel>
              <Label tip="Total tonnes lifted per week (load × reps, carries and bodyweight excluded). In a deficit this should hold roughly steady outside the week-5 dip — a sustained slide alongside falling strength benchmarks means the deficit is eating muscle.">
                Volume · weekly tonnage</Label>
              <div style={{ height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyVol} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke={C.ruleSoft} strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="wk" tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} />
                    <YAxis tick={{ fill: C.dimmer, fontSize: 9, fontFamily: MONO }} stroke={C.rule} width={34} />
                    <RTooltip contentStyle={{ background: C.panel3, border: `1px solid ${C.rule}`, borderRadius: 10, fontFamily: MONO, fontSize: 12 }} labelStyle={{ color: C.dim }} formatter={(v) => [`${v} t`, "Tonnage"]} />
                    <Line type="monotone" dataKey="t" stroke={C.neon} strokeWidth={2.4} dot={{ r: 3, fill: C.neon }} connectNulls name="t" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        )}

        {/* ══════ BODY ══════ */}
        {tab === "body" && (
          <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
            <Panel>
              <Label tip="Sunday morning, fasted. Same tape tension — snug, not compressing.">Tape measurements</Label>
              <input type="date" value={bCursor} onChange={(e) => setBCursor(e.target.value)}
                style={{ background: C.panel3, border: "none", borderRadius: 8, color: C.ink,
                  fontFamily: MONO, fontSize: 13, padding: "8px 10px", marginBottom: 14 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14 }}>
                {MEASURES.map((m) => (
                  <Field key={m.k} label={m.label} tip={m.tip}>
                    <Num value={data.measures[bCursor]?.[m.k]} suffix="cm" placeholder="—"
                      onChange={(v) => setMeasure(bCursor, m.k, v)} /></Field>))}
              </div>
            </Panel>
            <Panel style={{ borderLeft: `3px solid ${C.camel}` }}>
              <Label tip="US Navy circumference formula (male): estimated from waist, neck, and height. ±3% accuracy — useful as a between-scan trend, not a replacement for the week-5 and week-9 scans.">
                Body-fat estimate · Navy formula</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, alignItems: "end" }}>
                <Field label="Height (once)" tip="Stored permanently after first entry.">
                  <Num value={data.height} suffix="cm" placeholder="—" onChange={(v) => setField("height", v)} /></Field>
                {(() => {
                  const dates = Object.keys(data.measures).sort().reverse();
                  const d = dates.find((x) => data.measures[x].waist != null && data.measures[x].neck != null);
                  if (!d || !data.height) return (
                    <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, gridColumn: "span 2" }}>
                      Enter height plus one waist + neck measurement and the estimate appears here.</div>);
                  const m = data.measures[d];
                  const bf = 495 / (1.0324 - 0.19077 * Math.log10(m.waist - m.neck) + 0.15456 * Math.log10(data.height)) - 450;
                  const w = latest?.avg ?? data.days[today]?.w;
                  return (<>
                    <Stat label={`Estimate · ${pretty(d)}`} value={`${bf.toFixed(1)} %`} tone={C.camel} />
                    {w && <Stat label="Est. lean mass" value={`${(w * (1 - bf / 100)).toFixed(1)} kg`}
                      tip="7-day avg weight × (1 − BF%). Watch it hold while total weight falls." />}
                    <Stat label="Scan baseline" value="34.2 %" />
                  </>);
                })()}
              </div>
            </Panel>
            <Panel>
              <Label tip="When the scale stalls but the waist keeps falling, you're recomposing — change nothing that week.">Waist — the second signal</Label>
              {Object.keys(data.measures).filter((d) => data.measures[d].waist != null).length < 2 ? (
                <div style={{ color: C.dim, fontSize: 14 }}>Two waist readings and this chart fills in.</div>
              ) : (
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Object.keys(data.measures).sort().filter((d) => data.measures[d].waist != null)
                      .map((d) => ({ short: parse(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), waist: data.measures[d].waist }))}>
                      <CartesianGrid stroke={C.ruleSoft} strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="short" tick={{ fill: C.dimmer, fontSize: 10, fontFamily: MONO }} stroke={C.rule} />
                      <YAxis domain={["auto", "auto"]} tick={{ fill: C.dimmer, fontSize: 10, fontFamily: MONO }} stroke={C.rule} width={40} />
                      <RTooltip contentStyle={{ background: C.panel3, border: `1px solid ${C.rule}`, borderRadius: 10, fontFamily: MONO, fontSize: 12 }} />
                      <Line type="monotone" dataKey="waist" stroke={C.rose} strokeWidth={2.6} dot={{ r: 3, fill: C.rose }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>)}
            </Panel>
          </div>
        )}

        {/* ══════ TESTS ══════ */}
        {tab === "tests" && (
          <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
            {[["Strength", C.terra], ["Engine", C.camel], ["Mobility", C.teal], ["Composition", C.rose]].map(([g, col]) => (
              <Panel key={g} style={{ borderLeft: `3px solid ${col}` }}>
                <Label tip={g === "Strength" ? "The proof of muscle retention: if these hold or climb while bodyweight falls, the program worked." :
                  g === "Engine" ? "Cardio adaptation. Baseline wk 1, retest wk 5 and 9." :
                  g === "Mobility" ? "Retest every 3 weeks. Progress = longer holds, smaller gaps." :
                  "Rescan same machine as the health exam, wk 5 and 9. Skeletal muscle mass is the defended number."}>
                  {g} · baseline / mid / end</Label>
                <div style={{ display: "grid", gap: 12 }}>
                  {TESTS.filter((t) => t.g === g).map((t) => (
                    <div key={t.k} style={{ display: "grid", gridTemplateColumns: "minmax(130px,1.6fr) repeat(3,1fr)",
                      gap: 10, alignItems: "center", paddingBottom: 12, borderBottom: `1px solid ${C.ruleSoft}` }}>
                      <div style={{ fontSize: 13, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                        {t.label}<Info tip={t.tip} />
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, marginLeft: 4 }}>{t.unit}</span></div>
                      {["base", "mid", "end"].map((s) => (
                        <Num key={s} small value={data.tests[t.k]?.[s]} placeholder={s} onChange={(v) => setTest(t.k, s, v)} />))}
                    </div>))}
                </div>
              </Panel>))}
          </div>
        )}

        {/* ══════ MIND ══════ */}
        {tab === "mind" && (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>

            {/* quotations of the day */}
            <Panel glow style={{ borderLeft: `3px solid ${C.camel}` }}>
              <Label tip="Four quotes, rotated deterministically by date from a curated library. The self-hosted version can pull live on-this-day feeds; the artifact carries its own.">
                Quotations of the day</Label>
              <div style={{ display: "grid", gap: 14 }}>
                {(() => {
                  const otd = ON_THIS_DAY[mmdd];
                  const fb = HISTORY_FALLBACK[doy % HISTORY_FALLBACK.length];
                  const r = ROME[doy % ROME.length];
                  const g = GERMAN[doy % GERMAN.length];
                  const rot = ROTATING[doy % ROTATING.length];
                  const More = ({ url }) => url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: MONO, fontSize: 10, color: C.teal, textDecoration: "none",
                        letterSpacing: "0.08em" }}>READ MORE ▸</a>) : null;
                  const Ctx = ({ src, ctx }) => (
                    <div style={{ fontSize: 12, color: C.dimmer, marginTop: 5, lineHeight: 1.5 }}>
                      {src && <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>{src}</span>}
                      {src && ctx && " — "}{ctx}</div>);
                  return (<>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: C.terra, marginBottom: 5 }}>ROMA</div>
                      <div style={{ fontSize: 15, fontStyle: "italic", lineHeight: 1.5 }}>{r.la}</div>
                      <div style={{ fontSize: 13, color: C.dim, marginTop: 3 }}>{r.en}
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer }}> — {r.by}</span></div>
                      <Ctx src={r.src} ctx={r.ctx} /><More url={r.url} />
                    </div>
                    <div style={{ borderTop: `1px solid ${C.ruleSoft}`, paddingTop: 12 }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: C.camel, marginBottom: 5 }}>
                        {otd ? "ON THIS DAY" : "FROM HISTORY"}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.55, color: C.ink }}>{(otd || fb).t}</div>
                      <div style={{ marginTop: 5 }}><More url={(otd || fb).url} /></div>
                    </div>
                    <div style={{ borderTop: `1px solid ${C.ruleSoft}`, paddingTop: 12 }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: C.rose, marginBottom: 5 }}>DEUTSCH</div>
                      <div style={{ fontSize: 15, fontStyle: "italic", lineHeight: 1.5 }}>{g.de}</div>
                      <div style={{ fontSize: 13, color: C.dim, marginTop: 3 }}>{g.en}</div>
                      <Ctx src={g.src} ctx={g.ctx} /><More url={g.url} />
                    </div>
                    <div style={{ borderTop: `1px solid ${C.ruleSoft}`, paddingTop: 12 }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: C.teal, marginBottom: 5 }}>
                        {rot.d.toUpperCase()}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5 }}>"{rot.q}"
                        <span style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer }}> — {rot.by}</span></div>
                      <Ctx src={rot.src} ctx={rot.ctx} /><More url={rot.url} />
                    </div>
                  </>);
                })()}
              </div>
            </Panel>

            <Panel style={{ borderLeft: `3px solid ${C.teal}` }}>
              <Label tip="Latin lives here, aimed at reading Roman sources for the PhD. German has its own tab now — the December deadline earned it a full training ground.">
                Sprachtraining · Latina</Label>
              <Quiz title="LATINA" color={C.terra} bank={QUIZ_LA} lesson={LESSON_LA[doy % LESSON_LA.length]} doy={doy}
                stored={entry.quizLa} onDone={(s) => setDay(cursor, "quizLa", { s, t: 3 })} />
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.ruleSoft}`,
                fontFamily: MONO, fontSize: 11, color: C.dim }}>
                🇩🇪 Deutsch ist umgezogen → the <span style={{ color: C.rose }}>DEUTSCH</span> tab
                {streak("quizLa") > 1 && <span style={{ color: C.sage }}> · 🔥 Latin {streak("quizLa")}d</span>}</div>
            </Panel>

            <Panel style={{ borderLeft: `3px solid ${C.rose}` }}>
              <Label tip="One sentence, written not thought. The prompt rotates daily — answer it or write your own.">Affirmation</Label>
              <div style={{ fontSize: 13, color: C.dim, fontStyle: "italic", marginBottom: 10, lineHeight: 1.5 }}>{prompt}</div>
              <input type="text" value={entry.affirm ?? ""} placeholder="One sentence…"
                onChange={(e) => setDay(cursor, "affirm", e.target.value || null)}
                style={{ width: "100%", boxSizing: "border-box", background: C.panel3, border: "none",
                  borderRadius: 10, color: C.ink, fontFamily: SANS, fontSize: 15, padding: "12px 14px", outline: "none" }} />
              {streak("affirm") > 1 && (
                <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 11, color: C.sage }}>🔥 {streak("affirm")} days running</div>)}
            </Panel>

            <Panel>
              <Label tip="Optional and unstructured. Two honest lines beat a page of performance.">Journal · optional</Label>
              <textarea value={entry.journal ?? ""} rows={6} placeholder="How did today actually go?"
                onChange={(e) => setDay(cursor, "journal", e.target.value || null)}
                style={{ width: "100%", boxSizing: "border-box", background: C.panel3, border: "none",
                  borderRadius: 10, color: C.ink, fontFamily: SANS, fontSize: 14, lineHeight: 1.6,
                  padding: "12px 14px", outline: "none", resize: "vertical" }} />
            </Panel>

            <Panel>
              <Label>Recent entries</Label>
              {Object.keys(data.days).filter((d) => data.days[d].affirm || data.days[d].journal).length === 0 ? (
                <div style={{ color: C.dim, fontSize: 14 }}>Entries appear here as you write them.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {Object.keys(data.days).filter((d) => data.days[d].affirm || data.days[d].journal)
                    .sort().reverse().slice(0, 10).map((d) => (
                      <div key={d} style={{ paddingBottom: 12, borderBottom: `1px solid ${C.ruleSoft}` }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, letterSpacing: "0.1em", marginBottom: 5 }}>
                          {pretty(d).toUpperCase()}</div>
                        {data.days[d].affirm && <div style={{ fontSize: 14, fontStyle: "italic", marginBottom: 4 }}>"{data.days[d].affirm}"</div>}
                        {data.days[d].journal && <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{data.days[d].journal}</div>}
                      </div>))}
                </div>)}
            </Panel>
          </div>
        )}

        {/* ══════ DEUTSCH ══════ */}
        {tab === "de" && (() => {
          const daysLeft = dayDiff(today, "2026-12-20");
          const phaseIdx = Math.max(0, Math.min(4, parse(today).getMonth() - 7));
          const tEntry = data.days[today] || {};
          const monday = addDays(today, -((parse(today).getDay() + 6) % 7));
          const widx = Math.floor(doy / 7);
          const missions = [0, 1, 2].map((i) => DE_MISSIONS[(widx * 3 + i) % DE_MISSIONS.length]);
          const mState = (data.deMissions || {})[monday] || {};
          const setMission = (i, v) => persist({ ...data,
            deMissions: { ...(data.deMissions || {}), [monday]: { ...mState, [i]: v } } });
          const mastered = Object.values(data.deCards || {}).filter((s) => s.box >= 4).length;
          return (
            <div style={{ marginTop: 22, display: "grid", gap: 14 }}>

              <Panel glow style={{ borderLeft: `3px solid ${C.rose}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <Label tip="Deadline: your wife's birthday. Phase changes monthly — each month has a job, and December is consolidation, not cramming.">
                      Ziel: 20 Dezember</Label>
                    <div style={{ fontFamily: MONO, fontSize: 34, color: C.rose, letterSpacing: "-0.02em" }}>
                      {daysLeft} <span style={{ fontSize: 14, color: C.dim }}>TAGE</span></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Label style={{ justifyContent: "flex-end" }}>Phase · {DE_PHASES[phaseIdx][0]}</Label>
                    <div style={{ fontFamily: MONO, fontSize: 18 }}>{DE_PHASES[phaseIdx][1]}</div>
                    <div style={{ fontSize: 12, color: C.dim, marginTop: 3, maxWidth: 260 }}>{DE_PHASES[phaseIdx][2]}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
                  <Stat label="Vokabeln gemeistert" value={`${mastered}/${DE_CARDS.length}`}
                    tip="Cards in Leitner box 4+ — seen and known across at least a week of spaced reviews." />
                  <Stat label="Quiz-Serie" value={`${streak("quizDe")}d`} />
                </div>
              </Panel>

              <Panel>
                <Label tip="The same lesson-then-quiz flow as before, now living where it belongs. Do it first — the other exercises assume today's three items.">
                  Lektion & Quiz</Label>
                <Quiz title="DEUTSCH" color={C.rose} bank={QUIZ_DE} lesson={LESSON_DE[doy % LESSON_DE.length]} doy={doy}
                  stored={tEntry.quizDe} onDone={(s) => setDay(today, "quizDe", { s, t: 3 })} />
              </Panel>

              <Panel>
                <Label tip="Leitner spaced repetition: know a card and it climbs a box (reviews spread to 1→2→4→7→14 days); miss it and it drops to box 1 for tomorrow. Up to 10 cards per day — due reviews first, then new. Tap 🔊 to hear it (device permitting).">
                  Vokabeln · Spaced repetition</Label>
                <Leitner cards={DE_CARDS} state={data.deCards || {}} today={today}
                  onUpdate={(id, st) => persist({ ...data, deCards: { ...(data.deCards || {}), [id]: st } })} />
              </Panel>

              <Panel>
                <Label tip="Tap the words into the right order — this drills the V2 rule, modal verbs, and separable verbs where reading alone can't. One sentence per day; 'Noch eins' for more.">
                  Satzbau · Word order</Label>
                <Satzbau items={DE_SENTENCES} doy={doy} />
              </Panel>

              <Panel style={{ borderLeft: `3px solid ${C.camel}` }}>
                <Label tip="The part the app can't do for you. Three real-world speaking missions per week, rotated. Conversational-by-December is won out there, not in here — this checklist is just the accountability.">
                  Sprechen · this week's missions</Label>
                <div style={{ display: "grid", gap: 8 }}>
                  {missions.map((m, i) => (
                    <div key={i} onClick={() => setMission(i, !mState[i])} style={{
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "11px 13px",
                      borderRadius: 12, background: mState[i] ? C.sageSoft : C.panel2,
                      border: `1px solid ${mState[i] ? C.sage : "transparent"}` }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${mState[i] ? C.sage : C.rule}`, background: mState[i] ? C.sage : "transparent",
                        color: C.ground, fontFamily: MONO, fontSize: 12, textAlign: "center", lineHeight: "17px" }}>
                        {mState[i] ? "✓" : ""}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{m}</div>
                    </div>))}
                </div>
              </Panel>

              <Panel style={{ borderLeft: `3px solid ${C.teal}` }}>
                <Label tip="A live German conversation partner powered by Claude — it answers in short simple German, corrects your mistakes with ✎, glosses in English, and always asks a follow-up. The last 12 messages persist on this device. Needs a connection; replies take a few seconds.">
                  Gespräch · AI conversation partner</Label>
                <Gespraech saved={data.deChat || []} onSave={(m) => persist({ ...data, deChat: m.slice(-12) })} />
              </Panel>
            </div>
          );
        })()}

        {/* modules rail */}
        <div style={{ marginTop: 34, paddingTop: 18, borderTop: `1px solid ${C.ruleSoft}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["01 Health", true], ["02 Money", false], ["03 Admin", false], ["04 Household", false]].map(([l, a]) => (
              <div key={l} style={{ padding: "8px 14px", borderRadius: 16, fontFamily: MONO, fontSize: 10,
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: a ? C.terraSoft : "transparent",
                border: `1px solid ${a ? C.terra : C.ruleSoft}`, color: a ? C.terra : C.dimmer }}>{l}</div>))}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.dimmer, letterSpacing: "0.1em" }}>LIFE OS · v5</div>
        </div>

        {/* export overlay */}
        {showExport && (
          <div onClick={() => setShowExport(false)} style={{ position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(16,12,9,0.82)", display: "grid", placeItems: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 620,
              background: C.panel, border: `1px solid ${C.rule}`, borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Label style={{ marginBottom: 0 }}>Export · {iso(new Date())}</Label>
                <button onClick={() => setShowExport(false)} style={{ ...navBtn, padding: "5px 12px" }}>✕</button>
              </div>
              <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.55, marginBottom: 10 }}>
                The sandbox blocks file downloads, so export works by copy. Tap <strong style={{ color: C.ink }}>Copy</strong>,
                then paste into a note or file named <span style={{ fontFamily: MONO, fontSize: 12 }}>lifeos-{iso(new Date())}.json</span>.
                Everything is in here — days, lifts, measurements, tests, journal.</div>
              <textarea id="export-ta" readOnly value={JSON.stringify(data, null, 2)}
                onFocus={(e) => e.target.select()}
                style={{ width: "100%", boxSizing: "border-box", height: 220, background: C.panel3,
                  border: "none", borderRadius: 10, color: C.ink, fontFamily: MONO, fontSize: 11,
                  lineHeight: 1.5, padding: 12, outline: "none", resize: "vertical" }} />
              <button onClick={copyExport} style={{ marginTop: 10, width: "100%", padding: "12px 0",
                borderRadius: 12, border: "none", cursor: "pointer",
                background: copied ? C.sage : C.camel, color: C.ground,
                fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", fontWeight: 700 }}>
                {copied ? "✓ COPIED TO CLIPBOARD" : "COPY ALL"}</button>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.ruleSoft}` }}>
                <Label tip="Paste an export from your other device and merge it here. Per-day and per-session records combine; where both devices logged the same day, the pasted version wins for the fields it contains. Nothing local is deleted.">
                  Import from another device</Label>
                <textarea value={importTxt} onChange={(e) => { setImportTxt(e.target.value); setImportMsg(null); }}
                  placeholder='Paste the JSON from the other device here…'
                  style={{ width: "100%", boxSizing: "border-box", height: 90, background: C.panel3,
                    border: "none", borderRadius: 10, color: C.ink, fontFamily: MONO, fontSize: 11,
                    lineHeight: 1.5, padding: 12, outline: "none", resize: "vertical" }} />
                <button onClick={runImport} disabled={!importTxt.trim()} style={{ marginTop: 8, width: "100%",
                  padding: "12px 0", borderRadius: 12, border: "none",
                  cursor: importTxt.trim() ? "pointer" : "default",
                  background: importTxt.trim() ? C.terra : C.panel3,
                  color: importTxt.trim() ? C.ground : C.dimmer,
                  fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", fontWeight: 700 }}>
                  MERGE INTO THIS DEVICE</button>
                {importMsg && (
                  <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5,
                    color: importMsg.ok ? C.sage : C.behind }}>{importMsg.t}</div>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const navBtn = { background: C.panel2, border: "none", borderRadius: 16, color: C.dim,
  fontFamily: MONO, fontSize: 15, padding: "8px 16px", cursor: "pointer" };

function Quiz({ title, color, bank, lesson, doy, stored, onDone }) {
  const [phase, setPhase] = useState("learn");
  const [sel, setSel] = useState({});
  const qs = [0, 1, 2].map((i) => bank[(doy * 3 + i) % bank.length]);
  if (stored) {
    return (
      <div>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: stored.s === stored.t ? C.sage : C.dim }}>
          {stored.s}/{stored.t} today {stored.s === stored.t ? "— perfect ✓" : "— the misses come back around in the rotation"}</div>
      </div>);
  }
  if (phase === "learn") {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color }}>{title} · LEKTION</div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: C.dimmer, letterSpacing: "0.1em" }}>~2 MIN</div>
        </div>
        {lesson && (
          <div style={{ background: C.panel3, borderRadius: 10, padding: "11px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color }}>{lesson.t}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: C.ink }}>{lesson.b}</div>
          </div>)}
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: C.dimmer, marginBottom: 6 }}>
          TODAY'S THREE — READ, THEN THE QUIZ ASKS THESE</div>
        <div style={{ display: "grid", gap: 8 }}>
          {qs.map((q, i) => (
            <div key={i} style={{ padding: "9px 12px", borderRadius: 10, background: C.panel2 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{q.o[q.a]}</div>
              <div style={{ fontSize: 12, color: C.dim, marginTop: 3, lineHeight: 1.5 }}>{q.q}</div>
              <div style={{ fontSize: 12, color: C.dimmer, marginTop: 3, lineHeight: 1.5 }}>{q.n}</div>
            </div>))}
        </div>
        <button onClick={() => setPhase("quiz")} style={{ marginTop: 10, width: "100%", padding: "11px 0",
          borderRadius: 12, border: "none", cursor: "pointer", background: color, color: C.ground,
          fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", fontWeight: 700 }}>
          START QUIZ →</button>
      </div>
    );
  }
  const pick = (qi, oi) => {
    if (sel[qi] != null) return;
    const next = { ...sel, [qi]: oi };
    setSel(next);
    if (Object.keys(next).length === 3)
      onDone([0, 1, 2].filter((i) => next[i] === qs[i].a).length);
  };
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color, marginBottom: 8 }}>{title} · QUIZ</div>
      <div style={{ display: "grid", gap: 12 }}>
        {qs.map((q, qi) => {
          const answered = sel[qi] != null;
          return (
            <div key={qi}>
              <div style={{ fontSize: 13, marginBottom: 7, lineHeight: 1.5 }}>{q.q}</div>
              <div style={{ display: "grid", gap: 6 }}>
                {q.o.map((opt, oi) => {
                  const isPick = sel[qi] === oi, isAns = q.a === oi;
                  return (
                    <button key={oi} onClick={() => pick(qi, oi)} style={{
                      textAlign: "left", padding: "9px 12px", borderRadius: 10, cursor: answered ? "default" : "pointer",
                      border: "1px solid " + (answered && isAns ? C.sage : answered && isPick ? C.behind : "transparent"),
                      background: answered && isAns ? C.sageSoft : answered && isPick ? "rgba(208,98,72,0.12)" : C.panel3,
                      color: answered && !isAns && !isPick ? C.dimmer : C.ink,
                      fontFamily: SANS, fontSize: 13 }}>
                      {opt}{answered && isAns ? "  ✓" : answered && isPick && !isAns ? "  ✕" : ""}</button>);
                })}
              </div>
              {answered && <div style={{ fontSize: 12, color: C.dim, marginTop: 6, lineHeight: 1.5 }}>{q.n}</div>}
            </div>);
        })}
      </div>
    </div>
  );
}

function Leitner({ cards, state, onUpdate, today }) {
  const INTERVALS = [1, 2, 4, 7, 14];
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const queue = useMemo(() => {
    const due = cards.filter((c) => state[c.id] && state[c.id].due <= today);
    const fresh = cards.filter((c) => !state[c.id]);
    return [...due, ...fresh].slice(0, 10);
  }, []); // frozen for the session so grading doesn't reshuffle
  if (!queue.length || i >= queue.length) {
    return <div style={{ fontSize: 13, color: C.sage }}>
      ✓ Done for today — {queue.length} card{queue.length === 1 ? "" : "s"} reviewed. Tomorrow brings the next due set.</div>;
  }
  const c = queue[i];
  const grade = (knew) => {
    const box = knew ? Math.min((state[c.id]?.box || 0) + 1, 5) : 1;
    onUpdate(c.id, { box, due: addDays(today, INTERVALS[box - 1]) });
    setFlip(false); setI(i + 1);
  };
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, letterSpacing: "0.1em", marginBottom: 8 }}>
        KARTE {i + 1} / {queue.length}{state[c.id] ? ` · BOX ${state[c.id].box}` : " · NEU"}</div>
      <div onClick={() => setFlip(!flip)} style={{ background: C.panel3, borderRadius: 12, padding: "22px 16px",
        textAlign: "center", cursor: "pointer", minHeight: 70, display: "grid", placeItems: "center" }}>
        {!flip ? (
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {c.de}
            <button onClick={(e) => { e.stopPropagation(); speak(c.de); }} style={{ marginLeft: 10,
              background: "transparent", border: "none", cursor: "pointer", fontSize: 16 }}>🔊</button>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, marginTop: 8, fontWeight: 400 }}>TAP TO REVEAL</div>
          </div>
        ) : (
          <div style={{ fontSize: 17, color: C.ink }}>{c.en}</div>
        )}
      </div>
      {flip && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => grade(false)} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            cursor: "pointer", background: "rgba(208,98,72,0.16)", color: C.behind,
            fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", fontWeight: 700 }}>NOCHMAL</button>
          <button onClick={() => grade(true)} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            cursor: "pointer", background: C.sage, color: C.ground,
            fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", fontWeight: 700 }}>GEWUSST ✓</button>
        </div>)}
    </div>
  );
}

function Satzbau({ items, doy }) {
  const [idx, setIdx] = useState(doy % items.length);
  const [picked, setPicked] = useState([]);
  const item = items[idx];
  const scrambled = useMemo(() =>
    item.w.map((w, i) => ({ w, i })).sort((a, b) => ((a.i * 7 + idx * 5) % 13) - ((b.i * 7 + idx * 5) % 13)),
  [idx]);
  const done = picked.length === item.w.length;
  const correct = done && picked.map((p) => p.w).join(" ") === item.w.join(" ");
  const reset = () => setPicked([]);
  const next = () => { setIdx((idx + 1) % items.length); setPicked([]); };
  return (
    <div>
      <div style={{ fontSize: 13, color: C.dim, marginBottom: 8 }}>Build: <em>{item.en}</em></div>
      <div style={{ minHeight: 44, background: C.panel3, borderRadius: 10, padding: "10px 12px",
        display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 8,
        border: `1px solid ${done ? (correct ? C.sage : C.behind) : "transparent"}` }}>
        {picked.length === 0 && <span style={{ fontFamily: MONO, fontSize: 11, color: C.dimmer }}>TAP WORDS BELOW…</span>}
        {picked.map((p, pi) => (
          <button key={pi} onClick={() => setPicked(picked.filter((_, j) => j !== pi))} style={{
            background: C.panel2, border: "none", borderRadius: 8, color: C.ink, fontFamily: SANS,
            fontSize: 14, padding: "6px 10px", cursor: "pointer" }}>{p.w}</button>))}
        {done && <span style={{ fontFamily: MONO, fontSize: 13, color: correct ? C.sage : C.behind, marginLeft: 4 }}>
          {correct ? "✓ Richtig!" : "✕"}</span>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {scrambled.filter((s) => !picked.some((p) => p.i === s.i)).map((s) => (
          <button key={s.i} onClick={() => setPicked([...picked, s])} style={{
            background: C.panel2, border: `1px solid ${C.ruleSoft}`, borderRadius: 8, color: C.ink,
            fontFamily: SANS, fontSize: 14, padding: "6px 10px", cursor: "pointer" }}>{s.w}</button>))}
      </div>
      {done && (
        <div style={{ marginTop: 8, fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
          {correct ? item.tip : <>Richtig wäre: <strong style={{ color: C.ink }}>{item.w.join(" ")}</strong> — {item.tip}</>}
          <button onClick={(e) => speak(item.w.join(" "))} style={{ marginLeft: 6, background: "transparent",
            border: "none", cursor: "pointer", fontSize: 14 }}>🔊</button>
        </div>)}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={reset} style={{ ...navBtn, flex: 1, fontSize: 11, fontFamily: MONO, letterSpacing: "0.1em" }}>RESET</button>
        <button onClick={next} style={{ ...navBtn, flex: 1, fontSize: 11, fontFamily: MONO, letterSpacing: "0.1em", color: C.camel }}>NOCH EINS →</button>
      </div>
    </div>
  );
}

function Gespraech({ saved, onSave }) {
  const [msgs, setMsgs] = useState(saved);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const send = async () => {
    if (!inp.trim() || busy) return;
    const m2 = [...msgs, { role: "user", content: inp.trim() }];
    setMsgs(m2); setInp(""); setBusy(true); setErr(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          system: "Du bist ein geduldiger deutscher Gesprächspartner für einen A1/A2-Lerner (Muttersprache Englisch, fließend Italienisch, wohnt in Wiesbaden). Antworte in 1–3 KURZEN, einfachen deutschen Sätzen. Wenn der Lerner einen Fehler macht, korrigiere ihn knapp: ✎ richtige Form. Füge am Ende eine kurze englische Übersetzung deiner Antwort in Klammern hinzu. Stelle IMMER eine einfache Rückfrage, damit das Gespräch weitergeht. Bleibe bei Alltagsthemen: Essen, Arbeit, Sport, Wetter, Wochenende.",
          messages: m2.map(({ role, content }) => ({ role, content })),
        }),
      });
      const d = await res.json();
      const txt = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      if (!txt) throw new Error("empty");
      const m3 = [...m2, { role: "assistant", content: txt }];
      setMsgs(m3); onSave(m3);
    } catch {
      setErr("Keine Verbindung — the partner needs a network connection. Your message is kept; try Senden again.");
      setMsgs(m2);
    }
    setBusy(false);
  };
  return (
    <div>
      <div style={{ maxHeight: 260, overflowY: "auto", display: "grid", gap: 8, marginBottom: 10 }}>
        {msgs.length === 0 && (
          <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.6 }}>
            Start simple: <em>"Hallo! Ich heiße Tom. Wie geht's?"</em> — the partner answers in easy German,
            corrects with ✎, and always asks you something back. Mistakes are the point.</div>)}
        {msgs.map((m, i) => (
          <div key={i} style={{ justifySelf: m.role === "user" ? "end" : "start", maxWidth: "85%",
            background: m.role === "user" ? C.roseSoft : C.panel3,
            border: `1px solid ${m.role === "user" ? C.rose : "transparent"}`,
            borderRadius: 12, padding: "9px 12px", fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {m.content}
            {m.role === "assistant" && (
              <button onClick={() => speak(m.content.replace(/\(.*?\)/g, ""))} style={{ marginLeft: 6,
                background: "transparent", border: "none", cursor: "pointer", fontSize: 13 }}>🔊</button>)}
          </div>))}
        {busy && <div style={{ fontFamily: MONO, fontSize: 11, color: C.dimmer }}>… denkt nach</div>}
      </div>
      {err && <div style={{ fontSize: 12, color: C.behind, marginBottom: 8 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <input value={inp} onChange={(e) => setInp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Auf Deutsch schreiben…"
          style={{ flex: 1, background: C.panel3, border: "none", borderRadius: 10, color: C.ink,
            fontFamily: SANS, fontSize: 14, padding: "11px 13px", outline: "none" }} />
        <button onClick={send} disabled={busy || !inp.trim()} style={{ padding: "0 18px", borderRadius: 10,
          border: "none", cursor: busy || !inp.trim() ? "default" : "pointer",
          background: busy || !inp.trim() ? C.panel3 : C.teal, color: busy || !inp.trim() ? C.dimmer : C.ground,
          fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>SENDEN</button>
      </div>
      {msgs.length > 0 && (
        <button onClick={() => { setMsgs([]); onSave([]); }} style={{ marginTop: 8, background: "transparent",
          border: "none", cursor: "pointer", fontFamily: MONO, fontSize: 10, color: C.dimmer,
          letterSpacing: "0.1em" }}>NEUES GESPRÄCH</button>)}
    </div>
  );
}

const MUSCLES = [
  ["quads", "Quads"], ["glutes", "Glutes"], ["hamstrings", "Hamstrings"], ["calves", "Calves"],
  ["chest", "Chest"], ["shoulders", "Shoulders"], ["lats", "Lats"], ["upperback", "Upper back"],
  ["biceps", "Biceps"], ["triceps", "Triceps"], ["core", "Core"], ["grip", "Grip"]];

const BODY_FRONT = [
  { m: "shoulders", s: [["c", 36, 46, 9], ["c", 84, 46, 9]] },
  { m: "chest", s: [["r", 44, 50, 32, 20, 9]] },
  { m: "core", s: [["r", 46, 74, 28, 32, 9]] },
  { m: "biceps", s: [["r", 23, 56, 11, 26, 5], ["r", 86, 56, 11, 26, 5]] },
  { m: "grip", s: [["r", 20, 86, 10, 26, 5], ["r", 90, 86, 10, 26, 5]] },
  { m: "quads", s: [["r", 41, 126, 17, 46, 8], ["r", 62, 126, 17, 46, 8]] },
];
const BODY_BACK = [
  { m: "upperback", s: [["r", 44, 42, 32, 17, 7]] },
  { m: "lats", s: [["r", 44, 62, 32, 24, 9]] },
  { m: "triceps", s: [["r", 23, 56, 11, 26, 5], ["r", 86, 56, 11, 26, 5]] },
  { m: "glutes", s: [["r", 43, 108, 34, 19, 9]] },
  { m: "hamstrings", s: [["r", 41, 130, 17, 40, 8], ["r", 62, 130, 17, 40, 8]] },
  { m: "calves", s: [["r", 43, 174, 14, 32, 7], ["r", 63, 174, 14, 32, 7]] },
];

function BodyFig({ regions, sel, onSel, label }) {
  const shape = (sh, i, m) => {
    const active = sel === m;
    const common = { key: i, onClick: () => onSel(active ? null : m), style: { cursor: "pointer" },
      fill: active ? C.amber : "rgba(232,166,76,0.16)",
      stroke: active ? C.amber : "rgba(232,166,76,0.35)", strokeWidth: 1 };
    if (sh[0] === "c") return <circle {...common} cx={sh[1]} cy={sh[2]} r={sh[3]} />;
    return <rect {...common} x={sh[1]} y={sh[2]} width={sh[3]} height={sh[4]} rx={sh[5]} />;
  };
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 120 218" width="118" height="214">
        <circle cx="60" cy="20" r="13" fill={C.panel3} />
        <rect x="54" y="32" width="12" height="8" fill={C.panel3} />
        <rect x="40" y="38" width="40" height="72" rx="14" fill={C.panel3} />
        <rect x="22" y="42" width="13" height="72" rx="6" fill={C.panel3} />
        <rect x="85" y="42" width="13" height="72" rx="6" fill={C.panel3} />
        <rect x="40" y="108" width="40" height="16" rx="7" fill={C.panel3} />
        <rect x="41" y="122" width="17" height="88" rx="8" fill={C.panel3} />
        <rect x="62" y="122" width="17" height="88" rx="8" fill={C.panel3} />
        {regions.map((reg) => reg.s.map((sh, i) => shape(sh, reg.m + i, reg.m)))}
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 9, color: C.dimmer, letterSpacing: "0.14em" }}>{label}</div>
    </div>
  );
}

function RecordRow({ ex, r, kt, lb, last, showPhase }) {
  const disp = (v) => lb ? `${Math.round(v * 2.20462 * 2) / 2} lb` : `${v} kg`;
  const prIsLast = r?.pr && r?.last && r.pr.date === r.last.date;
  return (
    <div style={{ padding: "11px 0", borderBottom: last ? "none" : `1px solid ${C.ruleSoft}` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14 }}>{ex.n}</span>
        {showPhase && ex.ph && <span style={{ fontFamily: MONO, fontSize: 9, color: C.dimmer, letterSpacing: "0.08em" }}>PHASE {ex.ph}</span>}
        {ex.m && <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, letterSpacing: "0.06em" }}>
          {ex.m.map((mk) => (MUSCLES.find(([k]) => k === mk) || [])[1]).filter(Boolean).join(" · ").toUpperCase()}</span>}
        {prIsLast && <span style={{ fontFamily: MONO, fontSize: 9, color: C.ground, background: C.sage,
          borderRadius: 8, padding: "2px 8px", letterSpacing: "0.08em" }}>PR ✦</span>}
      </div>
      <div style={{ display: "flex", gap: 22, marginTop: 6, flexWrap: "wrap" }}>
        <div style={{ fontFamily: MONO, fontSize: 12 }}>
          <span style={{ color: C.dimmer, fontSize: 10, letterSpacing: "0.1em" }}>PR </span>
          {r?.pr ? <span style={{ color: C.neon }}>{disp(r.pr.load)} × {r.pr.reps ?? "—"}{ex.unit === "m" ? " m" : ""}
            <span style={{ color: C.dimmer }}> · {pretty(r.pr.date)}</span></span>
            : <span style={{ color: C.dimmer }}>—</span>}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 12 }}>
          <span style={{ color: C.dimmer, fontSize: 10, letterSpacing: "0.1em" }}>LAST </span>
          {r?.last ? <span style={{ color: C.ink }}>{pretty(r.last.date)}: {r.last.sets.map((s) =>
              `${s.load != null ? (lb ? Math.round(s.load * 2.20462) : s.load) : "·"}×${s.reps ?? "?"}`).join("  ")}</span>
            : <span style={{ color: C.dimmer }}>not yet logged</span>}
        </div>
      </div>
      {kt?.last && (
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.rose, marginTop: 4 }}>
          KIT · last {pretty(kt.last.date)}: {kt.last.sets.map((s) => `${s.load ?? 0}×${s.reps ?? "?"}`).join("  ")}</div>)}
    </div>
  );
}

function RestTimer() {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (left == null || left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {left != null ? (
        <>
          <span style={{ fontFamily: MONO, fontSize: 15, minWidth: 44, textAlign: "right",
            color: left === 0 ? C.sage : C.neon }}>{left === 0 ? "GO ✓" : fmt(left)}</span>
          <button onClick={() => setLeft(null)} style={{ ...timerBtn, color: C.dim }}>✕</button>
        </>
      ) : (
        <>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, letterSpacing: "0.08em" }}>REST</span>
          <button onClick={() => setLeft(90)} style={timerBtn}>1:30</button>
          <button onClick={() => setLeft(150)} style={timerBtn}>2:30</button>
        </>
      )}
    </div>
  );
}
const timerBtn = { background: "transparent", border: `1px solid ${C.rule}`, borderRadius: 12,
  color: C.camel, fontFamily: MONO, fontSize: 11, padding: "5px 11px", cursor: "pointer" };
