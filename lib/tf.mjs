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

export function buildShareText(stats, lang = 'en') {
  const brag = lang === 'ja'
    ? `AIが考えている間にTokenFitで${stats.totalReps} repsやった。`
    : `I just did ${stats.totalReps} TokenFit reps while my AI was thinking.`;
  return [brag, 'Your AI thinks. You rep.', '#TokenFit'].join('\n');
}

export function shareUrl(stats, lang = 'en') {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText(stats, lang))}`;
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

function localized(challenge, lang) {
  if (lang === 'ja' && challenge.ja) {
    return {
      name: challenge.ja.name || challenge.name,
      target: challenge.ja.target || challenge.target,
      cue: challenge.ja.cue || challenge.cue
    };
  }
  return { name: challenge.name, target: challenge.target, cue: challenge.cue };
}

function challengeLine(challenge, lang) {
  const text = localized(challenge, lang);
  const unit = lang === 'ja'
    ? (challenge.unit === 'seconds' ? '秒' : '回')
    : ` ${challenge.unit}`;
  return `${text.name} — ${challenge.amount}${unit}`;
}

function statsLine(stats, lang) {
  if (lang === 'ja') {
    return `今日 ${stats.todayDone} セット · 🔥 ${stats.streak} 日連続 · 累計 ${stats.totalReps} reps`;
  }
  return `Today: ${stats.todayDone} sets · 🔥 ${stats.streak}-day streak · ${stats.totalReps} total reps`;
}

const COPY = {
  en: {
    issue: (challenge, lang) => {
      const text = localized(challenge, lang);
      return `🏋️ ${challengeLine(challenge, lang)} (${text.target}) — ${text.cue} → /tf done when finished`;
    },
    remind: (challenge, lang) => `⏳ Still owed: ${challengeLine(challenge, lang)} → /tf done (or /tf skip)`,
    done: (challenge, stats, lang) => `✅ ${challengeLine(challenge, lang)} done! ${statsLine(stats, lang)}`,
    nothingToDo: '🧘 Nothing pending. Send a prompt to get a challenge.',
    skipped: (challenge, lang) => `😴 Skipped ${localized(challenge, lang).name}. It happens.`,
    nothingToSkip: '🧘 Nothing pending to skip.',
    current: (challenge, lang) => `🏋️ Current: ${challengeLine(challenge, lang)} → /tf done`,
    idle: '🧘 Nothing pending.',
    stats: (stats) => [
      '📊 TokenFit',
      `Today: ${stats.todayDone} sets / ${stats.todayReps} reps`,
      `Streak: 🔥 ${stats.streak} days`,
      `All time: ${stats.totalDone} sets / ${stats.totalReps} reps (skipped ${stats.skipped})`,
      'Dashboard: /tf web · Brag: /tf x'
    ].join('\n'),
    web: (stats, lang) => `🌱 Opened the TokenFit dashboard. ${statsLine(stats, lang)}`,
    x: '🐦 Opened X with your brag pre-filled. Just hit Post.',
    down: '🛌 TokenFit daemon is not running. Start it with: tokenfit start',
    help: 'TokenFit: /tf [done|skip|stats|web|x]'
  },
  ja: {
    issue: (challenge, lang) => {
      const text = localized(challenge, lang);
      return `🏋️ ${challengeLine(challenge, lang)}（${text.target}）— ${text.cue} → 終わったら /tf done`;
    },
    remind: (challenge, lang) => `⏳ 未消化: ${challengeLine(challenge, lang)} → /tf done か /tf skip`,
    done: (challenge, stats, lang) => `✅ ${challengeLine(challenge, lang)} 完了！${statsLine(stats, lang)}`,
    nothingToDo: '🧘 いま何も出ていない。プロンプトを送るとお題が来る。',
    skipped: (challenge, lang) => `😴 ${localized(challenge, lang).name}をスキップ。そういう日もある。`,
    nothingToSkip: '🧘 スキップするものがない。',
    current: (challenge, lang) => `🏋️ 今のお題: ${challengeLine(challenge, lang)} → /tf done`,
    idle: '🧘 いま何も出ていない。',
    stats: (stats) => [
      '📊 TokenFit',
      `今日: ${stats.todayDone} セット / ${stats.todayReps} reps`,
      `連続: 🔥 ${stats.streak} 日`,
      `累計: ${stats.totalDone} セット / ${stats.totalReps} reps（スキップ ${stats.skipped}）`,
      'ダッシュボード: /tf web · 自慢: /tf x'
    ].join('\n'),
    web: (stats, lang) => `🌱 ダッシュボードを開いた。${statsLine(stats, lang)}`,
    x: '🐦 ポスト文面入りで X を開いた。あとは投稿するだけ。',
    down: '🛌 TokenFit デーモンが起動していない。起動: tokenfit start',
    help: 'TokenFit: /tf [done|skip|stats|web|x]'
  }
};

export async function handlePromptSubmit(input, options = {}) {
  const {
    baseUrl = DEFAULT_BASE_URL,
    openUrl = openInBrowser,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    lang = process.env.TOKENFIT_LANG === 'ja' ? 'ja' : 'en'
  } = options;
  const copy = COPY[lang] || COPY.en;

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
      return { systemMessage: copy.remind(body.challenge, lang) };
    }
    return { systemMessage: copy.issue(body.challenge, lang) };
  }

  const block = (reason) => ({ decision: 'block', reason });

  try {
    switch (command.cmd) {
      case 'done': {
        const body = await api(baseUrl, '/api/done', { method: 'POST', body: {}, timeoutMs });
        if (!body?.challenge) {
          return block(copy.nothingToDo);
        }
        return block(copy.done(body.challenge, body.state.stats, lang));
      }
      case 'skip': {
        const body = await api(baseUrl, '/api/skip', { method: 'POST', body: {}, timeoutMs });
        if (!body?.challenge) {
          return block(copy.nothingToSkip);
        }
        return block(copy.skipped(body.challenge, lang));
      }
      case 'status': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        const current = state.current ? copy.current(state.current, lang) : copy.idle;
        return block(`${current}\n${statsLine(state.stats, lang)}`);
      }
      case 'stats': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        return block(copy.stats(state.stats));
      }
      case 'web': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        await openUrl(baseUrl);
        return block(copy.web(state.stats, lang));
      }
      case 'x': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        await openUrl(shareUrl(state.stats, lang));
        return block(copy.x);
      }
      default:
        return block(copy.help);
    }
  } catch {
    return block(copy.down);
  }
}
