# GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Usogakie/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Usogakie/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI** (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden; 0 online), built for the [make.fun bounty gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01?ref=skbtbry2).

Every trophy shows its official name, description and grade as PlayStation publishes them, plus a guide written in our own words that names its sources (mainly PowerPyx's trophy guide & roadmap, cross-checked against the PSNProfiles / Exophase trophy list, KeenGamer and GameMapa). The app includes:

- A **checklist tracker** — tick trophies off, progress saves in your browser (localStorage), and can be exported to a file and imported back.
- A **roadmap to the platinum** — three stages (story + the one missable moment, the 100% checklist, strangers & cleanup), about 200 hours, one playthrough.
- **Missable flags** — only one trophy is flagged as possibly missable: Positive Mental Attitude, whose first meditation in Chapter 1 cannot be repeated.
- **Filters** by kind (story, missable, collectibles, activities, side quests, robberies & partner, money & garages, challenges, secrets, online) and by grade, plus search.
- A **spoiler shield** that hides story trophy names and descriptions until you earn them.
- Five trophies PowerPyx still lists as currently unknown are marked unconfirmed rather than given an invented method.

Fully offline: every file the app loads lives under `app/`, and it makes no network requests. No Rockstar logo, artwork, box art or game screenshots — the look is our own.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.
