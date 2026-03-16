// ============================================================
// Bug.io — XP Gems, Level Up System & Upgrade Screen (TASK-06 / TASK-08)
// ============================================================

const xpGems = [];

function spawnXpGem(x, y, value) {
  xpGems.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 20,
    radius: CONFIG.XP_GEM_RADIUS,
    value,
    attracted: false,
  });
}

function updateXpGems(dt) {
  const magnetLevel = getUpgradeLevel('magnet');
  const magnetR = BASE_MAGNET_RADIUS * (1 + magnetLevel * 0.25);
  const magnetRSq = magnetR * magnetR;

  for (let i = xpGems.length - 1; i >= 0; i--) {
    const g = xpGems[i];
    const dx = player.x - g.x;
    const dy = player.y - g.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < magnetRSq) {
      g.attracted = true;
    }

    if (g.attracted) {
      const dist = Math.sqrt(distSq);
      if (dist < player.radius) {
        addXp(g.value);
        // Location hooks on gem collected
        if (typeof onDarkModeGemCollected === 'function') onDarkModeGemCollected(g.x, g.y);
        if (typeof onCloudGemCollected === 'function') onCloudGemCollected();
        xpGems.splice(i, 1);
        continue;
      }
      const speed = CONFIG.XP_GEM_MAGNET_SPEED;
      g.x += (dx / dist) * speed * dt;
      g.y += (dy / dist) * speed * dt;
    }
  }
}

function renderXpGems() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  for (let i = 0; i < xpGems.length; i++) {
    const g = xpGems[i];
    if (g.x < camera.x - 20 || g.x > camera.x + canvasWidth + 20 ||
        g.y < camera.y - 20 || g.y > camera.y + canvasHeight + 20) continue;

    ctx.fillStyle = g.value >= 5 ? CONFIG.XP_GEM_HIGH_COLOR : CONFIG.XP_GEM_BASE_COLOR;
    ctx.beginPath();
    const r = g.radius;
    ctx.moveTo(g.x, g.y - r);
    ctx.lineTo(g.x + r * 0.7, g.y);
    ctx.lineTo(g.x, g.y + r);
    ctx.lineTo(g.x - r * 0.7, g.y);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// --- XP & Leveling ---
function xpToNextLevel(level) {
  return Math.round(CONFIG.XP_LEVEL_FORMULA_BASE * Math.pow(level, CONFIG.XP_LEVEL_FORMULA_EXP));
}

function addXp(amount) {
  player.xp += amount;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = xpToNextLevel(player.level);
    spawnLevelUpParticles(player.x, player.y);
    // Route to location-specific level up screen if available
    if (typeof locationAwareLevelUp === 'function') {
      locationAwareLevelUp();
    } else {
      showLevelUpScreen();
    }
  }
}

