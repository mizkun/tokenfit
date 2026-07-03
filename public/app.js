const els = {
  documentHtml: document.documentElement,
  appTitle: document.querySelector('#app-title'),
  langEn: document.querySelector('#lang-en'),
  langJa: document.querySelector('#lang-ja'),
  emptyState: document.querySelector('#empty-state'),
  challengeCard: document.querySelector('#challenge-card'),
  challengeName: document.querySelector('#challenge-name'),
  challengeAmount: document.querySelector('#challenge-amount'),
  challengeUnit: document.querySelector('#challenge-unit'),
  challengeCue: document.querySelector('#challenge-cue'),
  challengeSteps: document.querySelector('#challenge-steps'),
  stackMeter: document.querySelector('#stack-meter'),
  todayCount: document.querySelector('#today-count'),
  streakCount: document.querySelector('#streak-count'),
  todayList: document.querySelector('#today-list'),
  i18nNodes: document.querySelectorAll('[data-i18n]'),
  shareX: document.querySelector('#share-x'),
  doneButton: document.querySelector('#done-button'),
  skipButton: document.querySelector('#skip-button'),
  manualTrigger: document.querySelector('#manual-trigger')
};

const COPY = {
  en: {
    title: 'Your AI thinks. You rep.',
    new: 'Test Hook',
    done: 'Done',
    skip: 'Skip',
    waiting: 'Waiting for a hook.',
    todayLabel: 'sets today',
    streakLabel: 'day streak',
    noToday: 'No reps yet',
    postToX: 'Post to X',
    units: {
      reps: 'reps',
      seconds: 'seconds'
    },
    share: (stats) => [
      `I just did ${stats.totalReps} TokenFit reps while my AI was thinking.`,
      'Your AI thinks. You rep.',
      '#TokenFit'
    ].join('\n')
  },
  ja: {
    title: 'Your AI thinks. You rep.',
    new: 'Test Hook',
    done: 'Done',
    skip: 'Skip',
    waiting: 'Waiting for a hook.',
    todayLabel: 'sets today',
    streakLabel: 'day streak',
    noToday: 'まだなし',
    postToX: 'Post to X',
    units: {
      reps: 'reps',
      seconds: 'seconds'
    },
    share: (stats) => [
      `AIが考えている間にTokenFitで${stats.totalReps} repsやった。`,
      'Your AI thinks. You rep.',
      '#TokenFit'
    ].join('\n')
  }
};

const EXERCISE_COPY = {
  'desk-pushups': {
    ja: {
      name: 'デスク腕立て',
      target: '胸・上腕三頭筋',
      cue: '机に手をついて、体をまっすぐ。',
      steps: [
        '安定した机に両手を置く。',
        '体が一直線になるまで足を後ろに引く。',
        '胸を机に近づけてから押し戻す。'
      ]
    }
  },
  'chair-squats': {
    ja: {
      name: '椅子スクワット',
      target: '脚',
      cue: '椅子に軽くタッチして、まっすぐ立つ。',
      steps: [
        '椅子の前に足を肩幅で立つ。',
        'お尻を後ろに引いて椅子に軽く触れる。',
        '足裏で床を押して立ち上がる。'
      ]
    }
  },
  'calf-raises': {
    ja: {
      name: 'カーフレイズ',
      target: 'ふくらはぎ',
      cue: '上がって、止めて、ゆっくり下ろす。',
      steps: [
        '必要なら机に軽く手を添えて立つ。',
        'つま先立ちになる。',
        '一瞬止めてからゆっくり下ろす。'
      ]
    }
  },
  'shoulder-rolls': {
    ja: {
      name: '肩回し',
      target: '肩',
      cue: '大きく回して、あごの力を抜く。',
      steps: [
        '座るか立って背筋を伸ばす。',
        '肩を上げて、後ろに回して、下ろす。',
        'ゆっくりリラックスして動かす。'
      ]
    }
  },
  'standing-twists': {
    ja: {
      name: '立位ツイスト',
      target: '体幹',
      cue: '左右にやさしくひねる。',
      steps: [
        '膝を少しゆるめて立つ。',
        '上半身を片側へやさしく回す。',
        '中央に戻って反対側へ回す。'
      ]
    }
  },
  'wall-sit': {
    ja: {
      name: 'ウォールシット',
      target: '太もも',
      cue: '背中を壁につけて、無理ない深さで。',
      steps: [
        '背中を壁につける。',
        'きつすぎない位置までゆっくり下がる。',
        '呼吸しながらキープして、ゆっくり立つ。'
      ]
    }
  },
  plank: {
    ja: {
      name: 'デスクプランク',
      target: '体幹',
      cue: '前腕を机に置いて、肋骨を締める。',
      steps: [
        '安定した机に前腕を置く。',
        '体が長い一直線になるまで足を引く。',
        '肩をすくめず、軽くお腹に力を入れてキープする。'
      ]
    }
  },
  'wrist-resets': {
    ja: {
      name: '手首リセット',
      target: '手首',
      cue: 'ゆっくり曲げて、ゆっくり伸ばす。',
      steps: [
        '両腕を前に出す。',
        '手首を下に曲げてから上に伸ばす。',
        'ゆっくり動かし、鋭い痛みがあれば止める。'
      ]
    }
  },
  'glute-squeezes': {
    ja: {
      name: 'お尻スクイーズ',
      target: 'お尻',
      cue: '締めて、止めて、ゆるめる。',
      steps: [
        '座るか立って姿勢を整える。',
        'お尻に1秒ほど力を入れる。',
        '完全にゆるめてから次のrepへ。'
      ]
    }
  },
  marches: {
    ja: {
      name: 'その場マーチ',
      target: '股関節',
      cue: '膝を上げて、力まずに。',
      steps: [
        '机の横でまっすぐ立つ。',
        '片膝を上げて下ろす。',
        '左右交互に楽なペースで続ける。'
      ]
    }
  }
};

