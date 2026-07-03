#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { handlePromptSubmit } from '../lib/tf.mjs';
import { createTokenFitServer } from '../server.mjs';

const DEFAULT_PORT = Number(process.env.TOKENFIT_PORT || process.env.PORT || 4317);
const DEFAULT_URL = process.env.TOKENFIT_URL || `http://127.0.0.1:${DEFAULT_PORT}`;
const HOOK_TIMEOUT_MS = Number(process.env.TOKENFIT_HOOK_TIMEOUT_MS || 450);

function help() {
  console.log(`TokenFit

Usage:
  tokenfit start
  tokenfit hook
  tokenfit status
  tokenfit doctor
  tokenfit install claude-code [--yes]
  tokenfit uninstall claude-code [--yes]
`);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

function parsePayload(raw) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

async function postHook() {
  const raw = await readStdin();
  const input = parsePayload(raw) || {};

  try {
    const output = await handlePromptSubmit(input, {
      baseUrl: DEFAULT_URL,
      timeoutMs: HOOK_TIMEOUT_MS
    });
    if (output) {
      console.log(JSON.stringify(output));
    }
  } catch {
    // Hooks must never block the coding agent.
  }
}

async function start() {
  const { server } = createTokenFitServer();
  server.listen(DEFAULT_PORT, '127.0.0.1', () => {
    console.log(`TokenFit is running at ${DEFAULT_URL}`);
    console.log(`Hook endpoint: ${DEFAULT_URL}/api/hook`);
  });
}

async function status() {
  const response = await fetch(`${DEFAULT_URL}/api/state`);
  if (!response.ok) {
    throw new Error(`TokenFit returned ${response.status}`);
  }
  const state = await response.json();
  console.log(JSON.stringify(state.stats, null, 2));
}

function settingsPath() {
  return join(homedir(), '.claude', 'settings.json');
}

function commandFilePath() {
  return join(homedir(), '.claude', 'commands', 'tf.md');
}

const TF_COMMAND_MD = `---
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

async function writeCommandFile() {
  await mkdir(dirname(commandFilePath()), { recursive: true });
  await writeFile(commandFilePath(), TF_COMMAND_MD, 'utf8');
}

async function readClaudeSettings() {
  const path = settingsPath();
  if (!existsSync(path)) {
    return {};
  }
  const raw = await readFile(path, 'utf8');
  return raw.trim() ? JSON.parse(raw) : {};
}

function hookCommand() {
  return 'tokenfit hook';
}

function hasTokenFitHook(settings) {
  return JSON.stringify(settings.hooks || {}).includes(hookCommand());
}

function addClaudeHook(settings) {
  settings.hooks ||= {};
  settings.hooks.UserPromptSubmit ||= [];

  if (!hasTokenFitHook(settings)) {
    settings.hooks.UserPromptSubmit.push({
      matcher: '',
      hooks: [
        {
          type: 'command',
          command: hookCommand()
        }
      ]
    });
  }

  return settings;
}

function removeClaudeHook(settings) {
  const entries = settings.hooks?.UserPromptSubmit;
  if (!Array.isArray(entries)) {
    return settings;
  }

  settings.hooks.UserPromptSubmit = entries
    .map((entry) => ({
      ...entry,
      hooks: Array.isArray(entry.hooks)
        ? entry.hooks.filter((hook) => hook.command !== hookCommand())
        : entry.hooks
    }))
    .filter((entry) => !Array.isArray(entry.hooks) || entry.hooks.length > 0);

  return settings;
}

async function writeClaudeSettings(settings) {
  const path = settingsPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
}

async function installClaudeCode({ yes = false } = {}) {
  const path = settingsPath();
  const settings = addClaudeHook(await readClaudeSettings());

  if (!yes) {
    console.log(`Ready to add this hook to ${path}:`);
    console.log(JSON.stringify(addClaudeHook(await readClaudeSettings()).hooks.UserPromptSubmit.at(-1), null, 2));
    console.log(`Also writes the /tf slash command to ${commandFilePath()}.`);
    console.log('Run again with --yes to write the files.');
    return;
  }

  await writeClaudeSettings(settings);
  await writeCommandFile();
  console.log(`Installed Claude Code hook in ${path}`);
  console.log(`Installed /tf command in ${commandFilePath()}`);
}

async function uninstallClaudeCode({ yes = false } = {}) {
  const path = settingsPath();
  const settings = removeClaudeHook(await readClaudeSettings());

  if (!yes) {
    console.log(`Ready to remove TokenFit hooks from ${path} and ${commandFilePath()}.`);
    console.log('Run again with --yes to write the files.');
    return;
  }

  await writeClaudeSettings(settings);
  await rm(commandFilePath(), { force: true });
  console.log(`Removed TokenFit Claude Code hook from ${path}`);
}

async function doctor() {
  const checks = [];
  checks.push(['node', process.versions.node]);
  checks.push(['settings', existsSync(settingsPath()) ? settingsPath() : 'not found']);

  try {
    const response = await fetch(`${DEFAULT_URL}/api/state`);
    checks.push(['daemon', response.ok ? 'running' : `http ${response.status}`]);
  } catch {
    checks.push(['daemon', 'not running']);
  }

  try {
    const settings = await readClaudeSettings();
    checks.push(['claude hook', hasTokenFitHook(settings) ? 'installed' : 'not installed']);
  } catch (error) {
    checks.push(['claude hook', `settings parse error: ${error.message}`]);
  }

  checks.push(['/tf command', existsSync(commandFilePath()) ? 'installed' : 'not installed']);

  for (const [name, value] of checks) {
    console.log(`${name}: ${value}`);
  }
}

const [command, target, ...rest] = process.argv.slice(2);
const yes = rest.includes('--yes');

try {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    help();
  } else if (command === 'start') {
    await start();
  } else if (command === 'hook') {
    await postHook();
  } else if (command === 'status') {
    await status();
  } else if (command === 'doctor') {
    await doctor();
  } else if (command === 'install' && target === 'claude-code') {
    await installClaudeCode({ yes });
  } else if (command === 'uninstall' && target === 'claude-code') {
    await uninstallClaudeCode({ yes });
  } else {
    help();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
