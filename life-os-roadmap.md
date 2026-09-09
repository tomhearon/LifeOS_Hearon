# Life OS — Platform Roadmap
*From single-user artifact to family platform on home infrastructure. Drafted 09 Sep 2026.*
*This document can seed a dedicated chat: paste it in and say "continue the roadmap from phase N."*

---

## Phase 0 — Artifact era (now → ongoing)
The working app lives as a Claude artifact; Campaign 95 (07 Sep–20 Dec) runs on it daily.
- Keep logging; weekly ⇩ EXPORT → COPY ALL as backup
- GitHub repo `life-os` = source of truth for the code (`main` always current)
- **Exit criteria:** repo exists with README + handoff brief + current jsx committed ✅

## Phase 1 — Design merge (Sep–Oct 2026)
Adopt the Claude Design visual system onto the working data layer.
- Commit Design outputs to `design/` in the repo (never straight onto `main`)
- Merge in the working chat: tokens → components → layout, data layer untouched per `DESIGN-HANDOFF.md`
- Test on phone for one full training week before committing merged build to `main`
- **Exit criteria:** one app, new skin, zero data-layer changes, a week of clean daily use

## Phase 2 — Home server, single user (Nov 2026 – Jan 2027)
Retire the artifact; Life OS becomes real infrastructure. (Realistic start: after Phoenix; done during the January Finisher block.)
- Hardware: N150-class mini PC or used ThinkCentre Tiny — 16 GB RAM, 2–4 TB SSD
- Stack: Debian/Ubuntu Server → Docker Compose → Tailscale (free personal plan)
- App rebuild: Next.js + Postgres; seed DB from the artifact's export JSON
- iPhone/iPad/laptop access as PWA over Tailscale (Add to Home Screen)
- Nightly restic backup to external USB drive
- **Exit criteria:** artifact retired; phone logs to the server from anywhere; backups verified by a test restore

## Phase 3 — Family services (Q1 2027)
The box earns its place with the whole household before the app does.
- **Immich** for photos: auto-backup from both phones, faces, timeline, shared albums
- **Nextcloud** (or Samba + Syncthing) for documents
- Wife joins the tailnet as user #2, all her devices
- Offsite backup goes live: Hetzner Storage Box or Backblaze, encrypted
- **Exit criteria:** all family photos on the box + offsite; wife uses it without asking how

## Phase 4 — Family platform (2027, after Gutenberg HM block begins)
Life OS becomes multi-user and modular.
- Real accounts (Postgres + auth); per-user **module registry** — everyone assembles their own OS
- Current tabs refactored as modules: Fitness, Fuel, Deutsch, Mind, Body/Tests → Tom's set
- New modules by need: Yoga, Home Organization (wife's set); Education later for kids
- Private-by-default per user; explicitly shared surfaces (family calendar, home-org lists) opt-in
- App links out to Immich/Nextcloud rather than reimplementing files
- **Exit criteria:** two active daily users with different module sets

## Standing principles
- Data layer outlives every redesign; visuals graft onto it, never the reverse
- Buy/adopt solved problems (photos, files, sync); build only what's unique to us
- Every phase ships something used daily before the next phase starts
- 3-2-1 backups from the moment family data touches the box
