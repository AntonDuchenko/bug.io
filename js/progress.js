// ============================================================
// Bug.io — Meta-Progression & Commits (TASK-11)
// ============================================================

const SAVE_KEY = 'bugio_save';

// --- Content Definitions ---
const HEROES = [
  { id: 'frontend_dev', name: 'Frontend Dev', emoji: '💻', cost: 0,   desc: 'Console.log + balanced stats', startSkill: 'console_log', passive: 'None' },
  { id: 'backend_dev',  name: 'Backend Dev',  emoji: '🖥️', cost: 50,  desc: 'SQL Query + 30% HP',           startSkill: 'sql_query',    passive: '+30% HP' },
  { id: 'devops',       name: 'DevOps',       emoji: '🔧', cost: 100, desc: 'Docker Container + -25% CD',   startSkill: 'docker',       passive: '-25% cooldowns' },
  { id: 'hacker',       name: 'Hacker',       emoji: '🏴‍☠️', cost: 200, desc: 'Exploit + 35% crit',           startSkill: 'exploit',      passive: '+35% crit' },
];

const LOCATIONS = [
  { id: 'localhost',          name: 'localhost',           emoji: '🏠', cost: 0,   desc: 'Standard arena, no special mechanics' },
  { id: 'staging',            name: 'Staging Environment', emoji: '🔀', cost: 30,  desc: 'PR-based level up screen' },
  { id: 'legacy_codebase',    name: 'Legacy Codebase',     emoji: '📜', cost: 30,  desc: 'Tech Debt mechanic' },
  { id: 'dark_mode',          name: 'Dark Mode',           emoji: '🌑', cost: 50,  desc: 'Limited visibility radius' },
  { id: 'cloud',              name: 'Cloud Infrastructure',emoji: '☁️', cost: 50,  desc: 'Credit system for skills' },
  { id: 'incident',           name: 'Incident / Outage',   emoji: '🚨', cost: 80,  desc: 'Popup quizzes every 60s' },
  { id: 'hackathon',          name: 'Hackathon',           emoji: '🤝', cost: 80,  desc: 'Junior companion AI' },
  { id: 'infinite_loop',      name: 'Infinite Loop',       emoji: '♻️', cost: 100, desc: 'Enemies reset every 3 min' },
  { id: 'production_server',  name: 'Production Server',   emoji: '🔥', cost: 150, desc: 'No idle allowed' },
];

const EVOLUTION_UNLOCKS = [
  { id: 'breakpoint',   name: 'Breakpoint',   emoji: '🔴', cost: 40,  desc: 'Console.log + Debugger' },
  { id: 'auto_deploy',  name: 'Auto Deploy',  emoji: '🤖', cost: 40,  desc: 'Git Push + CI/CD' },
  { id: 'node_modules', name: 'node_modules', emoji: '📁', cost: 40,  desc: 'npm install + package.json' },
  { id: 'strict_mode',  name: 'Strict Mode',  emoji: '🔒', cost: 40,  desc: 'Stack Trace + TypeScript' },
  { id: 'container',    name: 'Container',    emoji: '📦', cost: 40,  desc: 'Hot Reload + Dockerfile' },
];

// --- Default save state ---
function getDefaultSave() {
  return {
    commits: 0,
    unlockedHeroes: ['frontend_dev'],
    unlockedLocations: ['localhost'],
    unlockedEvolutions: [],
    completedQuests: [],
    totalKills: 0,
    totalMinutes: 0,
    bossesKilled: 0,
    killsByType: {},
    maxLevel: 0,
    gamesPlayed: 0,
    victories: 0,
    maxSurviveMinutes: 0,
    evolutionsUsed: 0,
  };
}

// --- Save / Load ---
let saveData = null;

function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to handle missing fields
      saveData = { ...getDefaultSave(), ...parsed };
    } else {
      saveData = getDefaultSave();
    }
  } catch (e) {
    console.warn('Bug.io: corrupt save data, resetting.', e);
    saveData = getDefaultSave();
  }
  return saveData;
}

function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.warn('Bug.io: failed to save progress.', e);
  }
}

function addCommits(n) {
  if (!saveData) loadProgress();
  saveData.commits += n;
  saveProgress();
}

function getCommits() {
  if (!saveData) loadProgress();
  return saveData.commits;
}

function isUnlocked(type, id) {
  if (!saveData) loadProgress();
  switch (type) {
    case 'hero':      return saveData.unlockedHeroes.includes(id);
    case 'location':  return saveData.unlockedLocations.includes(id);
    case 'evolution': return saveData.unlockedEvolutions.includes(id);
  }
  return false;
}

