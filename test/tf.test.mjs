import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  completeChallenge,
  createInitialState,
  createTokenFitServer,
  issueHookChallenge
} from '../server.mjs';
import {
  buildShareText,
  handlePromptSubmit,
  parseTfCommand,
  shareUrl
} from '../lib/tf.mjs';

const MINUTE = 60 * 1000;

describe('issueHookChallenge', () => {
  it('issues a challenge when nothing is pending', () => {
    const state = createInitialState();
    const result = issueHookChallenge(state, { now: new Date('2026-07-03T10:00:00') });

    assert.equal(result.issued, true);
    assert.equal(result.challenge.status, 'pending');
    assert.equal(state.challenges.length, 1);
  });

  it('returns the existing pending challenge instead of stacking', () => {
    const state = createInitialState();
    const first = issueHookChallenge(state, { now: new Date('2026-07-03T10:00:00') });
    const second = issueHookChallenge(state, { now: new Date('2026-07-03T10:00:30') });

    assert.equal(second.issued, false);
    assert.equal(second.challenge.id, first.challenge.id);
    assert.equal(state.challenges.length, 1);
  });

  it('respects the cooldown after the last challenge resolves', () => {
    const state = createInitialState();
    const cooldownMs = 10 * MINUTE;
    const first = issueHookChallenge(state, { cooldownMs, now: new Date('2026-07-03T10:00:00') });
    completeChallenge(state, first.challenge.id, new Date('2026-07-03T10:01:00'));

    const tooSoon = issueHookChallenge(state, { cooldownMs, now: new Date('2026-07-03T10:05:00') });
    assert.equal(tooSoon.issued, false);
    assert.equal(tooSoon.challenge, null);

    const rested = issueHookChallenge(state, { cooldownMs, now: new Date('2026-07-03T10:11:00') });
    assert.equal(rested.issued, true);
    assert.equal(rested.challenge.status, 'pending');
  });
});

describe('parseTfCommand', () => {
  it('ignores normal prompts', () => {
    assert.equal(parseTfCommand('fix the bug'), null);
    assert.equal(parseTfCommand('/tfoo'), null);
    assert.equal(parseTfCommand('tell me about /tf'), null);
    assert.equal(parseTfCommand(''), null);
  });

  it('parses subcommands and aliases', () => {
    assert.equal(parseTfCommand('/tf').cmd, 'status');
    assert.equal(parseTfCommand('/tf done').cmd, 'done');
    assert.equal(parseTfCommand('/tf d').cmd, 'done');
    assert.equal(parseTfCommand('/tf skip').cmd, 'skip');
    assert.equal(parseTfCommand('/tf s').cmd, 'skip');
    assert.equal(parseTfCommand('/tf stats').cmd, 'stats');
    assert.equal(parseTfCommand('/tf web').cmd, 'web');
    assert.equal(parseTfCommand('/tf x').cmd, 'x');
    assert.equal(parseTfCommand('  /tf done  ').cmd, 'done');
  });

  it('maps unknown subcommands to help', () => {
    assert.equal(parseTfCommand('/tf wat').cmd, 'help');
  });
});