// --- Upgrade Definitions ---
const UPGRADE_POOL = [
  {
    id: 'console_log',
    name: 'Console.log',
    emoji: '📝',
    type: 'skill',
    maxLevel: 5,
    getDescription(lvl) {
      return SKILL_DEFS.console_log.getDescription(lvl);
    },
  },
  {
    id: 'git_push',
    name: 'Git Push',
    emoji: '🚀',
    type: 'skill',
    maxLevel: 5,
    getDescription(lvl) {
      return SKILL_DEFS.git_push.getDescription(lvl);
    },
  },
  {
    id: 'npm_install',
    name: 'npm install',
    emoji: '📦',
    type: 'skill',
    maxLevel: 5,
    getDescription(lvl) {
      return SKILL_DEFS.npm_install.getDescription(lvl);
    },
  },
  {
    id: 'stack_trace',
    name: 'Stack Trace',
    emoji: '⚡',
    type: 'skill',
    maxLevel: 5,
    getDescription(lvl) {
      return SKILL_DEFS.stack_trace.getDescription(lvl);
    },
  },
  {
    id: 'hot_reload',
    name: 'Hot Reload',
    emoji: '♻️',
    type: 'skill',
    maxLevel: 5,
    getDescription(lvl) {
      return SKILL_DEFS.hot_reload.getDescription(lvl);
    },
  },
  {
    id: '404_not_found',
    name: '404 Not Found',
    emoji: '🔍',
    type: 'skill',
    maxLevel: 5,
    getDescription(lvl) {
      return SKILL_DEFS['404_not_found'].getDescription(lvl);
    },
  },
  {
    id: 'sql_query',
    name: 'SQL Query',
    emoji: '🗃️',
    type: 'skill',
    maxLevel: 5,
    getDescription(lvl) {
      return SKILL_DEFS.sql_query.getDescription(lvl);
    },
  },
  {
    id: 'docker',
    name: 'Docker Container',
    emoji: '🐳',
    type: 'skill',
    maxLevel: 5,
    getDescription(lvl) {
      return SKILL_DEFS.docker.getDescription(lvl);
    },
  },
  {
    id: 'exploit',
    name: 'Exploit',
    emoji: '💥',
    type: 'skill',
    maxLevel: 5,
    getDescription(lvl) {
      return SKILL_DEFS.exploit.getDescription(lvl);
    },
  },
  {
    id: 'max_hp',
    name: '+20 Max HP',
    emoji: '❤️',
    type: 'passive',
    maxLevel: 99,
    getDescription() {
      return 'Increase max HP by 20';
    },
  },
  {
    id: 'move_speed',
    name: '+10% Speed',
    emoji: '🏃',
    type: 'passive',
    maxLevel: 5,
    getDescription(lvl) {
      return `Movement speed +${(lvl) * 10}%`;
    },
  },
  {
    id: 'magnet',
    name: '+25% Magnet',
    emoji: '🧲',
    type: 'passive',
    maxLevel: 5,
    getDescription(lvl) {
      return `Pickup radius +${(lvl) * 25}%`;
    },
  },
  // Passive items for evolutions
  {
    id: 'debugger',
    name: 'Debugger',
    emoji: '🔧',
    type: 'passive_item',
    maxLevel: 1,
    getDescription() {
      return CONFIG.PASSIVE_ITEMS.debugger.desc;
    },
  },
  {
    id: 'ci_cd',
    name: 'CI/CD',
    emoji: '⚙️',
    type: 'passive_item',
    maxLevel: 1,
    getDescription() {
      return CONFIG.PASSIVE_ITEMS.ci_cd.desc;
    },
  },
  {
    id: 'package_json',
    name: 'package.json',
    emoji: '📋',
    type: 'passive_item',
    maxLevel: 1,
    getDescription() {
      return CONFIG.PASSIVE_ITEMS.package_json.desc;
    },
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    emoji: '🔷',
    type: 'passive_item',
    maxLevel: 1,
    getDescription() {
      return CONFIG.PASSIVE_ITEMS.typescript.desc;
    },
  },
  {
    id: 'dockerfile',
    name: 'Dockerfile',
    emoji: '🐳',
    type: 'passive_item',
    maxLevel: 1,
    getDescription() {
      return CONFIG.PASSIVE_ITEMS.dockerfile.desc;
    },
  },
];

// Track upgrade levels
const upgradeLevels = {};

function getUpgradeLevel(id) {
  return upgradeLevels[id] || 0;
}

// Skill IDs for the upgrade system
const SKILL_IDS = ['console_log', 'git_push', 'npm_install', 'stack_trace', 'hot_reload', '404_not_found', 'sql_query', 'docker', 'exploit'];

function applyUpgrade(id) {
  const current = getUpgradeLevel(id);
  upgradeLevels[id] = current + 1;

  // If it's a skill, add or upgrade it
  if (SKILL_IDS.includes(id)) {
    if (current === 0) {
      addSkill(id);
    } else {
      upgradeSkill(id);
    }
    return;
  }

  // Passive items for evolutions
  const passiveItem = CONFIG.PASSIVE_ITEMS[id];
  if (passiveItem) {
    switch (passiveItem.bonus) {
      case 'critChance':
        player.critChance = (player.critChance || 0) + passiveItem.value;
        break;
      case 'cooldownMult':
        player.cooldownMult = (player.cooldownMult || 1) - passiveItem.value;
        break;
      case 'aoeRadius':
        player.aoeRadiusMult = (player.aoeRadiusMult || 1) + passiveItem.value;
        break;
      case 'damageBonus':
        player.damageMult = (player.damageMult || 1) + passiveItem.value;
        break;
      case 'maxHp':
        player.maxHp += passiveItem.value;
        player.hp += passiveItem.value;
        break;
    }
    return;
  }

  switch (id) {
    case 'max_hp':
      player.maxHp += 20;
      player.hp += 20;
      break;
    case 'move_speed':
      player.speed = CONFIG.PLAYER_SPEED * (1 + upgradeLevels[id] * 0.1);
      break;
    case 'magnet':
      break;
  }
}

// --- Evolution System ---
const evolvedSkills = {}; // tracks which skills have been evolved

function getAvailableEvolutions() {
  const evolutions = [];
  for (const [evoId, evo] of Object.entries(CONFIG.EVOLUTIONS)) {
    // Skill must be at max level (5)
    if (getSkillLevel(evo.skill) < CONFIG.MAX_SKILL_LEVEL) continue;
    // Player must have the required passive item
    if (getUpgradeLevel(evo.passive) < 1) continue;
    // Not already evolved
    if (evolvedSkills[evoId]) continue;
    evolutions.push({
      id: '__evo_' + evoId,
      evoId,
      name: evo.name,
      emoji: evo.emoji,
      type: 'evolution',
      maxLevel: 1,
      getDescription() {
        return getEvolutionDescription(evoId);
      },
    });
  }
  return evolutions;
}

