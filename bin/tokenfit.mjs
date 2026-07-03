#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { handlePromptSubmit } from '../lib/tf.mjs';
import {
  commandFilePath,
  hasTokenFitHook,
  installClaudeCode,
  readClaudeSettings,
  settingsPath,
  uninstallClaudeCode
} from '../lib/install.mjs';
import { createTokenFitServer } from '../server.mjs';

const DEFAULT_PORT = Number(process.env.TOKENFIT_PORT || process.env.PORT || 4317);
const DEFAULT_URL = process.env.TOKENFIT_URL || `http://127.0.0.1:${DEFAULT_PORT}`;
const HOOK_TIMEOUT_MS = Number(process.env.TOKENFIT_HOOK_TIMEOUT_MS || 900);

function help() {
  console.log(`TokenFit — Your AI thinks. You rep.

Usage:
  tokenfit init                 install the Claude Code hook and explain the rest
  tokenfit start                run the daemon + dashboard on 127.0.0.1:${DEFAULT_PORT}
  tokenfit status               print stats from the running daemon
  tokenfit doctor               check node, daemon, hook, and /tf command
  tokenfit hook                 (used by the Claude Code hook)
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

async function daemonRunning() {
  try {
    const response = await fetch(`${DEFAULT_URL}/api/state`);
    return response.ok;
  } catch {
    return false;
  }
}

async function init() {
  if (process.argv[1]?.includes('_npx')) {
    console.log('Heads up: you are running from the npx cache, which gets pruned.');
    console.log('For a hook that survives, install globally first: npm install -g @mizkun/tokenfit');
    return;
  }

  await installClaudeCode({ yes: true });
  console.log('');

  if (await daemonRunning()) {
    console.log(`Daemon: already running at ${DEFAULT_URL}`);
  } else {
    console.log(`Daemon: not running. Start it with: tokenfit start`);
  }
  console.log('Then send any prompt in Claude Code. Your AI thinks. You rep.');
}

async function doctor() {
  const checks = [];
  checks.push(['node', process.versions.node]);
  checks.push(['settings', existsSync(settingsPath()) ? settingsPath() : 'not found']);
  checks.push(['daemon', (await daemonRunning()) ? 'running' : 'not running']);

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
  } else if (command === 'init') {
    await init();
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