function unlockContent(type, id, cost) {
  if (!saveData) loadProgress();
  if (saveData.commits < cost) return false;

  saveData.commits -= cost;
  switch (type) {
    case 'hero':
      if (!saveData.unlockedHeroes.includes(id)) saveData.unlockedHeroes.push(id);
      break;
    case 'location':
      if (!saveData.unlockedLocations.includes(id)) saveData.unlockedLocations.push(id);
      break;
    case 'evolution':
      if (!saveData.unlockedEvolutions.includes(id)) saveData.unlockedEvolutions.push(id);
      break;
  }
  saveProgress();
  return true;
}

function updateStats(stats) {
  if (!saveData) loadProgress();
  saveData.totalKills += stats.kills || 0;
  saveData.totalMinutes += stats.minutes || 0;
  saveData.bossesKilled += stats.bossesKilled || 0;
  saveData.gamesPlayed++;
  if (stats.victory) saveData.victories++;
  if (stats.level > (saveData.maxLevel || 0)) saveData.maxLevel = stats.level;
  if (stats.minutes > (saveData.maxSurviveMinutes || 0)) saveData.maxSurviveMinutes = stats.minutes;
  saveData.evolutionsUsed = (saveData.evolutionsUsed || 0) + (stats.evolutionsUsed || 0);
  // Kill counts by type
  if (stats.killsByType) {
    if (!saveData.killsByType) saveData.killsByType = {};
    for (const [type, count] of Object.entries(stats.killsByType)) {
      saveData.killsByType[type] = (saveData.killsByType[type] || 0) + count;
    }
  }
  saveProgress();
}

function resetProgress() {
  saveData = getDefaultSave();
  saveProgress();
}

// --- Commits earned from a run ---
function calculateCommits(elapsedSeconds, bossesKilledThisRun) {
  const minutes = Math.floor(elapsedSeconds / 60);
  return minutes + (bossesKilledThisRun || 0) * 5;
}

// --- Meta Menu UI ---
let metaMenuOpen = false;

function showMetaMenu() {
  metaMenuOpen = true;
  if (!saveData) loadProgress();
  const overlay = document.getElementById('meta-overlay');
  renderMetaContent();
  overlay.classList.add('visible');
}

function hideMetaMenu() {
  metaMenuOpen = false;
  document.getElementById('meta-overlay').classList.remove('visible');
}

let metaTab = 'shop'; // 'shop' or 'quests'

function renderMetaContent() {
  const container = document.getElementById('meta-content');
  const balance = document.getElementById('meta-commits');
  balance.textContent = `${saveData.commits} Commits`;

  // Tab bar
  let html = `<div class="meta-tabs">
    <button class="meta-tab ${metaTab === 'shop' ? 'active' : ''}" onclick="metaTab='shop';renderMetaContent()">Shop</button>
    <button class="meta-tab ${metaTab === 'quests' ? 'active' : ''}" onclick="metaTab='quests';renderMetaContent()">Quests</button>
  </div>`;

  if (metaTab === 'quests') {
    html += typeof renderQuestTab === 'function' ? renderQuestTab() : '<p style="color:#8b949e;">Loading...</p>';
    container.innerHTML = html;
    return;
  }

  // Heroes section
  html += '<h3 class="meta-section-title">Heroes</h3><div class="meta-cards">';
  for (const hero of HEROES) {
    const unlocked = isUnlocked('hero', hero.id);
    html += `<div class="meta-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="meta-card-emoji">${hero.emoji}</div>
      <div class="meta-card-name">${hero.name}</div>
      <div class="meta-card-desc">${hero.desc}</div>
      ${unlocked
        ? '<div class="meta-card-status">Unlocked</div>'
        : `<button class="meta-unlock-btn" onclick="tryUnlock('hero','${hero.id}',${hero.cost})">${hero.cost} Commits</button>`
      }
    </div>`;
  }
  html += '</div>';

  // Locations section
  html += '<h3 class="meta-section-title">Locations</h3><div class="meta-cards">';
  for (const loc of LOCATIONS) {
    const unlocked = isUnlocked('location', loc.id);
    html += `<div class="meta-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="meta-card-emoji">${loc.emoji}</div>
      <div class="meta-card-name">${loc.name}</div>
      <div class="meta-card-desc">${loc.desc}</div>
      ${unlocked
        ? '<div class="meta-card-status">Unlocked</div>'
        : `<button class="meta-unlock-btn" onclick="tryUnlock('location','${loc.id}',${loc.cost})">${loc.cost} Commits</button>`
      }
    </div>`;
  }
  html += '</div>';

  // Evolutions section
  html += '<h3 class="meta-section-title">Evolutions</h3><div class="meta-cards">';
  for (const evo of EVOLUTION_UNLOCKS) {
    const unlocked = isUnlocked('evolution', evo.id);
    html += `<div class="meta-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="meta-card-emoji">${evo.emoji}</div>
      <div class="meta-card-name">${evo.name}</div>
      <div class="meta-card-desc">${evo.desc}</div>
      ${unlocked
        ? '<div class="meta-card-status">Unlocked</div>'
        : `<button class="meta-unlock-btn" onclick="tryUnlock('evolution','${evo.id}',${evo.cost})">${evo.cost} Commits</button>`
      }
    </div>`;
  }
  html += '</div>';

  container.innerHTML = html;
}

