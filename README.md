# TokenFit 🏋️

> **Your AI thinks. You rep.**

![npm](https://img.shields.io/npm/v/%40mizkun%2Ftokenfit)
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![blazingly](https://img.shields.io/badge/blazingly-local-blue)
![gains](https://img.shields.io/badge/gains-unaudited-orange)
![medical advice](https://img.shields.io/badge/medical%20advice-none-red)

The dumbest local fitness tracker for people who wait for AI agents. Every prompt you send to Claude Code queues one tiny desk exercise, right in your terminal. Do it before the tokens finish streaming.

```text
> refactor the parser and fix the tests

  🏋️ Shoulder rolls — 12 reps (Shoulders)
  1. Sit or stand tall.
  2. Roll both shoulders up, back, and down.
  3. Keep the motion slow and relaxed.
  → /tf done when finished · /tf skip to bail

  ⏺ Claude is thinking… (this is your set window)

> /tf done

  ✅ Shoulder rolls — 12 reps done! Today: 3 sets · 🔥 7-day streak · 412 total reps
```

> "I did 412 shoulder rolls waiting for a refactor." — an engineer, probably

Landing page: **https://token-fit-cdad0.web.app**

## How it works

A `UserPromptSubmit` hook fires on every prompt. TokenFit issues one exercise (10-minute cooldown, never stacks up guilt) and shows it via `systemMessage`. Typing `/tf ...` as a prompt is intercepted by the same hook and **blocked before it reaches the model** — zero tokens, zero latency, zero transcript noise.

| Input | What happens |
| --- | --- |
| any prompt | queues an exercise and shows it in the terminal |
| `/tf` | current challenge and today's stats |
| `/tf done` (`/tf d`) | mark it done |
| `/tf skip` (`/tf s`) | skip it — we saw that |
| `/tf how` | step-by-step instructions for the current exercise |
| `/tf stats` | text stats in the terminal |
| `/tf web` | open the local dashboard (contribution graph of gains) |
| `/tf x` | open X with a pre-filled brag post |
| `/tf off` / `/tf on` | pause / resume the gains — the couch understands |
| `/tf lang ja` (`/tf ja`, `/tf en`) | switch language, persisted in the daemon |

## Exercises

30 tiny desk exercises, each about a minute: no equipment, no floor, office-clothes friendly, quiet enough for an open office. Random picks never repeat any of the previous 8. Full English and Japanese copy — set `TOKENFIT_LANG=ja` for Japanese terminal messages; the web dashboard has its own EN/日本語 toggle.

## Install

```sh
npm install -g @mizkun/tokenfit
tokenfit init      # wires the Claude Code hook + /tf command
tokenfit start     # daemon + dashboard on 127.0.0.1:4317
```

Or from source:

```sh
git clone https://github.com/mizkun/tokenfit.git
cd tokenfit
node ./bin/tokenfit.mjs init
npm start
```

The installer writes a `UserPromptSubmit` hook into `~/.claude/settings.json` and a `/tf` slash command into `~/.claude/commands/tf.md` (autocomplete + fallback when the hook is missing). `node ./bin/tokenfit.mjs doctor` checks the whole chain. The hook exits quietly if the daemon is not running — it will never block your agent session.

## Local-first, on purpose

Hooks carry your prompts and your agent-usage rhythm. So the daemon binds to `127.0.0.1`, history lives in `data/tokenfit.json` (gitignored), and nothing is ever sent anywhere. The only thing in the cloud is the landing page.

## API

- `POST /api/hook` — queue a generated exercise. Returns `issued: false` (plus the pending challenge, if any) while one is pending or during the cooldown.
- `POST /api/challenge` — queue a manual exercise.
- `POST /api/done` — complete the current exercise (`{ "id": "..." }` targets a specific one).
- `POST /api/skip` — skip it (same optional `id`).
- `GET /api/state` — current queue, recent activity, totals.
- `GET /api/events` — server-sent events stream of state changes.

## Configuration

| Env var | Default | What it does |
| --- | --- | --- |
| `TOKENFIT_PORT` | `4317` | daemon port |
| `TOKENFIT_URL` | `http://127.0.0.1:4317` | where the hook posts |
| `TOKENFIT_DATA_FILE` | `./data/` (git clone) or `~/.tokenfit/` (npm install) | history location |
| `TOKENFIT_COOLDOWN_MS` | `600000` | minimum rest between exercises |
| `TOKENFIT_LANG` | `en` | initial language; `/tf lang` overrides and persists |
| `TOKENFIT_HOOK_TIMEOUT_MS` | `900` | hook fail-fast budget |

## FAQ

**Is this a joke?** Yes.

**Does it work?** Unfortunately.

**Will it make me fit?** It will make you `/tf done`. The rest is between you and your chair.

**Does my AI judge my skipped sets?** No. `/tf` never reaches the model. Your shame stays local, like your data.

**Pricing?** Free. Pro tier: also free. Enterprise: please don't.

**Can I turn it off?** `tokenfit uninstall claude-code --yes`. Your streak will miss you.

## Development

```sh
npm test
```

TokenFit is a toy, not health advice. Stop if anything hurts. MIT licensed.
