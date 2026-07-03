# TokenFit

Your AI thinks. You rep.

The dumbest local fitness tracker for people who wait for AI agents. Every hook call queues one tiny exercise. Do it, click Done, and watch the reps pile up.

## Run

```sh
npm start
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

## Local CLI

This checkout already exposes the future package shape:

```sh
node ./bin/tokenfit.mjs start
node ./bin/tokenfit.mjs hook
node ./bin/tokenfit.mjs doctor
node ./bin/tokenfit.mjs install claude-code
```

For a packaged release, the intended install flow is:

```sh
npx tokenfit@latest init
tokenfit install claude-code --yes
tokenfit start
```

## Claude Code hook

`tokenfit hook` is the whole terminal UX. On every prompt it queues one exercise and shows it right in your Claude Code session via `systemMessage`. Typing `/tf ...` as a prompt is intercepted by the hook (blocked before it reaches the model — zero tokens):

| Input | What happens |
| --- | --- |
| any prompt | queues an exercise (10 min cooldown, never stacks) and shows it in the terminal |
| `/tf` | show the current challenge and today's stats |
| `/tf done` (`/tf d`) | mark it done |
| `/tf skip` (`/tf s`) | skip it |
| `/tf stats` | text stats in the terminal |
| `/tf web` | open the local dashboard in the browser |
| `/tf x` | open X with a pre-filled brag post |

`tokenfit install claude-code --yes` writes the hook into `~/.claude/settings.json` and a `/tf` slash command into `~/.claude/commands/tf.md` (autocomplete + fallback when the hook is missing).

`tokenfit hook` exits quietly if the app is not running, so it should not break your agent session.

Example `~/.claude/settings.json` hook:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /Users/kyohei/TokenFit/bin/tokenfit.mjs hook"
          }
        ]
      }
    ]
  }
}
```

For maximum nonsense, point another hook event at the same command. TokenFit stores local progress in `data/tokenfit.json`.

## API

- `POST /api/hook` queues a generated exercise. Returns `issued: false` (and the pending challenge, if any) while one is already pending or during the cooldown (`TOKENFIT_COOLDOWN_MS`, default 10 min).
- `POST /api/challenge` queues a manual exercise.
- `POST /api/done` marks the current exercise done (`{ "id": "..." }` targets a specific one).
- `POST /api/skip` skips it (same optional `id`).
- `GET /api/state` returns the current queue, recent activity, and totals.
