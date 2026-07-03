import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PORT = Number(process.env.TOKENFIT_PORT || process.env.PORT || 4317);
const DEFAULT_DATA_FILE = process.env.TOKENFIT_DATA_FILE || join(__dirname, 'data', 'tokenfit.json');
const DEFAULT_PUBLIC_DIR = join(__dirname, 'public');

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon']
]);

export const EXERCISES = [
  {
    id: 'desk-pushups',
    name: 'Desk push-ups',
    amount: 8,
    unit: 'reps',
    target: 'Chest and triceps',
    cue: 'Hands on desk, body straight.',
    steps: [
      'Place both hands on a sturdy desk.',
      'Step back until your body forms a straight line.',
      'Lower your chest toward the desk, then press back up.'
    ]
  },
  {
    id: 'chair-squats',
    name: 'Chair squats',
    amount: 10,
    unit: 'reps',
    target: 'Legs',
    cue: 'Tap the chair, stand tall.',
    steps: [
      'Stand in front of your chair with feet shoulder-width apart.',
      'Push hips back and lightly tap the chair.',
      'Drive through your feet and stand tall.'
    ]
  },
  {
    id: 'calf-raises',
    name: 'Calf raises',
    amount: 15,
    unit: 'reps',
    target: 'Calves',
    cue: 'Rise, pause, lower slow.',
    steps: [
      'Stand tall and hold the desk if needed.',
      'Rise onto the balls of your feet.',
      'Pause briefly, then lower with control.'
    ]
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder rolls',
    amount: 12,
    unit: 'reps',
    target: 'Shoulders',
    cue: 'Big circles, unclench jaw.',
    steps: [
      'Sit or stand tall.',
      'Roll both shoulders up, back, and down.',
      'Keep the motion slow and relaxed.'
    ]
  },
  {
    id: 'standing-twists',
    name: 'Standing twists',
    amount: 12,
    unit: 'reps',
    target: 'Core',
    cue: 'Rotate gently side to side.',
    steps: [
      'Stand with soft knees and hands near your ribs.',
      'Rotate your torso gently to one side.',
      'Return to center and rotate to the other side.'
    ]
  },
  {
    id: 'wall-sit',
    name: 'Wall sit',
    amount: 20,
    unit: 'seconds',
    target: 'Quads',
    cue: 'Back flat, knees comfortable.',
    steps: [
      'Lean your back against a wall.',
      'Slide down only as far as feels comfortable.',
      'Hold, breathe, then stand back up slowly.'
    ]
  },
  {
    id: 'plank',
    name: 'Desk plank',
    amount: 20,
    unit: 'seconds',
    target: 'Core',
    cue: 'Forearms on desk, ribs down.',
    steps: [
      'Place forearms on a sturdy desk.',
      'Step back until your body forms a long line.',
      'Brace lightly and hold without shrugging.'
    ]
  },
  {
    id: 'wrist-resets',
    name: 'Wrist resets',
    amount: 10,
    unit: 'reps',
    target: 'Wrists',
    cue: 'Slow flex, slow extend.',
    steps: [
      'Hold both arms forward.',
      'Flex wrists down, then extend them up.',
      'Move slowly and stop if anything feels sharp.'
    ]
  },
  {
    id: 'glute-squeezes',
    name: 'Glute squeezes',
    amount: 12,
    unit: 'reps',
    target: 'Glutes',
    cue: 'Squeeze, hold, release.',
    steps: [
      'Sit or stand with a tall posture.',
      'Squeeze your glutes for one second.',
      'Release fully before the next rep.'
    ]
  },
  {
    id: 'marches',
    name: 'Standing marches',
    amount: 20,
    unit: 'reps',
    target: 'Hips',
    cue: 'Lift knees, stay relaxed.',
    steps: [
      'Stand tall beside your desk.',
      'Lift one knee, then lower it.',
      'Alternate sides at an easy pace.'
    ]
  }
];

