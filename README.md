# GTA VI Trophy Guide & Tracker

[![GTA VI Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/Usogakie/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/Usogakie/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden; 0 online — built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01?ref=skbtbry2).

## What it does

- **Checklist tracker** — tick trophies off as you earn them. Progress saves in the browser via localStorage, and you can export it to a file and import it back.
- **Roadmap to the platinum** — three stages: story plus the one missable moment, the 100% checklist, then strangers and cleanup — about 200 hours, one playthrough.
- **Missable flags** — only one trophy is flagged as possibly missable: Positive Mental Attitude, whose first meditation in Chapter 1 cannot be repeated.
- **Filters and search** — filter by kind (story, missable, collectibles, activities, side quests, robberies & partner, money & garages, challenges, secrets, online) and by grade, plus a text search across names, descriptions, guides and steps.
- **Spoiler shield** — hides story trophy names and descriptions until you earn them.
- **Honest about the unknowns** — five trophies PowerPyx still lists as currently unknown are marked unconfirmed rather than given an invented method.

Every trophy shows its official name, description and grade as PlayStation publishes them, plus a guide written in our own words that names its sources — mainly PowerPyx's trophy guide & roadmap, cross-checked against the PSNProfiles / Exophase trophy list, KeenGamer and GameMapa.

It is fully offline: every file the app loads lives under `app/`, with no network requests, and it uses no Rockstar logo, artwork, box art or game screenshots.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.
