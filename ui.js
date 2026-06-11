/* ============================
   ui.js - UI渲染与交互层（月/周制）
   特典: 逐偶像会话结算
   ============================ */

const UI = (() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const screens = { title:$('#screen-title'), charSelect:$('#screen-char-select'), game:$('#screen-game'), settle:$('#screen-settle'), ending:$('#screen-ending') };

  function showScreen(name) { Object.values(screens).forEach(s => s.classList.remove('active')); screens[name].classList.add('active'); }
  function showToast(msg) {
    let toast = $('#toast-msg');
    if (!toast) { toast = document.createElement('div'); toast.id = 'toast-msg'; toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:12px 24px;background:rgba(255,71,87,.9);color:#fff;border-radius:8px;font-size:14px;z-index:300;opacity:0;transition:opacity .3s;pointer-events:none;font-family:var(--font);'; document.body.appendChild(toast); }
    toast.textContent = msg; toast.style.opacity = '1'; setTimeout(() => { toast.style.opacity = '0'; }, 2000);
  }

  // ==================== 标题屏 / 角色选择 ====================
  let selectedChar = null;
  let playerName = '';
  function initTitle() { $('#btn-start').addEventListener('click', () => showScreen('charSelect')); }
  function initCharSelect() {
    $$('.char-card').forEach(card => { card.addEventListener('click', () => { $$('.char-card').forEach(c => c.classList.remove('selected')); card.classList.add('selected'); selectedChar = card.dataset.char; $('#btn-char-confirm').disabled = false; }); });
    $('#btn-char-confirm').addEventListener('click', () => {
      if (!selectedChar) return;
      const nameInput = $('#input-player-name');
      const name = (nameInput && nameInput.value) ? nameInput.value.trim() : '';
      if (!name) { showToast('请输入你的昵称'); nameInput && nameInput.focus(); return; }
      if (name.length < 2) { showToast('昵称至少2个字符'); nameInput && nameInput.focus(); return; }
      playerName = name;
      try {
        if (typeof Game === 'undefined') throw new Error('Game未定义');
        Game.initState(selectedChar, playerName);
        Game.startMonth(); renderGameScreen(); showScreen('game'); handleNodeEventPopup();
      } catch(e) { showToast('错误: '+e.message); console.error(e); }
    });
  }

  // ==================== 主面板 ====================
  let currentPhase = 'week_decision';
  let tokutenEditingIdol = null;
  let tokutenEditTicketCount = 1;

  function renderGameScreen() {
    const s = Game.getState();
    updateTopBar(s); updateMonthInfo(s); updateEventLog(s); updateKnownIdols(s); updatePlayerTags(s);
    renderMethodCards(s); renderTokutenIdolGrid(s); renderCheerTargets(s);
    resetTokutenEdit(); hideTokutenConfigPanel(); renderTokutenSelectionsBar(s);
    $$('.choice-card').forEach(c => c.classList.remove('selected'));
    setPhase('week_decision'); updateSummary(s);
  }

  function updateTopBar(s) {
    const nameEl = $('#player-name-display');
    if (nameEl) nameEl.textContent = s.playerName || '';
    $('#turn-num').textContent = s.turn; $('#week-num').textContent = s.week;
    const ecoEl = $('#stat-val-economy'); if (ecoEl) ecoEl.textContent = s.economy;
    const ecoBar = $('#stat-bar-economy'); if (ecoBar) {
      const ecoPct = Math.min(100, (s.economy / 8000) * 100);
      ecoBar.style.width = ecoPct + '%';
      ecoBar.style.background = s.economy < 1000 ? 'linear-gradient(90deg, var(--red), #ff6b6b)' : 'linear-gradient(90deg, var(--primary-1), var(--gold))';
    }
    const moodEl = $('#stat-val-mood'); if (moodEl) moodEl.textContent = s.mood;
    const moodBar = $('#stat-bar-mood'); if (moodBar) {
      moodBar.style.width = s.mood + '%';
      moodBar.style.background = s.mood < 25 ? 'linear-gradient(90deg, var(--red), #ff6b6b)' : 'linear-gradient(90deg, var(--primary-1), var(--primary-3))';
    }
  }
  function updateMonthInfo(s) {
    const config = CHARACTER_CONFIGS[s.character]; if (!config) return;
    const recEl = $('#rec-economy'); if (recEl) recEl.textContent = '+' + Math.round(config.economy.recovery * s.modifiers.economyRecoveryMod);
    const drainEl = $('#drain-mood'); if (drainEl) drainEl.textContent = '-' + Math.round(config.mood.monthlyDrain * s.modifiers.moodDrainMod);
  }
  function updateEventLog(s) {
    const log = $('#event-log'); if (!log) return;
    if (s.eventLog.length === 0) { log.innerHTML = '<p class="log-empty">尚无事件记录</p>'; return; }
    log.innerHTML = ''; s.eventLog.slice(-10).forEach(entry => { const div = document.createElement('div'); div.className = 'log-entry'; div.innerHTML = `<span class="log-turn">第${entry.turn}月</span> ${entry.name}`; log.appendChild(div); }); log.scrollTop = log.scrollHeight;
  }
  function updateKnownIdols(s) {
    const list = $('#known-idols-list'); if (!list) return;
    const entries = Object.entries(s.cutCounts || {}).filter(([,c]) => c > 0);
    if (entries.length === 0) { list.innerHTML = '<p class="log-empty">尚未购买特典券</p>'; return; }
    list.innerHTML = '';
    entries.sort((a, b) => b[1] - a[1]);
    entries.forEach(([idolId, count]) => {
      const idol = s.idols.find(i => i.id === idolId);
      const b = document.createElement('span'); b.className = 'known-idol-badge';
      b.innerHTML = `${idol ? idol.emoji : ''} ${idol ? idol.name : idolId} <small>${count}张</small>`;
      list.appendChild(b);
    });
  }
  function updatePlayerTags(s) {
    const container = $('#player-tags'), emptyText = $('#player-tags-empty');
    if (!container) return;
    const tags = (s.playerTags || []).filter(t => !t.hidden);
    if (tags.length === 0) { container.style.display = 'none'; if (emptyText) emptyText.style.display = 'block'; return; }
    if (emptyText) emptyText.style.display = 'none';
    container.style.display = 'flex'; container.innerHTML = '';
    tags.forEach(tag => {
      const def = (PLAYER_TAG_DEFS && PLAYER_TAG_DEFS[tag.id]) || {};
      const tooltipParts = [tag.desc || ''];
      if (def.onTick) { const p = []; if (def.onTick.economy) p.push('经济'+(def.onTick.economy>0?'+':'')+def.onTick.economy); if (def.onTick.mood) p.push('心情'+(def.onTick.mood>0?'+':'')+def.onTick.mood); if (p.length) tooltipParts.push('每周:'+p.join(' ')); }
      if (def.modifiers) { const p = []; for (const [k, v] of Object.entries(def.modifiers)) { const l = MODIFIER_LABELS[k] || k; if (k.endsWith('Mult')) p.push(l+'×'+v.toFixed(2)); else if (k.endsWith('Add')) p.push(l+(v>0?'+':'')+(v*100).toFixed(0)+'%'); } if (p.length) tooltipParts.push('效果:'+p.join(' ')); }
      const badge = document.createElement('span'); badge.className = 'player-tag-badge'; badge.title = tooltipParts.join('\n');
      badge.innerHTML = `${tag.icon} ${tag.name} <span class="tag-turn">${tag.turn === -1 ? '一次性' : tag.turn+'周'}</span>`;
      container.appendChild(badge);
    });
  }

  // ==================== 特典编辑（仅购券张数） ====================
  function resetTokutenEdit() { tokutenEditingIdol = null; tokutenEditTicketCount = 1; }
  function hideTokutenConfigPanel() { const p = $('#tokuten-config-panel'); if (p) p.style.display = 'none'; $$('.tokuten-idol-card.editing').forEach(c => c.classList.remove('editing')); resetTokutenEdit(); }
  function showTokutenConfigPanel(idolId) {
    const s = Game.getState(); const idol = s.idols.find(i => i.id === idolId); if (!idol) return;
    tokutenEditingIdol = idolId; tokutenEditTicketCount = 1;
    const existing = s.choices.tokutenSelections.find(sel => sel.idolId === idolId);
    if (existing) tokutenEditTicketCount = existing.ticketCount || 1;
    $('#tokuten-config-idol-name').textContent = idol.emoji + ' ' + idol.name;
    $('#tokuten-config-panel').style.display = 'block';
    updateTicketCountDisplay();
    $$('.tokuten-idol-card').forEach(c => c.classList.remove('editing'));
    const card = document.querySelector(`.tokuten-idol-card[data-idol-id="${idolId}"]`);
    if (card) card.classList.add('editing');
  }
  function updateTicketCountDisplay() {
    $('#ticket-count-display').textContent = tokutenEditTicketCount;
    const r = calcTicketEffect(tokutenEditTicketCount); $('#ticket-cost-preview').textContent = '经济-' + Math.abs(r.economy);
  }
  function addTokutenSelection() {
    if (!tokutenEditingIdol) { showToast('请先选择偶像和券张数'); return; }
    const s = Game.getState();
    s.choices.tokutenSelections = s.choices.tokutenSelections.filter(sel => sel.idolId !== tokutenEditingIdol);
    s.choices.tokutenSelections.push({ idolId: tokutenEditingIdol, ticketCount: tokutenEditTicketCount });
    hideTokutenConfigPanel(); renderTokutenIdolGrid(s); renderTokutenSelectionsBar(s); updateSummary(s);
  }

  // ==================== 偶像网格 / 已配置列表 ====================
  function renderTokutenIdolGrid(s) {
    const container = $('#tokuten-idol-grid'); if (!container) return; container.innerHTML = '';
    s.idols.forEach(idol => {
      const blocked = isIdolBlocked(idol);
      const sel = s.choices.tokutenSelections.find(x => x.idolId === idol.id);
      // 被 block 的偶像：清除已有的选择
      if (blocked && sel) s.choices.tokutenSelections = s.choices.tokutenSelections.filter(x => x.idolId !== idol.id);
      const isEditing = tokutenEditingIdol === idol.id;
      const card = document.createElement('div');
      card.className = 'tokuten-idol-card' + (sel ? ' configured' : '') + (isEditing ? ' editing' : '') + (blocked ? ' blocked' : '');
      card.dataset.idolId = idol.id;
      card.innerHTML = `<div class="tokuten-idol-emoji">${idol.emoji}</div><div class="tokuten-idol-name">${idol.name}</div>${blocked ? '<div class="tokuten-idol-tag blocked-tag">🚫</div>' : ''}${!blocked && sel ? `<div class="tokuten-idol-tag">🎫×${sel.ticketCount}</div>` : ''}<div class="tokuten-idol-check">${sel ? '✓' : ''}</div>`;
      if (!blocked) card.addEventListener('click', () => showTokutenConfigPanel(idol.id));
      container.appendChild(card);
    });
  }
  function renderTokutenSelectionsBar(s) {
    const bar = $('#tokuten-selections-bar'); if (!bar) return;
    const sels = s.choices.tokutenSelections;
    if (sels.length === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex'; bar.innerHTML = '<span class="tokuten-sel-label">已配置：</span>';
    sels.forEach(sel => {
      const idol = s.idols.find(i => i.id === sel.idolId);
      const chip = document.createElement('div'); chip.className = 'tokuten-sel-chip';
      chip.innerHTML = `${idol ? idol.emoji : ''} ${idol ? idol.name : ''} 🎫×${sel.ticketCount} <span class="tokuten-sel-remove">✕</span>`;
      chip.querySelector('.tokuten-sel-remove').addEventListener('click', e => { e.stopPropagation(); s.choices.tokutenSelections = s.choices.tokutenSelections.filter(x => x.idolId !== sel.idolId); hideTokutenConfigPanel(); renderTokutenIdolGrid(s); renderTokutenSelectionsBar(s); updateSummary(s); });
      chip.addEventListener('click', () => showTokutenConfigPanel(sel.idolId)); bar.appendChild(chip);
    });
  }

  // ★ 动态渲染参与方式卡片
  function renderMethodCards(s) {
    const container = $('#method-cards'); if (!container) return;
    container.innerHTML = '';
    const available = getAvailableParticipation(s);
    for (const [key, m] of Object.entries(available)) {
      const card = document.createElement('div');
      card.className = 'choice-card';
      card.dataset.method = key;
      if (s.choices.participationMethod === key) card.classList.add('selected');
      card.innerHTML = `
        <div class="choice-icon">${m.emoji}</div><h4>${m.name}</h4>
        <p class="choice-cost">经济-${m.cost.economy}</p><p class="choice-effect">心情${m.effect.mood >= 0 ? '+' : ''}${m.effect.mood}</p>
        ${m.skipTokuten ? '<p class="choice-hint">不进入特典环节</p>' : ''}
      `;
      card.addEventListener('click', () => {
        const st = Game.getState(); if (!m) return;
        if (st.economy < m.cost.economy) { showToast('经济不足'); return; }
        st.choices.participationMethod = key; st.choices.cheerTargetIds = [];
        renderMethodCards(st); renderCheerTargets(st); updateSummary(st);
        if (m.skipTokuten) { st.choices.tokutenSelections = []; }
        else { setPhase('week_tokuten'); renderTokutenIdolGrid(st); renderTokutenSelectionsBar(st); hideTokutenConfigPanel(); }
      });
      container.appendChild(card);
    }
  }

  // ==================== 应援切偶像 ====================
  function renderCheerTargets(s) {
    const section = $('#cheer-targets-section'), grid = $('#cheer-targets-grid'); if (!section || !grid) return;
    if (s.choices.participationMethod !== 'cheer' || s.knownIdols.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block'; grid.innerHTML = '';
    s.knownIdols.forEach(k => {
      const idol = s.idols.find(i => i.id === k.idolId);
      const blocked = idol && isIdolBlocked(idol);
      const selected = s.choices.cheerTargetIds.includes(k.idolId);
      const card = document.createElement('div');
      card.className = 'tokuten-idol-card' + (selected ? ' configured' : '') + (blocked ? ' blocked' : '');
      card.innerHTML = `<div class="tokuten-idol-emoji">${k.emoji}</div><div class="tokuten-idol-name">${k.name}</div>${blocked ? '<div class="tokuten-idol-tag blocked-tag">🚫</div>' : ''}<div class="tokuten-idol-check">${selected ? '✓' : ''}</div>`;
      if (!blocked) card.addEventListener('click', () => { const idx = s.choices.cheerTargetIds.indexOf(k.idolId); if (idx >= 0) s.choices.cheerTargetIds.splice(idx, 1); else s.choices.cheerTargetIds.push(k.idolId); renderCheerTargets(s); updateSummary(s); });
      grid.appendChild(card);
    });
  }

  // ==================== 阶段管理 ====================
  function setPhase(phase) {
    currentPhase = phase;
    $('#action-step-decide').classList.remove('active'); $('#action-step-method').classList.remove('active'); $('#action-step-tokuten').classList.remove('active');
    if (phase === 'week_decision') $('#action-step-decide').classList.add('active');
    else if (phase === 'week_method') $('#action-step-method').classList.add('active');
    else if (phase === 'week_tokuten') $('#action-step-tokuten').classList.add('active');
    $$('.phase-dot').forEach(d => { d.classList.remove('active','completed'); if (d.dataset.phase === phase || (phase === 'week_tokuten' && d.dataset.phase === 'week_tokuten')) d.classList.add('active'); else if (phase === 'week_tokuten' && (d.dataset.phase === 'week_decision' || d.dataset.phase === 'week_method')) d.classList.add('completed'); else if (phase === 'week_method' && d.dataset.phase === 'week_decision') d.classList.add('completed'); });
    $('#btn-prev-phase').style.display = phase === 'week_decision' ? 'none' : 'inline-flex';
    $('#btn-confirm-week').textContent = phase === 'week_tokuten' ? '确认行动' : '下一步';
  }

  function updateSummary(s) {
    const cost = Game.calcWeekCost(); if (!cost) return;
    const ecoEl = $('#sum-cost-economy'); const moodEl = $('#sum-gain-mood');
    if (cost.skip) { if (ecoEl) ecoEl.textContent = '0'; if (moodEl) moodEl.textContent = '-2'; }
    else { if (ecoEl) ecoEl.textContent = '-' + cost.economy; if (moodEl) moodEl.textContent = (cost.mood >= 0 ? '+' : '') + cost.mood; }
    updateModifierHint(s);
  }
  function updateModifierHint(s) {
    const el = $('#sum-modifier-hint'); if (!el) return;
    const mods = collectPlayerModifiers(s); const parts = [];
    if ((mods.tokutenMoodMult || 1) !== 1) parts.push('心情×'+mods.tokutenMoodMult.toFixed(2));
    if ((mods.tokutenEconomyMult || 1) !== 1) parts.push('消费×'+mods.tokutenEconomyMult.toFixed(2));
    if ((mods.tokutenEventChanceAdd || 0) !== 0) parts.push('事件+'+((mods.tokutenEventChanceAdd||0)*100).toFixed(0)+'%');
    el.style.display = parts.length ? 'block' : 'none';
    if (parts.length) el.textContent = '🏷️ ' + parts.join(' | ');
  }

  // ==================== 事件绑定 ====================
  function initGamePanel() {
    $$('#action-step-decide .choice-card').forEach(card => { card.addEventListener('click', () => { const s = Game.getState(); s.choices.participate = card.dataset.participate === 'yes'; $$('#action-step-decide .choice-card').forEach(c => c.classList.remove('selected')); card.classList.add('selected'); if (s.choices.participate) { renderMethodCards(s); setPhase('week_method'); } updateSummary(s); }); });

    const tMinus = $('#btn-ticket-minus'); if (tMinus) tMinus.addEventListener('click', () => { if (tokutenEditTicketCount > 1) { tokutenEditTicketCount--; updateTicketCountDisplay(); updateSummary(Game.getState()); } });
    const tPlus = $('#btn-ticket-plus'); if (tPlus) tPlus.addEventListener('click', () => { if (tokutenEditTicketCount < 99) { tokutenEditTicketCount++; updateTicketCountDisplay(); updateSummary(Game.getState()); } });
    const tAdd = $('#btn-add-tokuten'); if (tAdd) tAdd.addEventListener('click', () => addTokutenSelection());

    const btnPrev = $('#btn-prev-phase'); if (btnPrev) btnPrev.addEventListener('click', () => {
      const s = Game.getState();
      if (currentPhase === 'week_tokuten') { setPhase('week_method'); s.choices.tokutenSelections = []; hideTokutenConfigPanel(); renderTokutenSelectionsBar(s); renderTokutenIdolGrid(s); updateSummary(s); }
      else if (currentPhase === 'week_method') { setPhase('week_decision'); s.choices.participationMethod = null; s.choices.cheerTargetIds = []; s.choices.tokutenSelections = []; renderMethodCards(s); $('#cheer-targets-section').style.display = 'none'; updateSummary(s); }
    });
    const btnWeek = $('#btn-confirm-week'); if (btnWeek) btnWeek.addEventListener('click', () => confirmWeek());
  }

  // ★ 处理节点事件弹窗
  function handleNodeEventPopup() {
    const gs = Game.getState();
    if (gs._nodeEvent && gs._nodeEvent.choices) {
      showChoicePopup(gs._nodeEvent).then(() => { gs.turnEvents.push(gs._nodeEvent); });
    }
  }

  // ==================== 确认本周 → 逐偶像会话 ====================
  async function confirmWeek() {
    const s = Game.getState(), c = s.choices;
    if (c.participate === null) { showToast('请选择本周是否参加偶活'); setPhase('week_decision'); return; }
    if (c.participate) {
      if (!c.participationMethod) { showToast('请选择参与方式'); setPhase('week_method'); return; }
      const m = PARTICIPATION_METHODS[c.participationMethod];
      if (!m.skipTokuten && c.tokutenSelections.length === 0) { showToast('请至少为一位偶像配置特典'); setPhase('week_tokuten'); return; }
    }
    const cost = Game.calcWeekCost();
    if (c.participate && !cost.affordable) { showToast('经济不足，无法执行此行动！'); return; }

    Game.processWeek();

    // ★ 节点事件弹窗（preTokuten / postTicket 中的 choices 类型）
    const st = Game.getState();
    if (st._nodeEvent && st._nodeEvent.choices) {
      await showChoicePopup(st._nodeEvent);
      Game.getState().turnEvents.push(st._nodeEvent);
    }

    // ★ 逐偶像处理会话（endRound 时跳过）
    const interactions = Game.getState()._tokutenInteractions || [];
    if (!st._nodeEvent || !st._nodeEvent.endRound) {
      for (const inter of interactions) { await showConversation(inter); }
    }

    // 特典事件弹窗（含 choices 分支）—— 在会话之后展示
    const tokutenEvts = Game.getState()._tokutenEvents || [];
    for (const tevt of tokutenEvts) {
      if (tevt.choices) await showChoicePopup(tevt);
      else await showEventPopup(tevt);
    }

    updateTopBar(Game.getState()); updateEventLog(Game.getState()); updateKnownIdols(Game.getState()); updatePlayerTags(Game.getState());

    const nextResult = Game.nextWeek();
    if (nextResult.monthEnded) {
      if (nextResult.events && nextResult.events.length > 0) {
        for (const evt of nextResult.events) {
          if (evt.choices) await showChoicePopup(evt); else await showEventPopup(evt);
        }
        updateTopBar(Game.getState()); updateEventLog(Game.getState()); updatePlayerTags(Game.getState());
      }
      if (nextResult.gameOver) { showEndingScreen(); return; }
      showSettleScreen();
    } else {
      handleNodeEventPopup();
      await showWeekTransition(Game.getState()); renderGameScreen();
    }
  }

  // ★ 偶像会话弹窗
  function showConversation(inter) {
    return new Promise(resolve => {
      const overlay = $('#overlay-conversation');
      const interaction = inter.interaction;
      const idolInfo = `${inter.idolEmoji} ${inter.idolName} · 🎫×${inter.ticketResult.ticketCount}`;
      const s = Game.getState();

      $('#conv-idol-info').textContent = idolInfo;
      $('#conv-text').textContent = resolveText(interaction.data.text || '', s);
      $('#conv-effects').innerHTML = '';
      $('#btn-conv-continue').style.display = 'none';

      const choicesDiv = $('#conv-choices'); choicesDiv.innerHTML = '';

      if (interaction.type === 'special_event' && interaction.data.choices) {
        // 特殊事件：使用事件专属选择分支
        interaction.data.choices.forEach((choice, idx) => {
          const btn = document.createElement('button');
          btn.className = 'neon-btn choice-option-btn';
          btn.textContent = choice.text;
          btn.addEventListener('click', () => {
            const result = Game.applyTokutenInteraction(inter, idx, null);
            if (choice.desc) showToast(choice.desc);
            overlay.classList.remove('active');
            if (result) showInteractionEffects(result);
            resolve();
          });
          choicesDiv.appendChild(btn);
        });
      } else {
        // 特殊会话/普通会话：展示玩家聊天选项
        const availableChats = getAvailableChats(s.playerTags);
        availableChats.forEach((chat, idx) => {
          const btn = document.createElement('button');
          btn.className = 'neon-btn choice-option-btn';
          btn.textContent = chat.text;
          if (chat.requiredTag) {
            const hint = document.createElement('span');
            hint.style.cssText = 'font-size:10px;color:var(--gold);display:block';
            hint.textContent = '(标签解锁)';
            btn.appendChild(hint);
          }
          btn.addEventListener('click', () => {
            const result = Game.applyTokutenInteraction(inter, null, idx);
            showToast(chat.desc || '');
            overlay.classList.remove('active');
            if (result) showInteractionEffects(result);
            resolve();
          });
          choicesDiv.appendChild(btn);
        });
      }

      overlay.classList.add('active');
    });
  }

  function showInteractionEffects(result) {
    const e = result.effect, ie = result.idolEffect;
    if (!e && !ie) return;
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:200;pointer-events:none;animation:floatUp 1.5s ease-out forwards';
    if (e && e.mood) { const s = document.createElement('span'); s.className = 'effect-tag ' + (e.mood > 0 ? 'positive' : 'negative'); s.textContent = '💖 ' + (e.mood > 0 ? '+' : '') + e.mood; div.appendChild(s); }
    if (ie && ie.affection) { const s = document.createElement('span'); s.className = 'effect-tag positive'; s.textContent = '💕 好感' + (ie.affection > 0 ? '+' : '') + ie.affection; div.appendChild(s); }
    if (ie && ie.awareness) { const s = document.createElement('span'); s.className = 'effect-tag positive'; s.textContent = '💡 意愿' + (ie.awareness > 0 ? '+' : '') + ie.awareness; div.appendChild(s); }
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1600);
  }

  // ==================== 通用弹窗 ====================
  function showEventPopup(evt) {
    return new Promise(resolve => {
      const overlay = $('#overlay-event');
      $('#event-icon').textContent = evt.icon || '📢'; $('#event-title').textContent = evt.name;
      $('#event-desc').textContent = resolveText(evt.desc, Game.getState());
      const effectsDiv = $('#event-effects'); effectsDiv.innerHTML = '';
      if (evt.effect) {
        if (evt.effect.economy) { const t = document.createElement('span'); t.className = 'effect-tag ' + (evt.effect.economy > 0 ? 'positive' : 'negative'); t.textContent = '💰 ' + (evt.effect.economy > 0 ? '+' : '') + evt.effect.economy; effectsDiv.appendChild(t); }
        if (evt.effect.mood) { const t = document.createElement('span'); t.className = 'effect-tag ' + (evt.effect.mood > 0 ? 'positive' : 'negative'); t.textContent = '💖 ' + (evt.effect.mood > 0 ? '+' : '') + evt.effect.mood; effectsDiv.appendChild(t); }
      }
      if (evt.grantTag || evt.grantTags) {
        const ids = evt.grantTags || (evt.grantTag ? [evt.grantTag] : []);
        ids.forEach(tagId => { const def = (PLAYER_TAG_DEFS&&PLAYER_TAG_DEFS[tagId]) || (IDOL_TAG_DEFS&&IDOL_TAG_DEFS[tagId]); if (def) { const t = document.createElement('span'); t.className = 'effect-tag tag-award'; t.textContent = '🏷️ '+def.icon+def.name; effectsDiv.appendChild(t); } });
      }
      overlay.classList.add('active'); const btn = $('#btn-event-continue'); const h = () => { overlay.classList.remove('active'); btn.removeEventListener('click', h); resolve(); }; btn.addEventListener('click', h);
    });
  }
  function showChoicePopup(evt) {
    return new Promise(resolve => {
      const overlay = $('#overlay-choice');
      $('#choice-icon').textContent = evt.icon || '📢'; $('#choice-title').textContent = evt.name;
      $('#choice-desc').textContent = resolveText(evt.desc, Game.getState());
      const optionsDiv = $('#choice-options'); optionsDiv.innerHTML = '';
      evt.choices.forEach((choice, idx) => { const btn = document.createElement('button'); btn.className = 'neon-btn choice-option-btn'; btn.textContent = choice.text; btn.addEventListener('click', () => { const r = Game.applyChoiceEvent(evt, idx); if (r && r.desc) showToast(r.desc); overlay.classList.remove('active'); resolve(); }); optionsDiv.appendChild(btn); });
      overlay.classList.add('active');
    });
  }
  function showWeekTransition(s) {
    return new Promise(resolve => {
      const div = document.createElement('div'); div.className = 'week-transition';
      div.innerHTML = `<div class="week-transition-card"><div class="week-transition-icon">📅</div><h3>第${s.turn}月 · 第${s.week}周 结束</h3><div class="week-transition-stats"><span>💰 ${s.economy}</span><span>💖 ${s.mood}</span></div></div>`;
      document.body.appendChild(div); setTimeout(() => { div.classList.add('fade-out'); setTimeout(() => { div.remove(); resolve(); }, 400); }, 800);
    });
  }

  // ==================== 结算屏 / 结局屏 ====================
  function showSettleScreen() {
    const s = Game.getState(); const prev = s.prevStats || { economy: 0, mood: 0 };
    const ecoDelta = s.economy - prev.economy, moodDelta = s.mood - prev.mood;
    $('#settle-economy').textContent = s.economy; renderDelta('settle-economy-delta', ecoDelta);
    $('#settle-mood').textContent = s.mood; renderDelta('settle-mood-delta', moodDelta);
    const list = $('#settle-event-list'); list.innerHTML = '';
    s.turnEvents.forEach(evt => { const li = document.createElement('li'); li.textContent = `${evt.icon} ${evt.name} - ${evt.desc}`; list.appendChild(li); });
    if (s.turnEvents.length === 0) list.innerHTML = '<li>本月无特殊事件</li>';
    $('#btn-next-month').textContent = s.turn >= TOTAL_MONTHS ? '查看结局' : '进入下月';
    showScreen('settle');
  }
  function renderDelta(elId, delta) { const el = $('#'+elId); if (delta > 0) { el.textContent = '+'+delta; el.className = 'settle-delta positive'; } else if (delta < 0) { el.textContent = ''+delta; el.className = 'settle-delta negative'; } else { el.textContent = ''; el.className = 'settle-delta'; } }

  function initSettle() { $('#btn-next-month').addEventListener('click', () => { const r = Game.nextMonth(); if (r.ended) showEndingScreen(); else { renderGameScreen(); showScreen('game'); } }); }

  function showEndingScreen() {
    const s = Game.getState(), ending = Game.determineEnding();
    $('#ending-title').textContent = ending.title; $('#ending-desc').textContent = ending.desc;
    const reasonEl = $('#ending-reason');
    if (ending.isEarly) { reasonEl.style.display = 'block'; reasonEl.textContent = s.gameOverReason === 'early_special' && s._earlyEndReason ? s._earlyEndReason : { early_economy:'经济已完全耗尽...', early_mood:'心情已跌至谷底...', early_idol_mental:'偶像心理防线崩溃...', early_idol_affection:'与偶像的心渐行渐远...', early_idol_awareness:'偶像们迷失了方向...', early_special:'发生了意想不到的事...' }[s.gameOverReason] || '游戏提前结束。'; } else reasonEl.style.display = 'none';

    const ps = $('#ending-player-stats'); ps.innerHTML = '';
    [{label:'💰 经济',value:s.economy},{label:'💖 心情',value:s.mood},{label:'📅 回合',value:s.turn+'/25个月'}].forEach(st => { const d = document.createElement('div'); d.className = 'ending-stat-item'; d.innerHTML = `<span class="value">${st.value}</span>`; ps.appendChild(d); });

    const is = $('#ending-idol-stats'); is.innerHTML = '';
    s.idols.forEach(idol => {
      const card = document.createElement('div'); card.className = 'ending-idol-card';
      card.innerHTML = `<div class="ending-idol-name">${idol.emoji} ${idol.name}</div><div class="ending-idol-details">
        <div class="ending-hidden-stat"><span class="stat-name">精神状态</span><span class="stat-value ${idol.mental<=20?'low':idol.mental<=50?'mid':'high'}">${idol.mental}</span></div>
        <div class="ending-hidden-stat"><span class="stat-name">好感度</span><span class="stat-value ${idol.affection<=20?'low':idol.affection<=50?'mid':'high'}">${idol.affection}</span></div>
        <div class="ending-hidden-stat"><span class="stat-name">偶像意愿</span><span class="stat-value ${(idol.awareness??50)<=20?'low':(idol.awareness??50)<=50?'mid':'high'}">${idol.awareness??50}</span></div></div>`;
      is.appendChild(card);
    });
    showScreen('ending');
  }
  function initEnding() { $('#btn-restart').addEventListener('click', () => { Game.reset(); selectedChar = null; $$('.char-card').forEach(c => c.classList.remove('selected')); $('#btn-char-confirm').disabled = true; showScreen('title'); }); }

  // ==================== 背景粒子 ====================
  function initBgCanvas() {
    const canvas = $('#bg-canvas'), ctx = canvas.getContext('2d'); let particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } resize(); window.addEventListener('resize', resize);
    for (let i = 0; i < 60; i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+.5, speedX: (Math.random()-.5)*.3, speedY: (Math.random()-.5)*.3, opacity: Math.random()*.5+.1, color: ['#FF6B9D','#00E5FF','#FFD700','#FF8EC7'][Math.floor(Math.random()*4)] });
    function animate() { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p => { p.x+=p.speedX; p.y+=p.speedY; if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0; if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fillStyle=p.color; ctx.globalAlpha=p.opacity; ctx.fill(); }); ctx.globalAlpha=1; requestAnimationFrame(animate); } animate();
  }

  function init() { initBgCanvas(); initTitle(); initCharSelect(); initGamePanel(); initSettle(); initEnding(); }
  return { init };
})();
document.addEventListener('DOMContentLoaded', () => UI.init());
