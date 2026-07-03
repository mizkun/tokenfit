import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { EXERCISES, addChallenge, createInitialState, createTokenFitServer } from '../server.mjs';
import { handlePromptSubmit } from '../lib/tf.mjs';

const JAPANESE = /[ぁ-んァ-ヶー一-龯]/;

describe('exercise catalog', () => {
  it('has at least 30 exercises with unique ids', () => {
    assert.ok(EXERCISES.length >= 30, `only ${EXERCISES.length} exercises`);
    assert.equal(new Set(EXERCISES.map((exercise) => exercise.id)).size, EXERCISES.length);
  });

  it('every exercise is bilingual (en + ja) with full copy', () => {
    for (const exercise of EXERCISES) {
      for (const locale of ['en', 'ja']) {
        const copy = exercise[locale];
        assert.ok(copy, `${exercise.id} missing ${locale}`);
        assert.ok(copy.name?.length > 0, `${exercise.id} ${locale} name`);
        assert.ok(copy.target?.length > 0, `${exercise.id} ${locale} target`);
        assert.ok(copy.cue?.length > 0, `${exercise.id} ${locale} cue`);
        assert.ok(Array.isArray(copy.steps) && copy.steps.length >= 2, `${exercise.id} ${locale} steps`);
      }
      assert.match(exercise.ja.name, JAPANESE, `${exercise.id} ja name is not Japanese`);
    }
  });

  it('every exercise fits in about a minute', () => {
    for (const exercise of EXERCISES) {
      assert.ok(['reps', 'seconds'].includes(exercise.unit), `${exercise.id} unit`);
      assert.ok(exercise.amount > 0, `${exercise.id} amount`);
      if (exercise.unit === 'seconds') {
        assert.ok(exercise.amount <= 60, `${exercise.id}: ${exercise.amount}s is over a minute`);
      } else {
        assert.ok(exercise.amount <= 20, `${exercise.id}: ${exercise.amount} reps is too many for a minute`);
      }
    }
  });

  it('never repeats any of the previous 8 exercises', () => {
    const state = createInitialState();
    const picked = [];
    for (let index = 0; index < 60; index += 1) {
      const challenge = addChallenge(state);
      const recent = picked.slice(-8);
      assert.ok(!recent.includes(challenge.exerciseId), `repeat within 8: ${challenge.exerciseId}`);
      picked.push(challenge.exerciseId);
    }
  });

  it('challenges carry the Japanese copy', () => {
    const state = createInitialState();
    const challenge = addChallenge(state);
    assert.ok(challenge.ja, 'challenge.ja missing');
    assert.match(challenge.ja.name, JAPANESE);
    assert.ok(challenge.ja.steps.length >= 2);
  });
});

describe('japanese terminal messages', () => {
  let server;
  let baseUrl;
  const openUrl = async () => {};

  before(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tokenfit-ja-test-'));
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

  it('issues challenges in Japanese when lang is ja', async () => {
    const output = await handlePromptSubmit({ prompt: 'implement the thing' }, { baseUrl, openUrl, lang: 'ja' });
    assert.ok(output.systemMessage);
    assert.match(output.systemMessage, JAPANESE);
    assert.match(output.systemMessage, /\/tf done/);
  });

  it('confirms completion in Japanese when lang is ja', async () => {
    const output = await handlePromptSubmit({ prompt: '/tf done' }, { baseUrl, openUrl, lang: 'ja' });
    assert.equal(output.decision, 'block');
    assert.match(output.reason, /✅/);
    assert.match(output.reason, JAPANESE);
  });

  it('keeps English as the default', async () => {
    const output = await handlePromptSubmit({ prompt: '/tf' }, { baseUrl, openUrl });
    assert.equal(output.decision, 'block');
    assert.doesNotMatch(output.reason, JAPANESE);
  });
});
