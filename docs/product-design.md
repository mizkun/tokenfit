# TokenFit product design

## Positioning

TokenFit is a local-first joke fitness tracker for engineers waiting on coding agents.

Core line:

> Your AI thinks. You rep.

The product should feel funny, tiny, and useful enough that people leave it installed.

## Recommended architecture

```text
Claude Code hook
  -> tokenfit hook CLI
  -> local TokenFit daemon on 127.0.0.1
  -> local web UI over SSE
  -> local SQLite or JSON store
```

Firebase Hosting should host the public website, install docs, and download page. The actual tracker should stay local because hooks, exercise history, and agent timing are personal workspace signals.

## Why local-first

- No account needed for the joke to land.
- Hooks work even when the user is offline.
- Private coding activity never leaves the machine.
- Engineers trust a localhost tool more than a cloud fitness tracker watching their agent sessions.
- Firebase can still serve the global marketing site and docs.

## Install path

Start with an npm package because the audience is engineers and Claude Code users already have Node nearby.

Preferred command:

```sh
npx tokenfit@latest init
```

That command should:

1. Install or locate the `tokenfit` CLI.
2. Create `~/.tokenfit/config.json`.
3. Ask before patching `~/.claude/settings.json`.
4. Add a `UserPromptSubmit` hook that runs `tokenfit hook`.
5. Start the local daemon or print `tokenfit start`.
6. Open `http://127.0.0.1:4317`.

Later channels:

- Homebrew: `brew install tokenfit`
- Standalone binary for users without Node
- Docker only as a novelty, not the default

## CLI shape

```sh
tokenfit start
tokenfit hook
tokenfit status
tokenfit doctor
tokenfit install claude-code
tokenfit uninstall claude-code
```

`tokenfit hook` must be fast, quiet, and failure-proof. It should never block the coding agent.

## Data model

MVP can use JSON. A distributed package should move to SQLite at `~/.tokenfit/tokenfit.db`.

Tables:

- `events`: raw hook events and timestamps
- `challenges`: generated exercise, status, created/completed/skipped timestamps
- `daily_stats`: cached daily reps and streak data
- `settings`: intensity, disabled exercises, locale, hook preferences

## Internationalization

Default to English. Keep copy short, memeable, and easy to screenshot.

Avoid region-specific jokes in the core UI. Put personality in exercise names, streak labels, and release notes. Exercise units should be simple: reps, seconds, sets.

First locales worth considering:

- English
- Japanese
- German
- French
- Spanish

## Safety and privacy

Use tiny desk exercises only. Include Skip, intensity settings, and disabled exercise lists. Avoid medical claims. Keep the app explicit that it is a toy, not health advice.

Do not send hook events to Firebase by default. If global stats or leaderboards are added, make them opt-in and aggregate-only.

## Firebase scope

Use Firebase Hosting for:

- Landing page
- Install docs
- Release notes
- Hook snippet generator
- Optional anonymous global counter

Do not make Firebase required for:

- Receiving hooks
- Viewing local reps
- Completing exercises
- Storing personal history

## MVP checklist

- Local server and UI
- Hook endpoint
- Claude Code hook command
- Done and Skip flow
- Local persistence
- `tokenfit doctor`
- Installer that patches Claude Code settings with confirmation
- English-first docs
