// ============================================================
// Bug.io — Location Mechanics (TASK-13, TASK-14)
// ============================================================

let activeLocation = 'localhost'; // default

// ================================================================
// TASK-13 — Staging Environment: PR-based level up
// ================================================================
let stagingPrNumber = 0;
let stagingRejectsLeft = 0;
const STAGING_MAX_REJECTS = 2;

function showStagingLevelUp() {
  levelUpActive = true;
  game.state = GameState.PAUSED;
  levelUpChoices = getRandomUpgrades(CONFIG.UPGRADE_CHOICES);
  stagingPrNumber++;
  stagingRejectsLeft = STAGING_MAX_REJECTS;

  renderStagingUI();
}

function renderStagingUI() {
  const overlay = document.getElementById('levelup-overlay');
  const container = document.getElementById('levelup-cards');
  const levelText = document.getElementById('levelup-level');

  levelText.innerHTML = `<span style="color:#58a6ff;">Pull Request #${stagingPrNumber}</span> <span style="color:#8b949e;font-size:16px;">— Ready for Review</span>`;
  container.innerHTML = '';

  levelUpChoices.forEach((upgrade, idx) => {
    const lvl = getUpgradeLevel(upgrade.id);
    const nextLvl = lvl + 1;
    const isEvo = upgrade.type === 'evolution';

    const card = document.createElement('div');
    card.className = 'levelup-card staging-card' + (isEvo ? ' levelup-card-evo' : '');

    // Build diff-style content
    const fileName = getStagingFileName(upgrade);
    const diffLines = getStagingDiff(upgrade, lvl, nextLvl, isEvo);

    card.innerHTML = `
      <div class="staging-file-header">${fileName}</div>
      <pre class="staging-diff">${diffLines}</pre>
      <button class="staging-merge-btn" data-idx="${idx}">Approve &amp; Merge</button>
      <div class="levelup-key">${idx + 1}</div>
    `;

    card.querySelector('.staging-merge-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      selectUpgrade(idx);
    });
    card.addEventListener('click', () => selectUpgrade(idx));
    container.appendChild(card);
  });

  // Reject PR button
  const rejectRow = document.createElement('div');
  rejectRow.style.cssText = 'text-align:center;margin-top:8px;';
  const rejectBtn = document.createElement('button');
  rejectBtn.className = 'staging-reject-btn';
  rejectBtn.textContent = `Reject PR (${stagingRejectsLeft}/${STAGING_MAX_REJECTS} left)`;
  rejectBtn.disabled = stagingRejectsLeft <= 0;
  rejectBtn.addEventListener('click', () => {
    if (stagingRejectsLeft <= 0) return;
    stagingRejectsLeft--;
    levelUpChoices = getRandomUpgrades(CONFIG.UPGRADE_CHOICES);
    renderStagingUI();
  });
  rejectRow.appendChild(rejectBtn);
  container.appendChild(rejectRow);

  overlay.classList.add('visible');
}

function getStagingFileName(upgrade) {
  if (upgrade.type === 'skill') return `src/skills/${upgrade.id}.ts`;
  if (upgrade.type === 'evolution') return `src/evolutions/${upgrade.name.toLowerCase().replace(/\s/g, '_')}.ts`;
  if (upgrade.type === 'passive_item') return `src/items/${upgrade.id}.ts`;
  return `src/player/${upgrade.id}.ts`;
}

function getStagingDiff(upgrade, lvl, nextLvl, isEvo) {
  if (isEvo) {
    return `<span class="diff-add">+ import { ${upgrade.name} } from './evolved';</span>\n<span class="diff-del">- export const level = ${lvl};</span>\n<span class="diff-add">+ export const evolved = true;</span>\n<span class="diff-add">+ ${upgrade.getDescription()}</span>`;
  }
  if (upgrade.type === 'skill') {
    const def = SKILL_DEFS[upgrade.id];
    if (def) {
      const curr = def.getParams(Math.max(1, lvl));
      const next = def.getParams(nextLvl);
      let lines = `<span class="diff-ctx">  // ${upgrade.name} upgrade</span>\n`;
      if (curr.damage !== undefined && next.damage !== undefined) {
        lines += `<span class="diff-del">- damage: ${curr.damage},</span>\n<span class="diff-add">+ damage: ${next.damage},</span>\n`;
      }
      if (curr.cooldown !== undefined && next.cooldown !== undefined) {
        lines += `<span class="diff-del">- cooldown: ${curr.cooldown.toFixed(1)},</span>\n<span class="diff-add">+ cooldown: ${next.cooldown.toFixed(1)},</span>`;
      }
      return lines;
    }
  }
  // Generic passive
  return `<span class="diff-add">+ ${upgrade.name}: applied</span>\n<span class="diff-ctx">  // ${isEvo ? upgrade.getDescription() : upgrade.getDescription(nextLvl)}</span>`;
}

