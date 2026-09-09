repo: tomhearon/LifeOS_Hearon
branch: main

## Last sync
date: 2026-09-07T19:57:39Z
### Updated in this project
- Added Inventory as a top-level area (library spine view + arrangement methods, cellar, valuables/insurance register)
- Added Cardio log (min/km/avg HR, session types) and Personal Records board to Health & Mind
- New demo data mirrors the Sep working build's cardio + PR features

## Screen map
| Project screen (Life OS.dc.html) | Repo files |
|---|---|
| Health & Mind (cardio log, PRs, glide path, mood/energy) | life-os-health (07 SEP 26).jsx, DESIGN-HANDOFF.md |
| Inventory (library, cellar, valuables) | home-inventory.jsx |
| Today / Money / Admin / Learning / Review / Agents / Settings | (designed here; no repo counterpart yet) |

## Notes
- Repo health build is now "Campaign 95" (110.2→98.0 kg, German focus, 07 Sep–20 Dec); the prototype here still shows the earlier Readjustment demo narrative — reconcile on next design pass if desired.
- Repo data layer contracts (do not break when handing designs back): storage key `lifeos.v3.health`, inventory keys `homeinv:v1:*`, `window.storage` only (no localStorage), exercise-key + `~t` travel suffix conventions.
