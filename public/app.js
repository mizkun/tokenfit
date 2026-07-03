const els = {
  todayReps: document.querySelector('#today-reps'),
  totalReps: document.querySelector('#total-reps'),
  streak: document.querySelector('#streak'),
  todayDone: document.querySelector('#today-done'),
  totalDone: document.querySelector('#total-done'),
  skippedCount: document.querySelector('#skipped-count'),
  queueCount: document.querySelector('#queue-count'),
  emptyState: document.querySelector('#empty-state'),
  challengeCard: document.querySelector('#challenge-card'),
  challengeTarget: document.querySelector('#challenge-target'),
  challengeName: document.querySelector('#challenge-name'),
  challengeAmount: document.querySelector('#challenge-amount'),
  challengeUnit: document.querySelector('#challenge-unit'),
  challengeCue: document.querySelector('#challenge-cue'),
  challengeSteps: document.querySelector('#challenge-steps'),
  stackTotal: document.querySelector('#stack-total'),
  plateStack: document.querySelector('#plate-stack'),
  shareX: document.querySelector('#share-x'),
  doneButton: document.querySelector('#done-button'),
  skipButton: document.querySelector('#skip-button'),
  manualTrigger: document.querySelector('#manual-trigger'),
  queueList: document.querySelector('#queue-list'),
  recentList: document.querySelector('#recent-list')
};

let currentChallengeId = null;

function setText(element, value) {
  element.textContent = String(value);
}

function formatAmount(challenge) {
  return `${challenge.amount} ${challenge.unit}`;
}

function renderListItem(challenge, { showStatus = false } = {}) {
  const item = document.createElement('li');
  const title = document.createElement('strong');
  const detail = document.createElement('span');
  const meta = document.createElement('span');

  title.textContent = challenge.name;
  detail.textContent = formatAmount(challenge);
  meta.textContent = showStatus ? challenge.status : challenge.target;
  if (showStatus) {
    meta.className = challenge.status;
  }

  const text = document.createElement('div');
  text.append(title, detail);
  item.append(text, meta);
  return item;
}

function renderEmptyList(list, copy) {
  const item = document.createElement('li');
  const text = document.createElement('strong');
  text.textContent = copy;
  item.append(text);
  list.replaceChildren(item);
}

function renderRepStack(stats) {
  const brickCount = Math.min(stats.totalDone, 14);
  const overflow = stats.totalDone > 14;
  const bricks = [];

  for (let index = 0; index < brickCount; index += 1) {
    const brick = document.createElement('span');
    const width = Math.max(44, 76 - index * 2);
    brick.className = `rep-brick${overflow && index === brickCount - 1 ? ' is-overflow' : ''}`;
    brick.style.bottom = `${index * 10}px`;
    brick.style.width = `${width}%`;
    brick.style.zIndex = String(index + 1);
    bricks.push(brick);
  }

  els.plateStack.replaceChildren(...bricks);
}

function renderSteps(steps = []) {
  const items = steps.map((step) => {
    const item = document.createElement('li');
    item.textContent = step;
    return item;
  });
  els.challengeSteps.replaceChildren(...items);
}

function updateShareLink(stats) {
  const text = [
    `I just did ${stats.totalReps} TokenFit reps while my AI was thinking.`,
    'Your AI thinks. You rep.',
    '#TokenFit'
  ].join('\n');
  els.shareX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function render(state) {
  const { stats, current, queue, recent } = state;
  currentChallengeId = current?.id || null;

  setText(els.todayReps, stats.todayReps);
  setText(els.totalReps, stats.totalReps);
  setText(els.streak, stats.streak);
  setText(els.todayDone, stats.todayDone);
  setText(els.totalDone, stats.totalDone);
  setText(els.skippedCount, stats.skipped);
  setText(els.queueCount, `Queue: ${stats.queueCount}`);
  setText(els.stackTotal, stats.totalReps);
  renderRepStack(stats);
  updateShareLink(stats);

  els.emptyState.classList.toggle('is-hidden', Boolean(current));
  els.challengeCard.classList.toggle('is-hidden', !current);

  if (current) {
    setText(els.challengeTarget, current.target);
    setText(els.challengeName, current.name);
    setText(els.challengeAmount, current.amount);
    setText(els.challengeUnit, current.unit);
    setText(els.challengeCue, current.cue);
    renderSteps(current.steps || [current.cue]);
  } else {
    renderSteps([]);
  }

  const upcoming = queue.slice(1);
  if (upcoming.length === 0) {
    renderEmptyList(els.queueList, 'No queued reps');
  } else {
    els.queueList.replaceChildren(...upcoming.map((challenge) => renderListItem(challenge)));
  }

  if (recent.length === 0) {
    renderEmptyList(els.recentList, 'No reps yet');
  } else {
    els.recentList.replaceChildren(
      ...recent.map((challenge) => renderListItem(challenge, { showStatus: true }))
    );
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

const events = new EventSource('/api/events');
events.addEventListener('state', (event) => {
  render(JSON.parse(event.data));
});
events.addEventListener('error', () => {
  setTimeout(loadState, 1200);
});

loadState();