// ================================================================
// TASK-14 — Legacy Codebase: Tech Debt mechanic
// ================================================================
let techDebt = 0;
let refactoring = false;
let refactorTimer = 0;
const REFACTOR_DURATION = 30;

function getTechDebtMultiplier() {
  if (activeLocation !== 'legacy_codebase') return 1;
  return 1 + (techDebt / 100) * 0.5;
}

function updateLegacyMechanic(dt) {
  if (activeLocation !== 'legacy_codebase') return;

  if (refactoring) {
    refactorTimer -= dt;
    // Decrease debt evenly over refactor duration
    const debtPerSec = techDebt / Math.max(refactorTimer + 1, 1);
    techDebt = Math.max(0, techDebt - (100 / REFACTOR_DURATION) * dt);
    if (refactorTimer <= 0) {
      refactoring = false;
      techDebt = 0;
    }
  }
}

function showLegacyLevelUp() {
  levelUpActive = true;
  game.state = GameState.PAUSED;

  // Get normal upgrades then split into Quick Fix / Proper Solution pairs
  const baseUpgrades = getRandomUpgrades(CONFIG.UPGRADE_CHOICES);
  levelUpChoices = baseUpgrades.map(u => ({
    ...u,
    _legacyMode: 'proper', // default is Proper Solution
  }));

  renderLegacyUI();
}

function renderLegacyUI() {
  const overlay = document.getElementById('levelup-overlay');
  const container = document.getElementById('levelup-cards');
  const levelText = document.getElementById('levelup-level');

  levelText.innerHTML = `Level ${player.level} <span style="color:#8b949e;font-size:14px;">— Tech Debt: ${Math.round(techDebt)}/100</span>`;
  container.innerHTML = '';

  levelUpChoices.forEach((upgrade, idx) => {
    const lvl = getUpgradeLevel(upgrade.id);
    const nextLvl = lvl + 1;
    const isEvo = upgrade.type === 'evolution';

    const card = document.createElement('div');
    card.className = 'levelup-card';
    if (isEvo) card.classList.add('levelup-card-evo');

    let lvlText = '';
    if (upgrade.type === 'skill') lvlText = `Lv ${lvl} → ${nextLvl}`;
    else if (isEvo) lvlText = '★ EVOLUTION ★';

    // Quick Fix toggle (not for evolutions)
    let quickFixHtml = '';
    if (!isEvo) {
      const isQuick = upgrade._legacyMode === 'quick';
      quickFixHtml = `
        <div class="legacy-toggle">
          <button class="legacy-btn ${isQuick ? '' : 'active'}" data-idx="${idx}" data-mode="proper">&#10024; Proper</button>
          <button class="legacy-btn ${isQuick ? 'active' : ''}" data-idx="${idx}" data-mode="quick">&#128184; Quick Fix</button>
        </div>
        <div class="legacy-debt-info">${isQuick ? '+20 Tech Debt, x1.5 effect' : '+0 Tech Debt'}</div>
      `;
    }

    card.innerHTML = `
      <div class="levelup-emoji">${upgrade.emoji}</div>
      <div class="levelup-name">${upgrade.name}</div>
      <div class="levelup-desc">${isEvo ? upgrade.getDescription() : upgrade.getDescription(nextLvl)}</div>
      <div class="levelup-lvl">${lvlText}</div>
      ${quickFixHtml}
      <div class="levelup-key">${idx + 1}</div>
    `;

    // Toggle button listeners
    card.querySelectorAll('.legacy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.idx);
        levelUpChoices[i]._legacyMode = btn.dataset.mode;
        renderLegacyUI();
      });
    });

    card.addEventListener('click', () => selectLegacyUpgrade(idx));
    container.appendChild(card);
  });

  overlay.classList.add('visible');
}