describe('share text', () => {
  const stats = { totalReps: 123, todayDone: 4, todayReps: 40, streak: 7 };

  it('brags about total reps and tags TokenFit', () => {
    const text = buildShareText(stats);
    assert.match(text, /123/);
    assert.match(text, /#TokenFit/);
  });

  it('builds an X intent url with the text embedded', () => {
    const url = shareUrl(stats);
    assert.ok(url.startsWith('https://twitter.com/intent/tweet?text='));
    assert.match(decodeURIComponent(url), /123/);
    assert.match(decodeURIComponent(url), /#TokenFit/);
  });
});

describe('handlePromptSubmit', () => {
  let server;
  let baseUrl;
  const opened = [];
  const openUrl = async (url) => {
    opened.push(url);
  };

  before(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tokenfit-tf-test-'));
    ({ server } = createTokenFitServer({
      dataFile: join(dir, 'tokenfit.json'),
      publicDir: join(process.cwd(), 'public')
    }));
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const stateNow = async () => (await fetch(`${baseUrl}/api/state`)).json();

  it('issues a challenge for a normal prompt via systemMessage', async () => {
    const output = await handlePromptSubmit({ prompt: 'refactor this module' }, { baseUrl, openUrl });

    assert.ok(output.systemMessage);
    assert.equal(output.decision, undefined);
    assert.match(output.systemMessage, /\/tf done/);
  });

  it('reminds about the pending challenge instead of stacking', async () => {
    const output = await handlePromptSubmit({ prompt: 'now add tests' }, { baseUrl, openUrl });

    assert.ok(output.systemMessage);
    assert.equal((await stateNow()).stats.queueCount, 1);
  });

  it('/tf shows status without touching the queue', async () => {
    const output = await handlePromptSubmit({ prompt: '/tf' }, { baseUrl, openUrl });

    assert.equal(output.decision, 'block');
    assert.equal((await stateNow()).stats.queueCount, 1);
  });

  it('/tf done completes the pending challenge', async () => {
    const output = await handlePromptSubmit({ prompt: '/tf done' }, { baseUrl, openUrl });

    assert.equal(output.decision, 'block');
    assert.match(output.reason, /✅/);

    const state = await stateNow();
    assert.equal(state.stats.queueCount, 0);
    assert.equal(state.stats.totalDone, 1);
  });

  it('/tf done with nothing pending says so instead of erroring', async () => {
    const output = await handlePromptSubmit({ prompt: '/tf done' }, { baseUrl, openUrl });

    assert.equal(output.decision, 'block');
    assert.ok(output.reason.length > 0);
    assert.equal((await stateNow()).stats.totalDone, 1);
  });

  it('/tf web opens the dashboard', async () => {
    const output = await handlePromptSubmit({ prompt: '/tf web' }, { baseUrl, openUrl });

    assert.equal(output.decision, 'block');
    assert.equal(opened.at(-1), baseUrl);
  });

  it('/tf x opens a prefilled X compose window', async () => {
    const output = await handlePromptSubmit({ prompt: '/tf x' }, { baseUrl, openUrl });

    assert.equal(output.decision, 'block');
    assert.ok(opened.at(-1).startsWith('https://twitter.com/intent/tweet?text='));
    assert.match(decodeURIComponent(opened.at(-1)), /TokenFit/);
  });

  it('stays silent for normal prompts when the daemon is down', async () => {
    const output = await handlePromptSubmit(
      { prompt: 'hello' },
      { baseUrl: 'http://127.0.0.1:1', openUrl, timeoutMs: 250 }
    );

    assert.equal(output, null);
  });

  it('blocks /tf with advice when the daemon is down', async () => {
    const output = await handlePromptSubmit(
      { prompt: '/tf' },
      { baseUrl: 'http://127.0.0.1:1', openUrl, timeoutMs: 250 }
    );

    assert.equal(output.decision, 'block');
    assert.match(output.reason, /tokenfit start/);
  });
});

describe('issue message includes the steps', () => {
  let server;
  let baseUrl;
  const openUrl = async () => {};

  before(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tokenfit-issue-test-'));
    ({ server } = createTokenFitServer({
      dataFile: join(dir, 'tokenfit.json'),
      publicDir: join(process.cwd(), 'public')
    }));
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('shows numbered steps right when a challenge is issued', async () => {
    const output = await handlePromptSubmit({ prompt: 'do the thing' }, { baseUrl, openUrl });

    assert.ok(output.systemMessage);
    assert.match(output.systemMessage, /1\. /);
    assert.match(output.systemMessage, /2\. /);
    assert.match(output.systemMessage, /\/tf done/);
  });

  it('repeats the steps in the pending reminder too', async () => {
    const output = await handlePromptSubmit({ prompt: 'more work' }, { baseUrl, openUrl });

    assert.ok(output.systemMessage);
    assert.match(output.systemMessage, /⏳/);
    assert.match(output.systemMessage, /1\. /);
    assert.match(output.systemMessage, /2\. /);
    assert.match(output.systemMessage, /\/tf done/);
  });
});

describe('/tf how', () => {
  let server;
  let baseUrl;
  const openUrl = async () => {};

  before(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tokenfit-how-test-'));
    ({ server } = createTokenFitServer({
      dataFile: join(dir, 'tokenfit.json'),
      publicDir: join(process.cwd(), 'public')
    }));
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('parses how and steps aliases', () => {
    assert.equal(parseTfCommand('/tf how').cmd, 'how');
    assert.equal(parseTfCommand('/tf steps').cmd, 'how');
  });

  it('shows numbered steps for the current challenge', async () => {
    await handlePromptSubmit({ prompt: 'gimme work' }, { baseUrl, openUrl });
    const output = await handlePromptSubmit({ prompt: '/tf how' }, { baseUrl, openUrl });

    assert.equal(output.decision, 'block');
    assert.match(output.reason, /1\. /);
    assert.match(output.reason, /2\. /);
    assert.match(output.reason, /3\. /);
  });

  it('shows Japanese steps when lang is ja', async () => {
    const output = await handlePromptSubmit({ prompt: '/tf how' }, { baseUrl, openUrl, lang: 'ja' });

    assert.equal(output.decision, 'block');
    assert.match(output.reason, /1\. /);
    assert.match(output.reason, /[ぁ-んァ-ヶー一-龯]/);
  });

  it('says nothing pending when idle', async () => {
    await handlePromptSubmit({ prompt: '/tf skip' }, { baseUrl, openUrl });
    const output = await handlePromptSubmit({ prompt: '/tf how' }, { baseUrl, openUrl });

    assert.equal(output.decision, 'block');
    assert.doesNotMatch(output.reason, /1\. /);
  });
});

describe('http api extensions', () => {
  let server;
  let baseUrl;

  before(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tokenfit-tf-http-test-'));
    ({ server } = createTokenFitServer({
      dataFile: join(dir, 'tokenfit.json'),
      publicDir: join(process.cwd(), 'public')
    }));
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('POST /api/hook reports issued=false while a challenge is pending', async () => {
    const first = await (await fetch(`${baseUrl}/api/hook`, { method: 'POST' })).json();
    const second = await (await fetch(`${baseUrl}/api/hook`, { method: 'POST' })).json();

    assert.equal(first.issued, true);
    assert.equal(second.issued, false);
    assert.equal(second.challenge.id, first.challenge.id);
    assert.equal(second.state.stats.queueCount, 1);
  });

  it('POST /api/done without an id completes the current challenge', async () => {
    const response = await fetch(`${baseUrl}/api/done`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.state.stats.totalDone, 1);
    assert.equal(body.state.stats.queueCount, 0);
  });
});
