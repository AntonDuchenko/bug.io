// ============================================================
// Bug.io — Quest System & EventEmitter (TASK-12)
// ============================================================

// --- Simple EventEmitter ---
const gameEvents = {
  _listeners: {},
  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  },
  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(fn => fn !== cb);
  },
  emit(event, data) {
    if (!this._listeners[event]) return;
    for (const cb of this._listeners[event]) cb(data);
  },
};

// --- Quest Definitions ---
const QUESTS = [
  // Early game
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Kill 10 enemies',
    check: (s) => s.totalKills >= 10,
    progress: (s) => Math.min(s.totalKills, 10),
    goal: 10,
    reward: { commits: 5 },
  },
  {
    id: 'bug_hunter',
    title: 'Bug Hunter',
    description: 'Kill 100 enemies total',
    check: (s) => s.totalKills >= 100,
    progress: (s) => Math.min(s.totalKills, 100),
    goal: 100,
    reward: { commits: 10 },
  },
  {
    id: 'exterminator',
    title: 'Exterminator',
    description: 'Kill 500 enemies total',
    check: (s) => s.totalKills >= 500,
    progress: (s) => Math.min(s.totalKills, 500),
    goal: 500,
    reward: { commits: 25 },
  },
  {
    id: 'genocide',
    title: 'Code Cleanup',
    description: 'Kill 2000 enemies total',
    check: (s) => s.totalKills >= 2000,
    progress: (s) => Math.min(s.totalKills, 2000),
    goal: 2000,
    reward: { commits: 50 },
  },
  // Survival
  {
    id: 'survivor_5',
    title: 'Survivor',
    description: 'Survive 5 minutes in one run',
    check: (s) => s.maxSurviveMinutes >= 5,
    progress: (s) => Math.min(s.maxSurviveMinutes, 5),
    goal: 5,
    reward: { commits: 10 },
  },
  {
    id: 'survivor_10',
    title: 'Veteran',
    description: 'Survive 10 minutes in one run',
    check: (s) => s.maxSurviveMinutes >= 10,
    progress: (s) => Math.min(s.maxSurviveMinutes, 10),
    goal: 10,
    reward: { commits: 20 },
  },
  {
    id: 'victory',
    title: 'Shipped to Production',
    description: 'Win the game (survive 20 minutes)',
    check: (s) => s.victories >= 1,
    progress: (s) => Math.min(s.victories, 1),
    goal: 1,
    reward: { commits: 50, unlocks: { type: 'location', id: 'staging' } },
  },
  // Boss
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    description: 'Kill your first boss',
    check: (s) => s.bossesKilled >= 1,
    progress: (s) => Math.min(s.bossesKilled, 1),
    goal: 1,
    reward: { commits: 15 },
  },
  {
    id: 'boss_master',
    title: 'Senior Developer',
    description: 'Kill 5 bosses total',
    check: (s) => s.bossesKilled >= 5,
    progress: (s) => Math.min(s.bossesKilled, 5),
    goal: 5,
    reward: { commits: 30 },
  },
  // Level
  {
    id: 'level_10',
    title: 'Leveling Up',
    description: 'Reach level 10 in one run',
    check: (s) => s.maxLevel >= 10,
    progress: (s) => Math.min(s.maxLevel, 10),
    goal: 10,
    reward: { commits: 10 },
  },
  {
    id: 'level_20',
    title: 'Power Surge',
    description: 'Reach level 20 in one run',
    check: (s) => s.maxLevel >= 20,
    progress: (s) => Math.min(s.maxLevel, 20),
    goal: 20,
    reward: { commits: 20 },
  },
  // Games played
  {
    id: 'dedication',
    title: 'Dedication',
    description: 'Play 10 games',
    check: (s) => s.gamesPlayed >= 10,
    progress: (s) => Math.min(s.gamesPlayed, 10),
    goal: 10,
    reward: { commits: 15 },
  },
  // Evolution
  {
    id: 'first_evolution',
    title: 'Evolution',
    description: 'Use an evolution in a run',
    check: (s) => s.evolutionsUsed >= 1,
    progress: (s) => Math.min(s.evolutionsUsed, 1),
    goal: 1,
    reward: { commits: 20 },
  },
  // Specific enemy types
  {
    id: 'null_hunter',
    title: 'Null Pointer Exception',
    description: 'Kill 50 NullPointer enemies',
    check: (s) => (s.killsByType && s.killsByType.nullPointer || 0) >= 50,
    progress: (s) => Math.min(s.killsByType && s.killsByType.nullPointer || 0, 50),
    goal: 50,
    reward: { commits: 10 },
  },
  {
    id: 'loop_breaker',
    title: 'Break the Loop',
    description: 'Kill 30 InfiniteLoop enemies',
    check: (s) => (s.killsByType && s.killsByType.infiniteLoop || 0) >= 30,
    progress: (s) => Math.min(s.killsByType && s.killsByType.infiniteLoop || 0, 30),
    goal: 30,
    reward: { commits: 10 },
  },
];