function selectLegacyUpgrade(idx) {
  if (!levelUpActive || idx < 0 || idx >= levelUpChoices.length) return;
  const choice = levelUpChoices[idx];

  if (choice._legacyMode === 'quick') {
    techDebt = Math.min(100, techDebt + 20);
    // Apply 1.5x effect — apply upgrade then apply again at 0.5x
    // Simple approach: apply twice but second time is partial via direct stat boost
    if (choice.type === 'evolution') {
      applyEvolution(choice.evoId);
    } else {
      applyUpgrade(choice.id);
    }
    // Quick Fix bonus: extra stat boost
    applyQuickFixBonus(choice);
  } else {
    if (choice.type === 'evolution') {
      applyEvolution(choice.evoId);
    } else {
      applyUpgrade(choice.id);
    }
  }

  levelUpActive = false;
  document.getElementById('levelup-overlay').classList.remove('visible');
  game.state = GameState.PLAYING;
}

function applyQuickFixBonus(upgrade) {
  // Extra bonus for Quick Fix: +50% of the upgrade effect
  if (upgrade.type === 'skill' && SKILL_IDS.includes(upgrade.id)) {
    // Boost the skill's damage by a flat amount
    const skill = activeSkills[upgrade.id];
    if (skill) {
      // Temporary extra damage stored on player
      player.damageMult = (player.damageMult || 1) + 0.05;
    }
  } else if (upgrade.id === 'max_hp') {
    player.maxHp += 10;
    player.hp += 10;
  } else if (upgrade.id === 'move_speed') {
    player.speed += CONFIG.PLAYER_SPEED * 0.05;
  }
}

// Refactor key handler (R)
window.addEventListener('keydown', (e) => {
  if (activeLocation !== 'legacy_codebase') return;
  if (e.code === 'KeyR' && game.state === GameState.PLAYING) {
    if (refactoring) {
      // Cancel refactoring
      refactoring = false;
    } else if (techDebt > 0) {
      refactoring = true;
      refactorTimer = REFACTOR_DURATION;
    }
  }
});

// ================================================================
// Render location-specific HUD elements
// ================================================================
function renderLocationHUD() {
  if (activeLocation === 'legacy_codebase') {
    renderTechDebtBar();
    if (refactoring) renderRefactorOverlay();
  }
}

function renderTechDebtBar() {
  const barW = 140;
  const barH = 8;
  const barX = 16;
  const barY = 36; // below HP bar

  // Background
  ctx.fillStyle = '#21262d';
  ctx.fillRect(barX, barY, barW, barH);

  // Fill color based on debt level
  let debtColor;
  if (techDebt < 40) debtColor = '#3fb950';
  else if (techDebt < 70) debtColor = '#e3b341';
  else debtColor = '#f85149';

  ctx.fillStyle = debtColor;
  ctx.fillRect(barX, barY, barW * (techDebt / 100), barH);

  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#8b949e';
  ctx.font = '10px monospace';
  ctx.fillText(`Debt: ${Math.round(techDebt)} [R] refactor`, barX, barY + barH + 10);
}

function renderRefactorOverlay() {
  const pct = refactorTimer / REFACTOR_DURATION;
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(35, 134, 54, 0.08)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Progress bar at center
  const barW = 200;
  const barH = 12;
  const barX = (canvasWidth - barW) / 2;
  const barY = canvasHeight / 2 + 40;

  ctx.fillStyle = '#21262d';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#3fb950';
  ctx.fillRect(barX, barY, barW * (1 - pct), barH);
  ctx.strokeStyle = '#30363d';
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#3fb950';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('REFACTORING...', canvasWidth / 2, barY - 10);
  ctx.fillStyle = '#8b949e';
  ctx.font = '12px monospace';
  ctx.fillText(`${Math.ceil(refactorTimer)}s remaining — press R to cancel`, canvasWidth / 2, barY + barH + 16);
}

// ================================================================
// Hook into showLevelUpScreen — route to location-specific UI
// ================================================================
const _originalShowLevelUp = typeof showLevelUpScreen === 'function' ? showLevelUpScreen : null;

// This will be called from addXp() instead of showLevelUpScreen
function locationAwareLevelUp() {
  if (activeLocation === 'staging') {
    showStagingLevelUp();
  } else if (activeLocation === 'legacy_codebase') {
    showLegacyLevelUp();
  } else if (_originalShowLevelUp) {
    _originalShowLevelUp();
  }
}

// ================================================================
// Reset location state
// ================================================================
function resetLocationState() {
  stagingPrNumber = 0;
  stagingRejectsLeft = STAGING_MAX_REJECTS;
  techDebt = 0;
  refactoring = false;
  refactorTimer = 0;
}