let currentChallengeId = null;
let currentState = null;
let currentLang = localStorage.getItem('tokenfit-lang') || 'en';

function setText(element, value) {
  if (!element) {
    return;
  }
  element.textContent = String(value);
}

function copy() {
  return COPY[currentLang] || COPY.en;
}

function exerciseText(challenge) {
  if (currentLang === 'en') {
    return {
      name: challenge.name,
      target: challenge.target,
      cue: challenge.cue,
      steps: challenge.steps || [challenge.cue]
    };
  }

  const localized = EXERCISE_COPY[challenge.exerciseId]?.[currentLang];
  return {
    name: challenge.name,
    target: localized?.target || challenge.target,
    cue: localized?.cue || challenge.cue,
    steps: localized?.steps || challenge.steps || [challenge.cue]
  };
}

function applyStaticCopy() {
  const strings = copy();
  els.documentHtml.lang = currentLang;
  document.title = 'TokenFit';
  setText(els.appTitle, strings.title);
  setText(els.manualTrigger, strings.new);
  setText(els.doneButton, strings.done);
  setText(els.skipButton, strings.skip);
  setText(els.shareX, strings.postToX);
  setText(document.querySelector('.status-copy'), strings.waiting);
  els.langEn.classList.toggle('is-active', currentLang === 'en');
  els.langJa.classList.toggle('is-active', currentLang === 'ja');
  els.i18nNodes.forEach((node) => {
    const key = node.dataset.i18n;
    if (strings[key]) {
      node.textContent = strings[key];
    }
  });
}

function renderRepStack(stats) {
  const days = 182;
  const cells = [];
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
    const count = stats.doneByDate?.[key] || (key === todayKey ? stats.todayDone : 0);
    const level = count >= 10 ? 4 : count >= 7 ? 3 : count >= 3 ? 2 : count > 0 ? 1 : 0;
    const cell = document.createElement('span');
    cell.className = `stack-cell${level > 0 ? ` level-${level}` : ''}`;
    cell.title = `${key}: ${count} sets`;
    cells.push(cell);
  }

  els.stackMeter.replaceChildren(...cells);
}

function renderSteps(steps = []) {
  const items = steps.map((step) => {
    const item = document.createElement('li');
    item.textContent = step;
    return item;
  });
  els.challengeSteps.replaceChildren(...items);
}

function renderTodayList(today = []) {
  if (today.length === 0) {
    const item = document.createElement('li');
    item.className = 'is-empty';
    item.textContent = copy().noToday;
    els.todayList.replaceChildren(item);
    return;
  }

  const grouped = new Map();
  today.forEach((challenge) => {
    const current = grouped.get(challenge.exerciseId) || {
      challenge,
      count: 0
    };
    current.count += 1;
    grouped.set(challenge.exerciseId, current);
  });

  const items = [...grouped.values()].map(({ challenge, count }) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const reps = document.createElement('strong');
    const text = exerciseText(challenge);

    name.textContent = text.name;
    reps.textContent = count > 1 ? `x${count}` : `${challenge.amount} ${copy().units[challenge.unit] || challenge.unit}`;
    item.append(name, reps);
    return item;
  });

  els.todayList.replaceChildren(...items);
}

function updateShareLink(stats) {
  const text = copy().share(stats);
  els.shareX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function render(state) {
  currentState = state;
  applyStaticCopy();
  const { stats, current, today } = state;
  currentChallengeId = current?.id || null;

  setText(els.todayCount, stats.todayDone);
  setText(els.streakCount, stats.streak);
  renderRepStack(stats);
  renderTodayList(today);
  updateShareLink(stats);

  els.emptyState.classList.toggle('is-hidden', Boolean(current));
  els.challengeCard.classList.toggle('is-hidden', !current);

  if (current) {
    const text = exerciseText(current);
    setText(els.challengeName, text.name);
    setText(els.challengeAmount, current.amount);
    setText(els.challengeUnit, copy().units[current.unit] || current.unit);
    setText(els.challengeCue, text.cue);
    renderSteps(text.steps);
  } else {
    renderSteps([]);
  }
}

async function postJson(path, body = {}) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const data = await response.json();
  render(data.state);
}

async function loadState() {
  const response = await fetch('/api/state');
  render(await response.json());
}

els.doneButton.addEventListener('click', () => {
  if (currentChallengeId) {
    postJson('/api/done', { id: currentChallengeId }).catch(loadState);
  }
});

els.skipButton.addEventListener('click', () => {
  if (currentChallengeId) {
    postJson('/api/skip', { id: currentChallengeId }).catch(loadState);
  }
});

els.manualTrigger.addEventListener('click', () => {
  postJson('/api/challenge').catch(loadState);
});

els.langEn.addEventListener('click', () => {
  currentLang = 'en';
  localStorage.setItem('tokenfit-lang', currentLang);
  if (currentState) {
    render(currentState);
  }
});

els.langJa.addEventListener('click', () => {
  currentLang = 'ja';
  localStorage.setItem('tokenfit-lang', currentLang);
  if (currentState) {
    render(currentState);
  }
});

const events = new EventSource('/api/events');
events.addEventListener('state', (event) => {
  render(JSON.parse(event.data));
});
events.addEventListener('error', () => {
  setTimeout(loadState, 1200);
});

loadState();