function getEvolutionDescription(evoId) {
  switch (evoId) {
    case 'breakpoint':   return 'Projectiles freeze enemies for 3s';
    case 'auto_deploy':  return 'Bolts auto-aim at nearest enemy';
    case 'node_modules': return 'AOE radius x3, freezes game 0.5s';
    case 'strict_mode':  return 'Double damage to elite enemies';
    case 'container':    return 'Full immunity 5s every 60s';
    default: return '';
  }
}

function applyEvolution(evoId) {
  evolvedSkills[evoId] = true;
  const evo = CONFIG.EVOLUTIONS[evoId];
  // Mark the skill as evolved in activeSkills
  const skill = activeSkills[evo.skill];
  if (skill) {
    skill.evolved = evoId;
    skill.evoData = {};
    // Init evolution-specific data
    if (evoId === 'container') {
      skill.evoData.immuneTimer = 0;
      skill.evoData.immuneCooldown = 0;
    }
  }
}

function getRandomUpgrades(count) {
  // Check for available evolutions first — always show them as priority
  const evolutions = getAvailableEvolutions();
  if (evolutions.length > 0) {
    // Always offer evolutions first
    const result = evolutions.slice(0, count);
    if (result.length < count) {
      // Fill remaining slots with normal upgrades
      const normal = getNormalUpgrades(count - result.length);
      result.push(...normal);
    }
    return result;
  }

  return getNormalUpgrades(count);
}

function getNormalUpgrades(count) {
  const available = UPGRADE_POOL.filter(u => {
    const lvl = getUpgradeLevel(u.id);
    return lvl < u.maxLevel;
  });

  // Prioritize offering new skills the player doesn't have yet
  const newSkills = available.filter(u => u.type === 'skill' && getUpgradeLevel(u.id) === 0);
  const others = available.filter(u => !(u.type === 'skill' && getUpgradeLevel(u.id) === 0));

  // Shuffle both pools
  shuffle(newSkills);
  shuffle(others);

  // Combine: new skills first, then others
  const combined = [...newSkills, ...others];
  return combined.slice(0, count);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// --- Level Up UI ---
let levelUpActive = false;
let levelUpChoices = [];

function showLevelUpScreen() {
  levelUpActive = true;
  game.state = GameState.PAUSED;
  levelUpChoices = getRandomUpgrades(CONFIG.UPGRADE_CHOICES);

  const overlay = document.getElementById('levelup-overlay');
  const container = document.getElementById('levelup-cards');
  const levelText = document.getElementById('levelup-level');

  levelText.textContent = `Level ${player.level}`;
  container.innerHTML = '';

  levelUpChoices.forEach((upgrade, idx) => {
    const lvl = getUpgradeLevel(upgrade.id);
    const nextLvl = lvl + 1;
    const card = document.createElement('div');
    const isEvo = upgrade.type === 'evolution';
    card.className = 'levelup-card' + (isEvo ? ' levelup-card-evo' : '');

    let lvlText = '';
    if (upgrade.type === 'skill') lvlText = `Lv ${lvl} → ${nextLvl}`;
    else if (isEvo) lvlText = '★ EVOLUTION ★';

    card.innerHTML = `
      <div class="levelup-emoji">${upgrade.emoji}</div>
      <div class="levelup-name">${upgrade.name}</div>
      <div class="levelup-desc">${isEvo ? upgrade.getDescription() : upgrade.getDescription(nextLvl)}</div>
      <div class="levelup-lvl">${lvlText}</div>
      <div class="levelup-key">${idx + 1}</div>
    `;
    card.addEventListener('click', () => selectUpgrade(idx));
    container.appendChild(card);
  });

  overlay.classList.add('visible');
}

function selectUpgrade(idx) {
  if (!levelUpActive || idx < 0 || idx >= levelUpChoices.length) return;
  const choice = levelUpChoices[idx];

  if (choice.type === 'evolution') {
    applyEvolution(choice.evoId);
  } else {
    applyUpgrade(choice.id);
  }

  levelUpActive = false;
  document.getElementById('levelup-overlay').classList.remove('visible');
  game.state = GameState.PLAYING;
}

// Key listener for 1/2/3
window.addEventListener('keydown', (e) => {
  if (!levelUpActive) return;
  const num = parseInt(e.key);
  if (num >= 1 && num <= levelUpChoices.length) {
    selectUpgrade(num - 1);
  }
});

// Initialize console_log as level 1 (player starts with it)
upgradeLevels['console_log'] = 1;

// Base magnet radius (before upgrades)
const BASE_MAGNET_RADIUS = CONFIG.PLAYER_MAGNET_RADIUS;
