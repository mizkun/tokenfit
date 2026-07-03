import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  addClaudeHook,
  hookCommandString,
  installClaudeCode,
  isTokenFitHookCommand,
  removeClaudeHook,
  uninstallClaudeCode
} from '../lib/install.mjs';

describe('hook command', () => {
  it('points at the real bin with an absolute path (works from a git clone)', () => {
    const cmd = hookCommandString();
    assert.match(cmd, /^node ".*bin\/tokenfit\.mjs" hook$/);
  });

  it('recognizes every historical hook command shape', () => {
    assert.ok(isTokenFitHookCommand('tokenfit hook'));
    assert.ok(isTokenFitHookCommand('node /Users/x/TokenFit/bin/tokenfit.mjs hook'));
    assert.ok(isTokenFitHookCommand('node "/Users/x/My Dir/bin/tokenfit.mjs" hook'));
    assert.ok(isTokenFitHookCommand('TOKENFIT_LANG=ja node /x/bin/tokenfit.mjs hook'));
    assert.ok(!isTokenFitHookCommand('git hook'));
    assert.ok(!isTokenFitHookCommand('prettier --write'));
    assert.ok(!isTokenFitHookCommand('tokenfit start'));
  });
});

describe('claude settings surgery', () => {
  const commandsOf = (settings) =>
    (settings.hooks?.UserPromptSubmit || []).flatMap((entry) => entry.hooks.map((hook) => hook.command));

  it('adds exactly one hook and is idempotent', () => {
    const settings = addClaudeHook({});
    addClaudeHook(settings);

    assert.equal(commandsOf(settings).filter(isTokenFitHookCommand).length, 1);
  });

  it('upgrades a legacy "tokenfit hook" entry instead of duplicating it', () => {
    const settings = {
      hooks: {
        UserPromptSubmit: [
          { matcher: '', hooks: [{ type: 'command', command: 'tokenfit hook' }] }
        ]
      }
    };
    addClaudeHook(settings);

    const tokenfitCommands = commandsOf(settings).filter(isTokenFitHookCommand);
    assert.equal(tokenfitCommands.length, 1);
    assert.equal(tokenfitCommands[0], hookCommandString());
  });

  it('removes all variants and preserves other hooks', () => {
    const settings = {
      hooks: {
        UserPromptSubmit: [
          {
            matcher: '',
            hooks: [
              { type: 'command', command: 'tokenfit hook' },
              { type: 'command', command: 'echo hi' }
            ]
          },
          { matcher: '', hooks: [{ type: 'command', command: hookCommandString() }] }
        ]
      }
    };
    removeClaudeHook(settings);

    assert.deepEqual(commandsOf(settings), ['echo hi']);
  });
});

describe('install and uninstall against a fake home', () => {
  it('writes settings and the /tf command file, then removes both cleanly', async () => {
    const home = await mkdtemp(join(tmpdir(), 'tokenfit-home-'));
    const silent = () => {};

    await installClaudeCode({ home, yes: true, log: silent });

    const settingsFile = join(home, '.claude', 'settings.json');
    const commandFile = join(home, '.claude', 'commands', 'tf.md');
    const installed = JSON.parse(await readFile(settingsFile, 'utf8'));
    assert.ok(JSON.stringify(installed).includes('tokenfit.mjs'));
    assert.ok(existsSync(commandFile));

    await uninstallClaudeCode({ home, yes: true, log: silent });

    const removed = JSON.parse(await readFile(settingsFile, 'utf8'));
    assert.ok(!JSON.stringify(removed).includes('tokenfit'));
    assert.ok(!existsSync(commandFile));
  });
});
