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

`tokenfit hook` posts to TokenFit and exits quietly if the app is not running, so it should not break your agent session.

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

- `POST /api/hook` queues a generated exercise.
- `POST /api/challenge` queues a manual exercise.
- `POST /api/done` with `{ "id": "..." }` marks a queued exercise done.
- `POST /api/skip` with `{ "id": "..." }` skips it.
- `GET /api/state` returns the current queue, recent activity, and totals.
