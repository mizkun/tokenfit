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
  ['x', 'x'],
  ['on', 'on'],
  ['off', 'off'],
  ['lang', 'lang']
]);

export function parseTfCommand(prompt = '') {
  const trimmed = String(prompt).trim();
  if (trimmed !== '/tf' && !trimmed.startsWith('/tf ')) {
    return null;
  }
  const [word = '', ...args] = trimmed.slice('/tf'.length).trim().split(/\s+/).filter(Boolean);
  if (word === 'ja' || word === 'en') {
    return { cmd: 'lang', args: [word] };
  }
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
    off: '🛑 TokenFit paused. The couch won this round. → /tf on to resume.',
    on: '🏋️ TokenFit is back. Rest day is over.',
    pausedNote: '🛑 Paused — no exercises until /tf on.',
    langUsage: 'Usage: /tf lang [en|ja] (or just /tf ja, /tf en)',
    stale: '🤨 The daemon ignored that — probably an older version. Restart it with: tokenfit start',
    down: '🛌 TokenFit daemon is not running. Even the daemon skipped leg day. Start it with: tokenfit start',
    help: 'TokenFit: /tf [done|skip|how|stats|web|x|on|off|lang]'
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
    off: '🛑 出題を停止した。今回はソファの勝ち。再開は /tf on',
    on: '🏋️ TokenFit 再開。休養日は終わり。',
    pausedNote: '🛑 出題停止中 — 再開は /tf on',
    langUsage: '使い方: /tf lang [en|ja]（/tf ja・/tf en でも可）',
    stale: '🤨 デーモンが反応しない — 古いバージョンかも。再起動して: tokenfit start',
    down: '🛌 TokenFit デーモンが起動していない。デーモンすらレッグデーをサボった。起動: tokenfit start',
    help: 'TokenFit: /tf [done|skip|how|stats|web|x|on|off|lang]'
  }
};

export async function handlePromptSubmit(input, options = {}) {
  const {
    baseUrl = DEFAULT_BASE_URL,
    openUrl = openInBrowser,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    lang: optLang
  } = options;
  const envLang = process.env.TOKENFIT_LANG === 'ja' ? 'ja' : 'en';
  const langFor = (state) => {
    if (optLang) {
      return optLang;
    }
    const stored = state?.settings?.lang;
    return stored === 'ja' || stored === 'en' ? stored : envLang;
  };
  const fallbackLang = optLang || envLang;

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
    const lang = langFor(body.state);
    const copy = COPY[lang] || COPY.en;
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
        const lang = langFor(body?.state);
        const copy = COPY[lang] || COPY.en;
        if (!body?.challenge) {
          return block(copy.nothingToDo);
        }
        return block(copy.done(body.challenge, body.state.stats, lang));
      }
      case 'skip': {
        const body = await api(baseUrl, '/api/skip', { method: 'POST', body: {}, timeoutMs });
        const lang = langFor(body?.state);
        const copy = COPY[lang] || COPY.en;
        if (!body?.challenge) {
          return block(copy.nothingToSkip);
        }
        return block(copy.skipped(body.challenge, lang));
      }
      case 'status': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        const lang = langFor(state);
        const copy = COPY[lang] || COPY.en;
        const parts = [];
        if (state.settings?.paused) {
          parts.push(copy.pausedNote);
        }
        parts.push(state.current ? copy.current(state.current, lang) : copy.idle);
        parts.push(statsLine(state.stats, lang));
        return block(parts.join('\n'));
      }
      case 'how': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        const lang = langFor(state);
        const copy = COPY[lang] || COPY.en;
        if (!state.current) {
          return block(copy.idle);
        }
        return block(howText(state.current, lang));
      }
      case 'stats': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        const lang = langFor(state);
        const copy = COPY[lang] || COPY.en;
        return block(copy.stats(state.stats));
      }
      case 'web': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        const lang = langFor(state);
        const copy = COPY[lang] || COPY.en;
        await openUrl(baseUrl);
        return block(copy.web(state.stats, lang));
      }
      case 'x': {
        const state = await api(baseUrl, '/api/state', { timeoutMs });
        const lang = langFor(state);
        const copy = COPY[lang] || COPY.en;
        await openUrl(shareUrl(state.stats, lang));
        return block(copy.x);
      }
      case 'off': {
        const body = await api(baseUrl, '/api/settings', { method: 'POST', body: { paused: true }, timeoutMs });
        const copy = COPY[langFor(body?.state)] || COPY.en;
        if (!body?.settings) {
          return block(copy.stale);
        }
        return block(copy.off);
      }
      case 'on': {
        const body = await api(baseUrl, '/api/settings', { method: 'POST', body: { paused: false }, timeoutMs });
        const copy = COPY[langFor(body?.state)] || COPY.en;
        if (!body?.settings) {
          return block(copy.stale);
        }
        return block(copy.on);
      }
      case 'lang': {
        const target = command.args[0];
        if (target !== 'en' && target !== 'ja') {
          return block((COPY[fallbackLang] || COPY.en).langUsage);
        }
        const body = await api(baseUrl, '/api/settings', { method: 'POST', body: { lang: target }, timeoutMs });
        if (!body?.settings) {
          return block((COPY[fallbackLang] || COPY.en).stale);
        }
        return block(target === 'ja'
          ? '🌐 日本語に切り替えた。筋肉は万国共通。'
          : '🌐 Switched to English. Gains are universal.');
      }
      default:
        return block((COPY[fallbackLang] || COPY.en).help);
    }
  } catch {
    return block((COPY[fallbackLang] || COPY.en).down);
  }
}
