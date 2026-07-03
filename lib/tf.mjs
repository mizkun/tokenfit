import { spawn } from 'node:child_process';

const DEFAULT_BASE_URL = process.env.TOKENFIT_URL || 'http://127.0.0.1:4317';
const DEFAULT_TIMEOUT_MS = Number(process.env.TOKENFIT_HOOK_TIMEOUT_MS || 900);

const SUBCOMMANDS = new Map([
  ['', 'status'],
  ['d', 'done'],
  ['done', 'done'],
  ['s', 'skip'],
  ['skip', 'skip'],
  ['how', 'how'],
  ['steps', 'how'],
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
      cue: challenge.ja.cue || challenge.cue,
      steps: challenge.ja.steps || challenge.steps || []
    };
  }
  return {
    name: challenge.name,
    target: challenge.target,
    cue: challenge.cue,
    steps: challenge.steps || []
  };
}

function howText(challenge, lang) {
  const text = localized(challenge, lang);
  return [
    `📖 ${challengeLine(challenge, lang)} — ${text.cue}`,
    ...text.steps.map((step, index) => `${index + 1}. ${step}`)
  ].join('\n');
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

const FLAVOR = {
  en: {
    done: [
      'Absolute unit.',
      'gains.exe exited with code 0.',
      'Somewhere, a personal trainer felt a disturbance.',
      'Muscle compiled with 0 warnings.',
      'HR would be proud. Legal is concerned.',
      'You vs. entropy: 1–0.'
    ],
    skip: [
      'The algorithm remembers.',
      'Your biceps have filed a complaint.',
      'Noted. In the permanent record.',
      'Rest day, apparently.'
    ]
  },
  ja: {
    done: [
      '大変な逸材。',
      'gains.exe は正常終了しました（コード 0）。',
      'どこかのパーソナルトレーナーが何かを感じ取った。',
      '筋肉のコンパイルに成功（warning 0 件）。',
      'あなた対エントロピー、1-0。'
    ],
    skip: [
      'アルゴリズムは覚えています。',
      '上腕二頭筋から苦情が届いています。',
      '永久記録に記載しました。',
      '今日は休養日ということで。'
    ]
  }
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const COPY = {
  en: {
    issue: (challenge, lang) => {
      const text = localized(challenge, lang);
      return [
        `🏋️ ${challengeLine(challenge, lang)} (${text.target})`,
        ...text.steps.map((step, index) => `${index + 1}. ${step}`),
        '→ /tf done when finished · /tf skip to bail'
      ].join('\n');
    },
    remind: (challenge, lang) => {
      const text = localized(challenge, lang);
      return [
        `⏳ Still owed: ${challengeLine(challenge, lang)} (${text.target})`,
        ...text.steps.map((step, index) => `${index + 1}. ${step}`),
        '→ /tf done when finished · /tf skip to bail'
      ].join('\n');
    },
    done: (challenge, stats, lang) => `✅ ${challengeLine(challenge, lang)} done! ${statsLine(stats, lang)}\n${pick(FLAVOR.en.done)}`,
    nothingToDo: '🧘 Nothing pending. Send a prompt to get a challenge.',
    skipped: (challenge, lang) => `😴 Skipped ${localized(challenge, lang).name}. ${pick(FLAVOR.en.skip)}`,
    nothingToSkip: '🧘 Nothing pending to skip. Bold of you to try, though.',
    current: (challenge, lang) => `🏋️ Current: ${challengeLine(challenge, lang)} → /tf done`,
    idle: '🧘 Nothing pending. Inner peace (temporary).',
    stats: (stats) => [
      '📊 TokenFit Gains Report',
      `Today: ${stats.todayDone} sets / ${stats.todayReps} reps`,
      `Streak: 🔥 ${stats.streak} days`,
      `All time: ${stats.totalDone} sets / ${stats.totalReps} reps (skipped ${stats.skipped} — the algorithm remembers)`,
      'Dashboard: /tf web · Brag: /tf x'
    ].join('\n'),
    web: (stats, lang) => `🌱 Opened the TokenFit dashboard. ${statsLine(stats, lang)}`,
    x: '🐦 Opened X with your brag pre-filled. Just hit Post. Engagement not guaranteed.',
    down: '🛌 TokenFit daemon is not running. Even the daemon skipped leg day. Start it with: tokenfit start',
    help: 'TokenFit: /tf [done|skip|how|stats|web|x]'
  },
  ja: {
    issue: (challenge, lang) => {
      const text = localized(challenge, lang);
      return [
        `🏋️ ${challengeLine(challenge, lang)}（${text.target}）`,
        ...text.steps.map((step, index) => `${index + 1}. ${step}`),
        '→ 終わったら /tf done · 無理なら /tf skip'
      ].join('\n');
    },
    remind: (challenge, lang) => {
      const text = localized(challenge, lang);
      return [
        `⏳ 未消化: ${challengeLine(challenge, lang)}（${text.target}）`,
        ...text.steps.map((step, index) => `${index + 1}. ${step}`),
        '→ 終わったら /tf done · 無理なら /tf skip'
      ].join('\n');
    },
    done: (challenge, stats, lang) => `✅ ${challengeLine(challenge, lang)} 完了！${statsLine(stats, lang)}\n${pick(FLAVOR.ja.done)}`,
    nothingToDo: '🧘 いま何も出ていない。プロンプトを送るとお題が来る。',
    skipped: (challenge, lang) => `😴 ${localized(challenge, lang).name}をスキップ。${pick(FLAVOR.ja.skip)}`,
    nothingToSkip: '🧘 スキップするものがない。その意気やよし。',
    current: (challenge, lang) => `🏋️ 今のお題: ${challengeLine(challenge, lang)} → /tf done`,
    idle: '🧘 いま何も出ていない。心の平穏（一時的）。',
    stats: (stats) => [
      '📊 TokenFit ゲインズレポート',
      `今日: ${stats.todayDone} セット / ${stats.todayReps} reps`,
      `連続: 🔥 ${stats.streak} 日`,
      `累計: ${stats.totalDone} セット / ${stats.totalReps} reps（スキップ ${stats.skipped} — 記録済み）`,
      'ダッシュボード: /tf web · 自慢: /tf x'
    ].join('\n'),
    web: (stats, lang) => `🌱 ダッシュボードを開いた。${statsLine(stats, lang)}`,
    x: '🐦 ポスト文面入りで X を開いた。あとは投稿するだけ。バズは保証外。',
    down: '🛌 TokenFit デーモンが起動していない。デーモンすらレッグデーをサボった。起動: tokenfit start',
    help: 'TokenFit: /tf [done|skip|how|stats|web|x]'
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
      case 'how': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        if (!state.current) {
          return block(copy.idle);
        }
        return block(howText(state.current, lang));
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