export function createInitialState() {
  return {
    version: 1,
    challenges: []
  };
}

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sameLocalDay(a, b = new Date()) {
  return dateKey(new Date(a)) === dateKey(b);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function repCredit(challenge) {
  return challenge.unit === 'seconds' ? Math.ceil(challenge.amount / 2) : challenge.amount;
}

function pickExercise(state) {
  const recentIds = state.challenges.slice(-3).map((challenge) => challenge.exerciseId);
  const candidates = EXERCISES.filter((exercise) => !recentIds.includes(exercise.id));
  const pool = candidates.length > 0 ? candidates : EXERCISES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function addChallenge(state, { source = 'hook', payload = null, now = new Date() } = {}) {
  const exercise = pickExercise(state);
  const challenge = {
    id: makeId(),
    exerciseId: exercise.id,
    name: exercise.name,
    amount: exercise.amount,
    unit: exercise.unit,
    target: exercise.target,
    cue: exercise.cue,
    steps: exercise.steps,
    status: 'pending',
    source,
    createdAt: now.toISOString(),
    completedAt: null,
    skippedAt: null,
    payloadType: payload && typeof payload === 'object' ? payload.hook_event_name || payload.event || null : null
  };

  state.challenges.push(challenge);
  if (state.challenges.length > 500) {
    state.challenges = state.challenges.slice(-500);
  }
  return challenge;
}

export const DEFAULT_COOLDOWN_MS = Number(process.env.TOKENFIT_COOLDOWN_MS || 10 * 60 * 1000);

export function issueHookChallenge(state, {
  source = 'hook',
  payload = null,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  now = new Date()
} = {}) {
  const pending = state.challenges.find((challenge) => challenge.status === 'pending');
  if (pending) {
    return { challenge: pending, issued: false };
  }

  const last = state.challenges.at(-1);
  if (last && now - new Date(last.createdAt) < cooldownMs) {
    return { challenge: null, issued: false };
  }

  return { challenge: addChallenge(state, { source, payload, now }), issued: true };
}

export function completeChallenge(state, id, now = new Date()) {
  const challenge = state.challenges.find((item) => item.status === 'pending' && (id == null || item.id === id));
  if (!challenge) {
    return null;
  }
  challenge.status = 'done';
  challenge.completedAt = now.toISOString();
  return challenge;
}

export function skipChallenge(state, id, now = new Date()) {
  const challenge = state.challenges.find((item) => item.status === 'pending' && (id == null || item.id === id));
  if (!challenge) {
    return null;
  }
  challenge.status = 'skipped';
  challenge.skippedAt = now.toISOString();
  return challenge;
}

export function toPublicState(state, now = new Date()) {
  const pending = state.challenges.filter((challenge) => challenge.status === 'pending');
  const done = state.challenges.filter((challenge) => challenge.status === 'done');
  const skipped = state.challenges.filter((challenge) => challenge.status === 'skipped');
  const doneToday = done.filter((challenge) => sameLocalDay(challenge.completedAt, now));
  const doneByDate = done.reduce((counts, challenge) => {
    const key = dateKey(new Date(challenge.completedAt));
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const activeDates = new Set(done.map((challenge) => dateKey(new Date(challenge.completedAt))));
  let streak = 0;
  let cursor = new Date(now);

  while (activeDates.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return {
    current: pending[0] || null,
    queue: pending,
    today: doneToday.slice().reverse(),
    recent: state.challenges
      .filter((challenge) => challenge.status !== 'pending')
      .slice(-12)
      .reverse(),
    stats: {
      totalDone: done.length,
      totalReps: done.reduce((sum, challenge) => sum + repCredit(challenge), 0),
      todayDone: doneToday.length,
      todayReps: doneToday.reduce((sum, challenge) => sum + repCredit(challenge), 0),
      skipped: skipped.length,
      queueCount: pending.length,
      streak,
      doneByDate
    }
  };
}

async function readState(dataFile) {
  try {
    const raw = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.challenges)) {
      return createInitialState();
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createInitialState();
    }
    throw error;
  }
}

async function writeState(dataFile, state) {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(JSON.stringify(body));
}

function sendNotFound(response) {
  sendJson(response, 404, { error: 'Not found' });
}

function serveStatic(publicDir, request, response) {
  const url = new URL(request.url, 'http://tokenfit.local');
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');

  if (relativePath.includes('..')) {
    sendNotFound(response);
    return;
  }

  const filePath = join(publicDir, relativePath);
  if (!existsSync(filePath)) {
    sendNotFound(response);
    return;
  }

  response.writeHead(200, {
    'content-type': MIME_TYPES.get(extname(filePath)) || 'application/octet-stream',
    'cache-control': 'no-cache'
  });
  createReadStream(filePath).pipe(response);
}

export function createTokenFitServer({
  dataFile = DEFAULT_DATA_FILE,
  publicDir = DEFAULT_PUBLIC_DIR,
  cooldownMs = DEFAULT_COOLDOWN_MS
} = {}) {
  const clients = new Set();
  let writeQueue = Promise.resolve();

  const persist = (state) => {
    writeQueue = writeQueue.then(() => writeState(dataFile, state));
    return writeQueue;
  };

  const broadcast = (state) => {
    const body = `event: state\ndata: ${JSON.stringify(toPublicState(state))}\n\n`;
    for (const client of clients) {
      client.write(body);
    }
  };

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);

      if (request.method === 'GET' && url.pathname === '/api/state') {
        const state = await readState(dataFile);
        sendJson(response, 200, toPublicState(state));
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/events') {
        response.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive'
        });
        clients.add(response);
        const state = await readState(dataFile);
        response.write(`event: state\ndata: ${JSON.stringify(toPublicState(state))}\n\n`);
        request.on('close', () => clients.delete(response));
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/hook') {
        const payload = await readJsonBody(request);
        const state = await readState(dataFile);
        const { challenge, issued } = issueHookChallenge(state, { source: 'claude-code', payload, cooldownMs });
        if (issued) {
          await persist(state);
          broadcast(state);
        }
        sendJson(response, issued ? 201 : 200, { ok: true, issued, challenge, state: toPublicState(state) });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/challenge') {
        const state = await readState(dataFile);
        const challenge = addChallenge(state, { source: 'manual' });
        await persist(state);
        broadcast(state);
        sendJson(response, 201, { ok: true, challenge, state: toPublicState(state) });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/done') {
        const body = await readJsonBody(request);
        const state = await readState(dataFile);
        const challenge = completeChallenge(state, body?.id);
        if (!challenge) {
          sendJson(response, 404, { error: 'No pending challenge found for that id.' });
          return;
        }
        await persist(state);
        broadcast(state);
        sendJson(response, 200, { ok: true, challenge, state: toPublicState(state) });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/skip') {
        const body = await readJsonBody(request);
        const state = await readState(dataFile);
        const challenge = skipChallenge(state, body?.id);
        if (!challenge) {
          sendJson(response, 404, { error: 'No pending challenge found for that id.' });
          return;
        }
        await persist(state);
        broadcast(state);
        sendJson(response, 200, { ok: true, challenge, state: toPublicState(state) });
        return;
      }

      if (request.method === 'GET') {
        serveStatic(publicDir, request, response);
        return;
      }

      sendNotFound(response);
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
  });

  return { server };
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const { server } = createTokenFitServer();
  server.listen(DEFAULT_PORT, '127.0.0.1', () => {
    console.log(`TokenFit is running at http://127.0.0.1:${DEFAULT_PORT}`);
    console.log(`Hook endpoint: http://127.0.0.1:${DEFAULT_PORT}/api/hook`);
  });
}
