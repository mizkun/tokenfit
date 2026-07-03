---
description: TokenFit — log reps, view stats, share
argument-hint: done | skip | how | stats | web | x
---

TokenFit's UserPromptSubmit hook normally intercepts /tf before it ever reaches you.
If you are reading this, the hook is missing or disabled, so act as the fallback.
The local TokenFit API lives at http://127.0.0.1:4317.

The user typed: /tf $ARGUMENTS

- done → POST /api/done with body {}
- skip → POST /api/skip with body {}
- how → GET /api/state and list the current exercise's steps
- (empty) or stats → GET /api/state and summarize stats in one line
- web → open http://127.0.0.1:4317 in the default browser
- x → GET /api/state, then open https://twitter.com/intent/tweet?text=<url-encoded brag with stats.totalReps and #TokenFit>

Use curl (and `open` on macOS). If the API is unreachable, tell the user to run `tokenfit start`.
Reply with a single short line about what happened.
