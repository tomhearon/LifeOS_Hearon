# Life OS — Design Package (from Claude Design)

Design prototypes and handoff for the Life OS personal dashboard.
Companion to the working build in this repo (`life-os-health (07 SEP 26).jsx`, `home-inventory.jsx`).

## Contents
- `design_handoff_life_os/README.md` — **start here**: full spec, theme tokens, screen inventory, merge-safe data-layer contracts, phased build order for Claude Code
- `design_handoff_life_os/Life OS.dc.html` — working prototype: all 9 screens, interactions, theme system, Claude prompts (primary design reference)
- `design_handoff_life_os/Life OS Directions.dc.html` — design exploration canvas: five themes, phone layouts, area mockups
- `design_handoff_life_os/github.md` — repo association + sync state
- `design_handoff_life_os/image-slot.js`, `ios-frame.jsx`, `support.js` — prototype runtime helpers (not for production)

## Suggested repo location
Commit as a `design/` folder at the repo root, e.g.:
```
git clone https://github.com/tomhearon/LifeOS_Hearon && cd LifeOS_Hearon
unzip ~/Downloads/design.zip -d design/
git add design && git commit -m "Add Life OS design package (v2, 09 Sep 2026)" && git push
```

## Using with Claude Code
In the repo folder, run `claude` and prompt:
"Read design/design_handoff_life_os/README.md. Merge the design onto the existing
apps phase by phase, respecting the data-layer contracts section exactly."
