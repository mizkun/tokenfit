import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BIN_PATH = fileURLToPath(new URL('../bin/tokenfit.mjs', import.meta.url));

export const TF_COMMAND_MD = `---
description: TokenFit — log reps, view stats, share
argument-hint: done | skip | how | stats | web | x | on | off | lang
---

TokenFit's UserPromptSubmit hook normally intercepts /tf before it ever reaches you.
If you are reading this, the hook is missing or disabled, so act as the fallback.
The local TokenFit API lives at http://127.0.0.1:4317.

The user typed: /tf $ARGUMENTS

- done → POST /api/done with body {}
- skip → POST /api/skip with body {}
- how → GET /api/state and list the current exercise's steps
- on / off → POST /api/settings with {"paused": false} / {"paused": true}
- lang en|ja (or bare ja|en) → POST /api/settings with {"lang": "..."}
- (empty) or stats → GET /api/state and summarize stats in one line
- web → open http://127.0.0.1:4317 in the default browser
- x → GET /api/state, then open https://twitter.com/intent/tweet?text=<url-encoded brag with stats.totalReps and #TokenFit>

Use curl (and \`open\` on macOS). If the API is unreachable, tell the user to run \`tokenfit start\`.
Reply with a single short line about what happened.
`;

export function hookCommandString() {
  return `node "${BIN_PATH}" hook`;
}

export function isTokenFitHookCommand(command) {
  return typeof command === 'string' && command.includes('tokenfit') && /\bhook\s*$/.test(command);
}

export function settingsPath(home = homedir()) {
  return join(home, '.claude', 'settings.json');
}

export function commandFilePath(home = homedir()) {
  return join(home, '.claude', 'commands', 'tf.md');
}

export async function readClaudeSettings(home = homedir()) {
  const path = settingsPath(home);
  if (!existsSync(path)) {
    return {};
  }
  const raw = await readFile(path, 'utf8');
  return raw.trim() ? JSON.parse(raw) : {};
}

export function hasTokenFitHook(settings) {
  return (settings.hooks?.UserPromptSubmit || []).some((entry) =>
    Array.isArray(entry.hooks) && entry.hooks.some((hook) => isTokenFitHookCommand(hook.command))
  );
}

export function removeClaudeHook(settings) {
  const entries = settings.hooks?.UserPromptSubmit;
  if (!Array.isArray(entries)) {
    return settings;
  }

  settings.hooks.UserPromptSubmit = entries
    .map((entry) => ({
      ...entry,
      hooks: Array.isArray(entry.hooks)
        ? entry.hooks.filter((hook) => !isTokenFitHookCommand(hook.command))
        : entry.hooks
    }))
    .filter((entry) => !Array.isArray(entry.hooks) || entry.hooks.length > 0);

  return settings;
}

export function addClaudeHook(settings) {
  removeClaudeHook(settings);
  settings.hooks ||= {};
  settings.hooks.UserPromptSubmit ||= [];
  settings.hooks.UserPromptSubmit.push({
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: hookCommandString()
      }
    ]
  });

  return settings;
}

async function writeClaudeSettings(settings, home) {
  const path = settingsPath(home);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
}

export async function installClaudeCode({ home = homedir(), yes = false, log = console.log } = {}) {
  const settings = addClaudeHook(await readClaudeSettings(home));

  if (!yes) {
    log(`Ready to add this hook to ${settingsPath(home)}:`);
    log(JSON.stringify(settings.hooks.UserPromptSubmit.at(-1), null, 2));
    log(`Also writes the /tf slash command to ${commandFilePath(home)}.`);
    log('Run again with --yes to write the files.');
    return false;
  }

  await writeClaudeSettings(settings, home);
  await mkdir(dirname(commandFilePath(home)), { recursive: true });
  await writeFile(commandFilePath(home), TF_COMMAND_MD, 'utf8');
  log(`Installed Claude Code hook in ${settingsPath(home)}`);
  log(`Installed /tf command in ${commandFilePath(home)}`);
  return true;
}

export async function uninstallClaudeCode({ home = homedir(), yes = false, log = console.log } = {}) {
  const settings = removeClaudeHook(await readClaudeSettings(home));

  if (!yes) {
    log(`Ready to remove TokenFit hooks from ${settingsPath(home)} and ${commandFilePath(home)}.`);
    log('Run again with --yes to write the files.');
    return false;
  }

  await writeClaudeSettings(settings, home);
  await rm(commandFilePath(home), { force: true });
  log(`Removed TokenFit Claude Code hook from ${settingsPath(home)}`);
  return true;
}
