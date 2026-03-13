// ============================================================
// Bug.io — HUD, Death & Victory Screens (TASK-07 / TASK-08)
// ============================================================

function renderHUD() {
  const elapsed = game.elapsed;
  const min = Math.floor(elapsed / 60);
  const sec = Math.floor(elapsed % 60);
  const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

  // Timer (top center)
  ctx.fillStyle = CONFIG.TEXT;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(timeStr, canvasWidth / 2, 28);

  // HP bar (top left)
  const hpBarW = 180;
  const hpBarH = 14;
  const hpBarX = 16;
  const hpBarY = 16;
  const hpRatio = Math.max(0, player.hp / player.maxHp);

  if (typeof renderHUD._displayHp === 'undefined') renderHUD._displayHp = player.hp;
  renderHUD._displayHp += (player.hp - renderHUD._displayHp) * 0.15;
  const displayRatio = Math.max(0, renderHUD._displayHp / player.maxHp);

  ctx.fillStyle = CONFIG.HP_BG;
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);

  if (displayRatio > hpRatio) {
    ctx.fillStyle = '#f8514966';
    ctx.fillRect(hpBarX, hpBarY, hpBarW * displayRatio, hpBarH);
  }

  ctx.fillStyle = hpRatio > 0.3 ? CONFIG.HP_HIGH : CONFIG.HP_LOW;
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);
  ctx.strokeStyle = CONFIG.HP_BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

  ctx.textAlign = 'left';
  ctx.fillStyle = CONFIG.TEXT;
  ctx.font = '11px monospace';
  ctx.fillText(`HP ${Math.ceil(player.hp)}/${player.maxHp}`, hpBarX + 4, hpBarY + hpBarH - 3);

  // XP bar (bottom of screen)
  const xpBarW = canvasWidth - 32;
  const xpBarH = 8;
  const xpBarX = 16;
  const xpBarY = canvasHeight - 24;
  const xpRatio = player.xp / player.xpToNext;

  ctx.fillStyle = CONFIG.XP_BAR_BG;
  ctx.fillRect(xpBarX, xpBarY, xpBarW, xpBarH);
  ctx.fillStyle = CONFIG.XP_BAR_FILL;
  ctx.fillRect(xpBarX, xpBarY, xpBarW * xpRatio, xpBarH);
  ctx.strokeStyle = CONFIG.XP_BAR_BORDER;
  ctx.strokeRect(xpBarX, xpBarY, xpBarW, xpBarH);

  // Level indicator
  ctx.fillStyle = CONFIG.LEVEL_TEXT;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Lv ${player.level}`, canvasWidth / 2, xpBarY - 4);

  // Kill counter (top right)
  ctx.textAlign = 'right';
  ctx.fillStyle = CONFIG.KILL_TEXT;
  ctx.font = '14px monospace';
  ctx.fillText(`kills: ${killCount}`, canvasWidth - 16, 28);
  ctx.fillText(`enemies: ${enemies.length}`, canvasWidth - 16, 46);

  // Skill list (under HP bar)
  ctx.textAlign = 'left';
  ctx.font = '12px monospace';
  let skillY = hpBarY + hpBarH + 18;
  const skills = getAllActiveSkills();
  for (const skill of skills) {
    const def = SKILL_DEFS[skill.id];
    if (!def) continue;
    if (skill.evolved) {
      const evo = CONFIG.EVOLUTIONS[skill.evolved];
      ctx.fillStyle = evo.color;
      ctx.fillText(`${evo.emoji} ${evo.name} ★`, hpBarX, skillY);
    } else {
      ctx.fillStyle = getSkillColor(skill.id);
      ctx.fillText(`${def.emoji} ${def.name} Lv${skill.level}`, hpBarX, skillY);
    }
    skillY += 16;
  }

  // Passive items (show owned items)
  const passiveItemIds = Object.keys(CONFIG.PASSIVE_ITEMS);
  for (const pid of passiveItemIds) {
    if (typeof getUpgradeLevel === 'function' && getUpgradeLevel(pid) > 0) {
      const item = CONFIG.PASSIVE_ITEMS[pid];
      ctx.fillStyle = '#8b949e';
      ctx.fillText(`${item.emoji} ${item.name}`, hpBarX, skillY);
      skillY += 16;
    }
  }

  // Shield indicator
  const hrSkill = activeSkills['hot_reload'];
  if (hrSkill && hrSkill.shieldActive) {
    ctx.fillStyle = '#58a6ff';
    ctx.fillText('🛡️ Shield Active', hpBarX, skillY);
    skillY += 16;
  }

  // Container immunity indicator
  if (player._containerImmune) {
    ctx.fillStyle = CONFIG.EVOLUTIONS.container.color;
    ctx.fillText('📦 IMMUNE', hpBarX, skillY);
    skillY += 16;
  }

  // BSOD slow indicator
  if (player._bsodSlowTimer > 0) {
    ctx.fillStyle = '#0078d4';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ BSOD — SLOWED', canvasWidth / 2, 60);
  }

  // Slow field indicator
  if (player._slowedByField) {
    ctx.fillStyle = '#8b949e';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ Deprecated — Slowed', canvasWidth / 2, player._bsodSlowTimer > 0 ? 80 : 60);
  }
}

function getSkillColor(id) {
  switch (id) {
    case 'console_log': return CONFIG.SKILL_CONSOLE_LOG.color;
    case 'git_push': return CONFIG.SKILL_GIT_PUSH.color;
    case 'npm_install': return CONFIG.SKILL_NPM_INSTALL.color;
    case 'stack_trace': return CONFIG.SKILL_STACK_TRACE.color;
    case 'hot_reload': return CONFIG.SKILL_HOT_RELOAD.color;
    case '404_not_found': return CONFIG.SKILL_404.color;
    case 'sql_query': return CONFIG.SKILL_SQL_QUERY.color;
    case 'docker': return CONFIG.SKILL_DOCKER.color;
    case 'exploit': return CONFIG.SKILL_EXPLOIT.color;
    default: return CONFIG.TEXT;
  }
}

// --- Victory check ---
function checkVictory() {
  if (game.elapsed >= CONFIG.WIN_TIME) {
    game.state = GameState.VICTORY;
    showEndScreen(true);
  }
}

// --- Death handling ---
function handleDeath() {
  if (game.state === GameState.GAMEOVER) {
    showEndScreen(false);
  }
}

let endScreenShown = false;

function showEndScreen(victory) {
  if (endScreenShown) return;
  endScreenShown = true;

  const overlay = document.getElementById('end-overlay');
  const title = document.getElementById('end-title');
  const stats = document.getElementById('end-stats');

  const elapsed = game.elapsed;
  const min = Math.floor(elapsed / 60);
  const sec = Math.floor(elapsed % 60);
  const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  const commits = calculateCommits(elapsed, bossesKilledThisRun);

  // Award commits and save stats
  addCommits(commits);
  const evoCount = Object.keys(typeof evolvedSkills !== 'undefined' ? evolvedSkills : {}).length;
  updateStats({
    kills: killCount,
    minutes: min,
    bossesKilled: bossesKilledThisRun,
    victory,
    level: player.level,
    evolutionsUsed: evoCount,
    killsByType: typeof killsByType !== 'undefined' ? killsByType : {},
  });

  // Check quests after stats are saved
  if (typeof checkAllQuests === 'function') checkAllQuests();

  if (victory) {
    title.textContent = '🎉 VICTORY';
    title.style.color = '#7ee787';
  } else {
    title.textContent = '💀 GAME OVER';
    title.style.color = '#f85149';
  }

  // Build stats HTML with animated commit counter
  stats.innerHTML = `
    <div class="end-stat"><span>Time survived</span><span>${timeStr}</span></div>
    <div class="end-stat"><span>Enemies killed</span><span>${killCount}</span></div>
    <div class="end-stat"><span>Level reached</span><span>${player.level}</span></div>
    <div class="end-stat"><span>Commits earned</span><span id="end-commits-count">0</span></div>
    <div class="end-stat" style="border-bottom:none;margin-top:4px;"><span>Total Commits</span><span style="color:#7ee787;">${getCommits()}</span></div>
  `;

  // Animate commit counter
  const commitEl = document.getElementById('end-commits-count');
  if (commitEl && commits > 0) {
    let current = 0;
    const step = Math.max(1, Math.floor(commits / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, commits);
      commitEl.textContent = '+' + current;
      if (current >= commits) clearInterval(interval);
    }, 30);
  } else if (commitEl) {
    commitEl.textContent = '+0';
  }

  setTimeout(() => {
    overlay.classList.add('visible');
  }, victory ? 100 : 600);
}

function restartGame() {
  // Reset player
  player.x = CONFIG.MAP_WIDTH / 2;
  player.y = CONFIG.MAP_HEIGHT / 2;
  player.hp = CONFIG.PLAYER_MAX_HP;
  player.maxHp = CONFIG.PLAYER_MAX_HP;
  player.speed = CONFIG.PLAYER_SPEED;
  player.level = 1;
  player.xp = 0;
  player.xpToNext = xpToNextLevel(1);
  player.dirX = 0;
  player.dirY = 1;
  player._bsodSlowTimer = 0;
  player._slowedByField = false;
  player._containerImmune = false;
  player.critChance = 0;
  player.cooldownMult = 1;
  player.aoeRadiusMult = 1;
  player.damageMult = 1;

  // Reset game state
  game.state = GameState.PLAYING;
  game.elapsed = 0;
  game.lastTime = 0;

  // Clear arrays
  enemies.length = 0;
  projectiles.length = 0;
  xpGems.length = 0;
  damageNumbers.length = 0;

  // Reset systems
  killCount = 0;
  bossesKilledThisRun = 0;
  for (const key in killsByType) delete killsByType[key];
  playerIframeTimer = 0;
  playerHitFlash = 0;
  endScreenShown = false;
  spawner.timer = 0;
  spawner.waveNumber = 0;
  spawner.unlockedTypes = 1;
  spawner.eliteTimer = 0;

  // Reset boss
  bossState.active = null;
  bossState.nextSpawnTime = CONFIG.BOSS.spawnInterval;
  bossState.warningTimer = 0;
  bossState.warningShown = false;
  bossState.aoeTimer = 0;
  bossState.aoeWarningTimer = 0;
  bossState.aoeActive = null;
  const bossBar = document.getElementById('boss-hp-bar');
  if (bossBar) bossBar.classList.remove('visible');

  // Reset skills
  resetSkills();
  addSkill('console_log');

  // Reset upgrades
  for (const key in upgradeLevels) delete upgradeLevels[key];
  upgradeLevels['console_log'] = 1;

  // Reset evolutions
  for (const key in evolvedSkills) delete evolvedSkills[key];

  // Reset location state
  if (typeof resetLocationState === 'function') resetLocationState();

  // Reset HUD animation
  renderHUD._displayHp = CONFIG.PLAYER_MAX_HP;

  // Hide overlays
  document.getElementById('end-overlay').classList.remove('visible');
  document.getElementById('levelup-overlay').classList.remove('visible');
  document.getElementById('pause-overlay').classList.remove('visible');
  const heroOverlay = document.getElementById('hero-select-overlay');
  if (heroOverlay) heroOverlay.classList.remove('visible');
  const metaOverlay = document.getElementById('meta-overlay');
  if (metaOverlay) metaOverlay.classList.remove('visible');
}
