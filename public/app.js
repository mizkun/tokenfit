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
      '#TokenFit',
      'https://github.com/mizkun/tokenfit'
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
      '#TokenFit',
      'https://github.com/mizkun/tokenfit'
    ].join('\n')
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
  if (currentLang === 'ja' && challenge.ja) {
    return {
      name: challenge.ja.name || challenge.name,
      target: challenge.ja.target || challenge.target,
      cue: challenge.ja.cue || challenge.cue,
      steps: challenge.ja.steps || challenge.steps || [challenge.cue]
    };
  }

  return {
    name: challenge.name,
    target: challenge.target,
    cue: challenge.cue,
    steps: challenge.steps || [challenge.cue]
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
