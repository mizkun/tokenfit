import { spawn } from 'node:child_process';

const DEFAULT_BASE_URL = process.env.TOKENFIT_URL || 'http://127.0.0.1:4317';
const DEFAULT_TIMEOUT_MS = Number(process.env.TOKENFIT_HOOK_TIMEOUT_MS || 900);

const SUBCOMMANDS = new Map([
  ['', 'status'],
  ['d', 'done'],
  ['done', 'done'],
  ['s', 'skip'],
  ['skip', 'skip'],
  ['stats', 'stats'],
  ['web', 'web'],
  ['x', 'x']
]);

export function parseTfCommand(prompt = '') {
  const trimmed = String(prompt).trim();
  if (trimmed !== '/tf' && !trimmed.startsWith('/tf ')) {
    return null;
  }
  const [word = '', ...args] = trimmed.slice('/tf'.length).trim().split(/\s+/).filter(Boolean);
  return { cmd: SUBCOMMANDS.get(word) || 'help', args };
}

export function buildShareText(stats) {
  return [
    `I just did ${stats.totalReps} TokenFit reps while my AI was thinking.`,
    'Your AI thinks. You rep.',
    '#TokenFit'
  ].join('\n');
}

export function shareUrl(stats) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText(stats))}`;
}

export function openInBrowser(url) {
  return new Promise((resolve) => {
    const [command, args] =
      process.platform === 'darwin' ? ['open', [url]]
      : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
      : ['xdg-open', [url]];
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.on('error', () => resolve(false));
    child.on('spawn', () => {
      child.unref();
      resolve(true);
    });
  });
}

async function api(baseUrl, path, { method = 'GET', body, timeoutMs } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal
    });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function challengeLine(challenge) {
  return `${challenge.name} — ${challenge.amount} ${challenge.unit}`;
}

function statsLine(stats) {
  return `Today: ${stats.todayDone} sets · 🔥 ${stats.streak}-day streak · ${stats.totalReps} total reps`;
}

export async function handlePromptSubmit(input, options = {}) {
  const {
    baseUrl = DEFAULT_BASE_URL,
    openUrl = openInBrowser,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = options;

  const command = parseTfCommand(input?.prompt);

  if (!command) {
    let body;
    try {
      body = await api(baseUrl, '/api/hook', {
        method: 'POST',
        body: { source: 'claude-code', payload: input },
        timeoutMs
      });
    } catch {
      return null;
    }
    if (!body?.challenge) {
      return null;
    }
    if (body.issued === false) {
      return {
        systemMessage: `⏳ Still owed: ${challengeLine(body.challenge)} → /tf done (or /tf skip)`
      };
    }
    return {
      systemMessage: `🏋️ ${challengeLine(body.challenge)} (${body.challenge.target}) — ${body.challenge.cue} → /tf done when finished`
    };
  }

  const block = (reason) => ({ decision: 'block', reason });

  try {
    switch (command.cmd) {
      case 'done': {
        const body = await api(baseUrl, '/api/done', { method: 'POST', body: {}, timeoutMs });
        if (!body?.challenge) {
          return block('🧘 Nothing pending. Send a prompt to get a challenge.');
        }
        return block(`✅ ${challengeLine(body.challenge)} done! ${statsLine(body.state.stats)}`);
      }
      case 'skip': {
        const body = await api(baseUrl, '/api/skip', { method: 'POST', body: {}, timeoutMs });
        if (!body?.challenge) {
          return block('🧘 Nothing pending to skip.');
        }
        return block(`😴 Skipped ${body.challenge.name}. It happens.`);
      }
      case 'status': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        const current = state.current
          ? `🏋️ Current: ${challengeLine(state.current)} → /tf done`
          : '🧘 Nothing pending.';
        return block(`${current}\n${statsLine(state.stats)}`);
      }
      case 'stats': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        const stats = state.stats;
        return block([
          '📊 TokenFit',
          `Today: ${stats.todayDone} sets / ${stats.todayReps} reps`,
          `Streak: 🔥 ${stats.streak} days`,
          `All time: ${stats.totalDone} sets / ${stats.totalReps} reps (skipped ${stats.skipped})`,
          'Dashboard: /tf web · Brag: /tf x'
        ].join('\n'));
      }
      case 'web': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        await openUrl(baseUrl);
        return block(`🌱 Opened the TokenFit dashboard. ${statsLine(state.stats)}`);
      }
      case 'x': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        await openUrl(shareUrl(state.stats));
        return block('🐦 Opened X with your brag pre-filled. Just hit Post.');
      }
      default:
        return block('TokenFit: /tf [done|skip|stats|web|x]');
    }
  } catch {
    return block('🛌 TokenFit daemon is not running. Start it with: tokenfit start');
  }
}