// --- Quest Checking ---
function checkAllQuests() {
  if (!saveData) loadProgress();
  const newlyCompleted = [];

  for (const quest of QUESTS) {
    // Skip already completed
    if (saveData.completedQuests && saveData.completedQuests.includes(quest.id)) continue;

    if (quest.check(saveData)) {
      // Complete the quest
      if (!saveData.completedQuests) saveData.completedQuests = [];
      saveData.completedQuests.push(quest.id);

      // Award reward
      if (quest.reward.commits) {
        saveData.commits += quest.reward.commits;
      }
      if (quest.reward.unlocks) {
        const u = quest.reward.unlocks;
        unlockContent(u.type, u.id, 0); // free unlock
      }

      newlyCompleted.push(quest);
    }
  }

  if (newlyCompleted.length > 0) {
    saveProgress();
    // Show toasts for each completed quest (staggered)
    newlyCompleted.forEach((quest, i) => {
      setTimeout(() => showQuestToast(quest), i * 1500);
    });
  }
}

// --- Toast Notifications ---
const toastQueue = [];
let toastActive = false;

function showQuestToast(quest) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'quest-toast';
  const rewardText = quest.reward.commits ? `+${quest.reward.commits} Commits` : '';
  toast.innerHTML = `
    <div class="quest-toast-icon">&#10004;</div>
    <div class="quest-toast-body">
      <div class="quest-toast-title">Quest Complete!</div>
      <div class="quest-toast-name">${quest.title}</div>
      <div class="quest-toast-reward">${rewardText}</div>
    </div>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }, 3000);
}

// --- Quest Tab in Meta Menu ---
function renderQuestTab() {
  if (!saveData) loadProgress();
  let html = '';

  const completed = saveData.completedQuests || [];

  // Active quests first
  const active = QUESTS.filter(q => !completed.includes(q.id));
  const done = QUESTS.filter(q => completed.includes(q.id));

  if (active.length > 0) {
    html += '<div class="quest-list">';
    for (const quest of active) {
      const prog = quest.progress(saveData);
      const pct = Math.min(100, Math.round((prog / quest.goal) * 100));
      html += `<div class="quest-item">
        <div class="quest-info">
          <div class="quest-item-title">${quest.title}</div>
          <div class="quest-item-desc">${quest.description}</div>
        </div>
        <div class="quest-progress-wrap">
          <div class="quest-progress-bar">
            <div class="quest-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="quest-progress-text">${prog}/${quest.goal}</div>
        </div>
        <div class="quest-reward-text">${quest.reward.commits ? '+' + quest.reward.commits : ''}</div>
      </div>`;
    }
    html += '</div>';
  }

  if (done.length > 0) {
    html += '<h4 style="color:#3fb950;margin:12px 0 6px;font-size:13px;">Completed</h4>';
    html += '<div class="quest-list">';
    for (const quest of done) {
      html += `<div class="quest-item quest-done">
        <div class="quest-info">
          <div class="quest-item-title">&#10004; ${quest.title}</div>
          <div class="quest-item-desc">${quest.description}</div>
        </div>
        <div class="quest-reward-text" style="color:#3fb950;">${quest.reward.commits ? '+' + quest.reward.commits : ''}</div>
      </div>`;
    }
    html += '</div>';
  }

  if (QUESTS.length === 0) {
    html = '<p style="color:#8b949e;text-align:center;">No quests available</p>';
  }

  return html;
}
