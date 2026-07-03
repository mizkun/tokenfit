import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
  addChallenge,
  completeChallenge,
  createInitialState,
  createTokenFitServer,
  skipChallenge,
  toPublicState
} from '../server.mjs';

describe('state transitions', () => {
  it('queues a challenge and marks it done', () => {
    const state = createInitialState();
    const challenge = addChallenge(state, { now: new Date('2026-07-03T00:00:00') });

    assert.equal(toPublicState(state).stats.queueCount, 1);
    assert.equal(completeChallenge(state, challenge.id, new Date('2026-07-03T00:01:00')).id, challenge.id);

    const publicState = toPublicState(state, new Date('2026-07-03T00:02:00'));
    assert.equal(publicState.stats.totalDone, 1);
    assert.equal(publicState.stats.todayDone, 1);
    assert.equal(publicState.stats.queueCount, 0);
    assert.equal(publicState.today[0].id, challenge.id);
  });

  it('skips only pending challenges', () => {
    const state = createInitialState();
    const challenge = addChallenge(state);

    assert.equal(skipChallenge(state, challenge.id)?.status, 'skipped');
    assert.equal(completeChallenge(state, challenge.id), null);
    assert.equal(toPublicState(state).stats.skipped, 1);
  });
});

describe('http api', () => {
  let server;
  let baseUrl;

  before(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tokenfit-test-'));
    ({ server } = createTokenFitServer({
      dataFile: join(dir, 'tokenfit.json'),
      publicDir: join(process.cwd(), 'public')
    }));
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('accepts hook events and completes the current challenge', async () => {
    const hookResponse = await fetch(`${baseUrl}/api/hook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hook_event_name: 'UserPromptSubmit' })
    });
    assert.equal(hookResponse.status, 201);
    const hookBody = await hookResponse.json();
    const currentId = hookBody.state.current.id;

    const doneResponse = await fetch(`${baseUrl}/api/done`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: currentId })
    });
    assert.equal(doneResponse.status, 200);
    const doneBody = await doneResponse.json();

    assert.equal(doneBody.state.stats.totalDone, 1);
    assert.equal(doneBody.state.current, null);
  });
});