function tryUnlock(type, id, cost) {
  if (!saveData) loadProgress();
  if (saveData.commits < cost) {
    // Flash the balance red briefly
    const el = document.getElementById('meta-commits');
    el.style.color = '#f85149';
    setTimeout(() => { el.style.color = ''; }, 400);
    return;
  }

  if (unlockContent(type, id, cost)) {
    // Flash animation on the card
    renderMetaContent();
    // Find the newly unlocked card and flash it
    setTimeout(() => {
      const cards = document.querySelectorAll('.meta-card.unlocked');
      const last = cards[cards.length - 1];
      if (last) {
        last.style.transition = 'box-shadow 0.3s';
        last.style.boxShadow = '0 0 20px #7ee787';
        setTimeout(() => { last.style.boxShadow = ''; }, 600);
      }
    }, 50);
  }
}

// --- Track bosses killed this run ---
let bossesKilledThisRun = 0;

// --- Hero Selection ---
let selectedHeroId = 'frontend_dev';

function showHeroSelect() {
  if (!saveData) loadProgress();
  const overlay = document.getElementById('hero-select-overlay');
  const container = document.getElementById('hero-cards');
  container.innerHTML = '';

  for (const [heroId, hero] of Object.entries(CONFIG.HERO_DEFS)) {
    const unlocked = isUnlocked('hero', heroId);
    const card = document.createElement('div');
    card.className = 'hero-card' + (unlocked ? '' : ' hero-locked');

    const passiveText = hero.passive
      ? (hero.passive.type === 'maxHpMult' ? '+30% HP'
        : hero.passive.type === 'cooldownMult' ? '-25% cooldowns'
        : hero.passive.type === 'critChance' ? '+35% crit'
        : '')
      : 'Balanced';

    card.innerHTML = `
      <div class="hero-card-emoji">${hero.emoji}</div>
      <div class="hero-card-name">${hero.name}</div>
      <div class="hero-card-desc">${hero.desc}</div>
      <div class="hero-card-passive">${passiveText}</div>
      ${unlocked ? '' : '<div class="hero-card-lock">Locked</div>'}
    `;

    if (unlocked) {
      card.addEventListener('click', () => {
        selectedHeroId = heroId;
        overlay.classList.remove('visible');
        startGameWithHero(heroId);
      });
    }

    container.appendChild(card);
  }

  overlay.classList.add('visible');
}

function startGameWithHero(heroId) {
  const hero = CONFIG.HERO_DEFS[heroId];
  if (!hero) return;

  // Reset game first
  restartGame();

  // Apply hero-specific start skill
  resetSkills();
  addSkill(hero.startSkill);
  for (const key in upgradeLevels) delete upgradeLevels[key];
  upgradeLevels[hero.startSkill] = 1;

  // Initialize location mechanics
  if (typeof initLocation === 'function') {
    initLocation(activeLocation);
  }

  // Apply passive bonus
  if (hero.passive) {
    switch (hero.passive.type) {
      case 'maxHpMult':
        player.maxHp = Math.round(CONFIG.PLAYER_MAX_HP * hero.passive.value);
        player.hp = player.maxHp;
        renderHUD._displayHp = player.hp;
        break;
      case 'cooldownMult':
        player.cooldownMult = hero.passive.value;
        break;
      case 'critChance':
        player.critChance = hero.passive.value;
        break;
    }
  }
}

// Load on init
loadProgress();
