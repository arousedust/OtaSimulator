/* ============================
   ui.js - UI渲染与交互层（月/周制）
   ============================ */

const UI = (() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const screens = {
    title: $('#screen-title'),
    charSelect: $('#screen-char-select'),
    game: $('#screen-game'),
    settle: $('#screen-settle'),
    ending: $('#screen-ending'),
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  function showToast(msg) {
    let toast = $('#toast-msg');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-msg';
      toast.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:12px 24px;background:rgba(255,71,87,.9);color:#fff;border-radius:8px;font-size:14px;z-index:300;opacity:0;transition:opacity .3s;pointer-events:none;font-family:var(--font);`;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
  }

  // ==================== 标题屏 ====================
  function initTitle() {
    $('#btn-start').addEventListener('click', () => showScreen('charSelect'));
  }

  // ==================== 角色选择 ====================
  let selectedChar = null;
  function initCharSelect() {
    $$('.char-card').forEach(card => {
      card.addEventListener('click', () => {
        $$('.char-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedChar = card.dataset.char;
        $('#btn-char-confirm').disabled = false;
      });
    });
    $('#btn-char-confirm').addEventListener('click', () => {
      if (!selectedChar) return;
      Game.initState(selectedChar);
      Game.startMonth();
      renderGameScreen();
      showScreen('game');
    });
  }

  // ==================== 主游戏面板 ====================
  let currentPhase = 'week_decision';
  // 特典面板状态
  let tokutenEditingIdol = null;     // 当前正在编辑的偶像id
  let tokutenEditTicket = null;      // 当前编辑中的买券
  let tokutenEditChat = null;        // 当前编辑中的聊天

  function renderGameScreen() {
    const s = Game.getState();
    updateTopBar(s);
    updateMonthInfo(s);
    updateEventLog(s);
    updateKnownIdols(s);
    renderTokutenIdolGrid(s);
    renderCheerTargets(s);
    resetTokutenEdit();
    hideTokutenConfigPanel();
    renderTokutenSelectionsBar(s);
    setPhase('week_decision');
    updateSummary(s);
  }

  function updateTopBar(s) {
    $('#turn-num').textContent = s.turn;
    $('#week-num').textContent = s.week;
    $('#stat-val-economy').textContent = s.economy;
    const ecoPct = Math.min(100, (s.economy / 8000) * 100);
    $('#stat-bar-economy').style.width = ecoPct + '%';
    $('#stat-bar-economy').style.background = s.economy < 1000
      ? 'linear-gradient(90deg, var(--red), #ff6b6b)'
      : 'linear-gradient(90deg, var(--primary-1), var(--gold))';
    $('#stat-val-energy').textContent = s.energy + '/' + s.energyCap;
    const engPct = s.energy / s.energyCap * 100;
    $('#stat-bar-energy').style.width = engPct + '%';
    $('#stat-bar-energy').style.background = s.energy / s.energyCap < 0.25
      ? 'linear-gradient(90deg, var(--red), #ff6b6b)'
      : 'linear-gradient(90deg, var(--cyan), var(--green))';
    $('#stat-val-mood').textContent = s.mood;
    $('#stat-bar-mood').style.width = s.mood + '%';
    $('#stat-bar-mood').style.background = s.mood < 25
      ? 'linear-gradient(90deg, var(--red), #ff6b6b)'
      : 'linear-gradient(90deg, var(--primary-1), var(--primary-3))';
  }

  function updateMonthInfo(s) {
    const config = CHARACTER_CONFIGS[s.character];
    $('#rec-economy').textContent = '+' + Math.round(config.economy.recovery * s.modifiers.economyRecoveryMod);
    $('#rec-energy').textContent = '+' + Math.round(config.energy.recovery * s.modifiers.energyRecoveryMod);
    $('#drain-mood').textContent = '-' + Math.round(config.mood.monthlyDrain * s.modifiers.moodDrainMod);
  }

  function updateEventLog(s) {
    const log = $('#event-log');
    if (s.eventLog.length === 0) {
      log.innerHTML = '<p class="log-empty">尚无事件记录</p>';
      return;
    }
    log.innerHTML = '';
    const recent = s.eventLog.slice(-10);
    recent.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.innerHTML = `<span class="log-turn">第${entry.turn}月</span> ${entry.name}`;
      log.appendChild(div);
    });
    log.scrollTop = log.scrollHeight;
  }

  function updateKnownIdols(s) {
    const list = $('#known-idols-list');
    if (s.knownIdols.length === 0) {
      list.innerHTML = '<p class="log-empty">尚未与任何偶像相识</p>';
      return;
    }
    list.innerHTML = '';
    s.knownIdols.forEach(k => {
      const badge = document.createElement('span');
      badge.className = 'known-idol-badge';
      const idol = s.idols.find(i => i.id === k.idolId);
      const level = idol ? Game.getBondLevelName(idol.bondLevel) : '';
      badge.innerHTML = `${k.emoji} ${k.name}${level ? ' <small>'+level+'</small>' : ''}`;
      list.appendChild(badge);
    });
  }

  // ==================== 特典编辑 ====================
  function resetTokutenEdit() {
    tokutenEditingIdol = null;
    tokutenEditTicket = null;
    tokutenEditChat = null;
  }

  function hideTokutenConfigPanel() {
    const panel = $('#tokuten-config-panel');
    if (panel) panel.style.display = 'none';
    // 清除高亮
    $$('.tokuten-idol-card.editing').forEach(c => c.classList.remove('editing'));
    resetTokutenEdit();
  }

  function showTokutenConfigPanel(idolId) {
    const s = Game.getState();
    const idol = s.idols.find(i => i.id === idolId);
    if (!idol) return;

    tokutenEditingIdol = idolId;
    tokutenEditTicket = null;
    tokutenEditChat = null;

    // 检查是否已有该偶像的配置
    const existing = s.choices.tokutenSelections.find(sel => sel.idolId === idolId);
    if (existing) {
      tokutenEditTicket = existing.ticketType;
      tokutenEditChat = existing.chatMethod;
    }

    $('#tokuten-config-idol-name').textContent = idol.emoji + ' ' + idol.name;
    const panel = $('#tokuten-config-panel');
    panel.style.display = 'block';

    // 恢复买券选中状态
    $$('#ticket-type-cards .choice-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.ticket === tokutenEditTicket);
    });
    // 恢复聊天选中状态
    $$('#chat-method-cards .choice-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.chat === tokutenEditChat);
    });

    // 更新聊舞台惩罚提示
    updateChatPenaltyHint(s);

    // 高亮当前编辑的偶像卡片
    $$('.tokuten-idol-card').forEach(c => c.classList.remove('editing'));
    const card = document.querySelector(`.tokuten-idol-card[data-idol-id="${idolId}"]`);
    if (card) card.classList.add('editing');
  }

  function updateChatPenaltyHint(s) {
    const stageCard = document.querySelector('[data-chat="stage"]');
    if (!stageCard) return;
    const hint = stageCard.querySelector('.penalty-hint');
    if (!hint) return;
    hint.style.display = s.choices.participationMethod === 'tokuten' ? 'block' : 'none';
  }

  function addTokutenSelection() {
    if (!tokutenEditingIdol || !tokutenEditTicket || !tokutenEditChat) {
      showToast('请先选择买券方式和聊天内容');
      return;
    }
    const s = Game.getState();
    // 移除该偶像旧配置
    s.choices.tokutenSelections = s.choices.tokutenSelections.filter(
      sel => sel.idolId !== tokutenEditingIdol
    );
    // 添加新配置
    s.choices.tokutenSelections.push({
      idolId: tokutenEditingIdol,
      ticketType: tokutenEditTicket,
      chatMethod: tokutenEditChat,
    });

    hideTokutenConfigPanel();
    renderTokutenIdolGrid(s);
    renderTokutenSelectionsBar(s);
    updateSummary(s);
  }

  // ==================== 特典偶像网格 ====================
  function renderTokutenIdolGrid(s) {
    const container = $('#tokuten-idol-grid');
    if (!container) return;
    container.innerHTML = '';
    s.idols.forEach(idol => {
      const card = document.createElement('div');
      const sel = s.choices.tokutenSelections.find(x => x.idolId === idol.id);
      const isEditing = tokutenEditingIdol === idol.id;
      card.className = 'tokuten-idol-card' +
        (sel ? ' configured' : '') +
        (isEditing ? ' editing' : '');
      card.dataset.idolId = idol.id;
      card.innerHTML = `
        <div class="tokuten-idol-emoji">${idol.emoji}</div>
        <div class="tokuten-idol-name">${idol.name}</div>
        ${sel ? `<div class="tokuten-idol-tag">${TICKET_TYPES[sel.ticketType]?.emoji||''} ${CHAT_METHODS[sel.chatMethod]?.emoji||''}</div>` : ''}
        <div class="tokuten-idol-check">${sel ? '✓' : ''}</div>
      `;
      card.addEventListener('click', () => showTokutenConfigPanel(idol.id));
      container.appendChild(card);
    });
  }

  // ==================== 特典已配置列表 ====================
  function renderTokutenSelectionsBar(s) {
    const bar = $('#tokuten-selections-bar');
    if (!bar) return;
    const sels = s.choices.tokutenSelections;
    if (sels.length === 0) {
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'flex';
    bar.innerHTML = '<span class="tokuten-sel-label">已配置：</span>';
    sels.forEach(sel => {
      const idol = s.idols.find(i => i.id === sel.idolId);
      const ticket = TICKET_TYPES[sel.ticketType];
      const chat = CHAT_METHODS[sel.chatMethod];
      const chip = document.createElement('div');
      chip.className = 'tokuten-sel-chip';
      chip.innerHTML = `${idol ? idol.emoji : ''} ${idol ? idol.name : ''} ${ticket?.emoji||''}${ticket?.name||''} ${chat?.emoji||''}${chat?.name||''} <span class="tokuten-sel-remove">✕</span>`;
      chip.querySelector('.tokuten-sel-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        s.choices.tokutenSelections = s.choices.tokutenSelections.filter(x => x.idolId !== sel.idolId);
        hideTokutenConfigPanel();
        renderTokutenIdolGrid(s);
        renderTokutenSelectionsBar(s);
        updateSummary(s);
      });
      // 点击chip重新编辑
      chip.addEventListener('click', () => showTokutenConfigPanel(sel.idolId));
      bar.appendChild(chip);
    });
  }

  // ==================== 应援切偶像列表 ====================
  function renderCheerTargets(s) {
    const section = $('#cheer-targets-section');
    const grid = $('#cheer-targets-grid');
    if (!section || !grid) return;

    // 只在选了现场应援且有相识偶像时显示
    if (s.choices.participationMethod !== 'cheer' || s.knownIdols.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    grid.innerHTML = '';
    s.knownIdols.forEach(k => {
      const card = document.createElement('div');
      const selected = s.choices.cheerTargetIds.includes(k.idolId);
      card.className = 'tokuten-idol-card' + (selected ? ' configured' : '');
      card.innerHTML = `
        <div class="tokuten-idol-emoji">${k.emoji}</div>
        <div class="tokuten-idol-name">${k.name}</div>
        <div class="tokuten-idol-check">${selected ? '✓' : ''}</div>
      `;
      card.addEventListener('click', () => {
        const idx = s.choices.cheerTargetIds.indexOf(k.idolId);
        if (idx >= 0) s.choices.cheerTargetIds.splice(idx, 1);
        else s.choices.cheerTargetIds.push(k.idolId);
        renderCheerTargets(s);
        updateSummary(s);
      });
      grid.appendChild(card);
    });
  }

  // ==================== 阶段管理 ====================
  function setPhase(phase) {
    currentPhase = phase;
    $('#action-step-decide').classList.remove('active');
    $('#action-step-method').classList.remove('active');
    $('#action-step-tokuten').classList.remove('active');

    switch (phase) {
      case 'week_decision':
        $('#action-step-decide').classList.add('active');
        $('#phase-arrow-tokuten').style.opacity = '0.4';
        $('#phase-dot-tokuten').classList.remove('active');
        break;
      case 'week_method':
        $('#action-step-method').classList.add('active');
        $('#phase-arrow-tokuten').style.opacity = '0.4';
        $('#phase-dot-tokuten').classList.remove('active');
        break;
      case 'week_tokuten':
        $('#action-step-tokuten').classList.add('active');
        $('#phase-arrow-tokuten').style.opacity = '1';
        $('#phase-dot-tokuten').classList.add('active');
        break;
    }

    $$('.phase-dot').forEach(dot => {
      const dp = dot.dataset.phase;
      dot.classList.remove('active', 'completed');
      if (dp === phase || (phase === 'week_tokuten' && dp === 'week_tokuten')) dot.classList.add('active');
      else if (phase === 'week_tokuten' && (dp === 'week_decision' || dp === 'week_method')) dot.classList.add('completed');
      else if (phase === 'week_method' && dp === 'week_decision') dot.classList.add('completed');
    });

    $('#btn-prev-phase').style.display = phase === 'week_decision' ? 'none' : 'inline-flex';
    $('#btn-confirm-week').textContent = phase === 'week_tokuten' ? '确认行动' : '下一步';
  }

  function updateSummary(s) {
    const cost = Game.calcWeekCost();
    if (cost.skip) {
      $('#sum-cost-economy').textContent = '0';
      $('#sum-cost-energy').textContent = '+5';
      $('#sum-gain-mood').textContent = '-2';
    } else {
      $('#sum-cost-economy').textContent = '-' + cost.economy;
      $('#sum-cost-energy').textContent = '-' + cost.energy;
      $('#sum-gain-mood').textContent = (cost.mood >= 0 ? '+' : '') + cost.mood;
    }
    const penaltyRow = $('#sum-penalty');
    if (cost.showPenalty) {
      penaltyRow.style.display = 'flex';
      $('#sum-penalty-text').textContent = cost.penaltyDesc;
    } else {
      penaltyRow.style.display = 'none';
    }
  }

  // ==================== 事件绑定 ====================
  function initGamePanel() {
    // 阶段1：参加决定
    $$('#action-step-decide .choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const s = Game.getState();
        s.choices.participate = card.dataset.participate === 'yes';
        $$('#action-step-decide .choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        if (s.choices.participate) {
          setPhase('week_method');
        }
        updateSummary(s);
      });
    });

    // 阶段2：参与方式
    $$('#action-step-method .choice-card[data-method]').forEach(card => {
      card.addEventListener('click', () => {
        const s = Game.getState();
        const method = PARTICIPATION_METHODS[card.dataset.method];
        if (!method) return;
        if (s.economy < method.cost.economy || s.energy < method.cost.energy) {
          showToast('经济或精力不足以选择此方式');
          return;
        }
        $$('#action-step-method .choice-card[data-method]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        s.choices.participationMethod = card.dataset.method;
        s.choices.cheerTargetIds = [];
        renderCheerTargets(s);
        updateChatPenaltyHint(s);
        updateSummary(s);

        if (method.skipTokuten) {
          // 只是看现场 → 跳过特典
          s.choices.tokutenSelections = [];
        } else {
          setPhase('week_tokuten');
          renderTokutenIdolGrid(s);
          renderTokutenSelectionsBar(s);
          hideTokutenConfigPanel();
        }
      });
    });

    // 特典：买券选择
    $$('#ticket-type-cards .choice-card').forEach(card => {
      card.addEventListener('click', () => {
        $$('#ticket-type-cards .choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        tokutenEditTicket = card.dataset.ticket;
        updateSummary(Game.getState());
      });
    });

    // 特典：聊天选择
    $$('#chat-method-cards .choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const s = Game.getState();
        $$('#chat-method-cards .choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        tokutenEditChat = card.dataset.chat;
        updateSummary(s);
      });
    });

    // 确认添加当前偶像配置
    $('#btn-add-tokuten').addEventListener('click', () => addTokutenSelection());

    // 上一步
    $('#btn-prev-phase').addEventListener('click', () => {
      const s = Game.getState();
      if (currentPhase === 'week_tokuten') {
        setPhase('week_method');
        s.choices.tokutenSelections = [];
        hideTokutenConfigPanel();
        renderTokutenSelectionsBar(s);
        renderTokutenIdolGrid(s);
        updateSummary(s);
      } else if (currentPhase === 'week_method') {
        setPhase('week_decision');
        s.choices.participationMethod = null;
        s.choices.cheerTargetIds = [];
        s.choices.tokutenSelections = [];
        $('#cheer-targets-section').style.display = 'none';
        updateSummary(s);
      }
    });

    // 确认行动
    $('#btn-confirm-week').addEventListener('click', () => confirmWeek());
  }

  // ==================== 确认本周 ====================
  async function confirmWeek() {
    const s = Game.getState();
    const c = s.choices;

    if (c.participate === null) {
      showToast('请选择本周是否参加偶活');
      setPhase('week_decision');
      return;
    }
    if (c.participate) {
      if (!c.participationMethod) {
        showToast('请选择参与方式');
        setPhase('week_method');
        return;
      }
      const method = PARTICIPATION_METHODS[c.participationMethod];
      if (!method.skipTokuten && c.tokutenSelections.length === 0) {
        showToast('请至少为一位偶像配置特典');
        setPhase('week_tokuten');
        return;
      }
    }

    const cost = Game.calcWeekCost();
    if (c.participate && !cost.affordable) {
      showToast('经济或精力不足，无法执行此行动！');
      return;
    }

    Game.processWeek();

    if (Game.getState()._chatPenalty) {
      await showChatPenaltyPopup(Game.getState()._chatPenalty);
    }

    updateTopBar(Game.getState());
    updateEventLog(Game.getState());
    updateKnownIdols(Game.getState());

    const nextResult = Game.nextWeek();
    if (nextResult.monthEnded) {
      if (nextResult.events && nextResult.events.length > 0) {
        for (const evt of nextResult.events) {
          await showEventPopup(evt);
        }
        updateTopBar(Game.getState());
        updateEventLog(Game.getState());
      }
      if (nextResult.gameOver) {
        showEndingScreen();
        return;
      }
      showSettleScreen();
    } else {
      renderGameScreen();
    }
  }

  // ==================== 弹窗 ====================
  function showChatPenaltyPopup(desc) {
    return new Promise(resolve => {
      const overlay = $('#overlay-chat-penalty');
      $('#chat-penalty-desc').textContent = desc || '只来特典会却只谈舞台话题，对方感到困惑...';
      $('#chat-penalty-effects').innerHTML = '<span class="effect-tag negative">好感度与心情下降</span>';
      overlay.classList.add('active');
      const btn = $('#btn-chat-penalty-continue');
      const handler = () => { overlay.classList.remove('active'); btn.removeEventListener('click', handler); resolve(); };
      btn.addEventListener('click', handler);
    });
  }

  function showEventPopup(evt) {
    return new Promise(resolve => {
      const overlay = $('#overlay-event');
      $('#event-icon').textContent = evt.icon || '📢';
      $('#event-title').textContent = evt.name;
      $('#event-desc').textContent = evt.desc;
      const effectsDiv = $('#event-effects');
      effectsDiv.innerHTML = '';
      if (evt.effect) {
        if (evt.effect.economy) {
          const tag = document.createElement('span');
          tag.className = 'effect-tag ' + (evt.effect.economy > 0 ? 'positive' : 'negative');
          tag.textContent = `💰 ${evt.effect.economy > 0 ? '+' : ''}${evt.effect.economy}`;
          effectsDiv.appendChild(tag);
        }
        if (evt.effect.energy) {
          const tag = document.createElement('span');
          tag.className = 'effect-tag ' + (evt.effect.energy > 0 ? 'positive' : 'negative');
          tag.textContent = `⚡ ${evt.effect.energy > 0 ? '+' : ''}${evt.effect.energy}`;
          effectsDiv.appendChild(tag);
        }
        if (evt.effect.mood) {
          const tag = document.createElement('span');
          tag.className = 'effect-tag ' + (evt.effect.mood > 0 ? 'positive' : 'negative');
          tag.textContent = `💖 ${evt.effect.mood > 0 ? '+' : ''}${evt.effect.mood}`;
          effectsDiv.appendChild(tag);
        }
      }
      overlay.classList.add('active');
      const btn = $('#btn-event-continue');
      const handler = () => { overlay.classList.remove('active'); btn.removeEventListener('click', handler); resolve(); };
      btn.addEventListener('click', handler);
    });
  }

  // ==================== 月结算屏 ====================
  function showSettleScreen() {
    const s = Game.getState();
    const prev = s.prevStats || { economy: 0, energy: 0, mood: 0 };
    const ecoDelta = s.economy - prev.economy;
    const engDelta = s.energy - prev.energy;
    const moodDelta = s.mood - prev.mood;

    const activeIdols = s.idols.filter(i => i.bond > 0);
    if (activeIdols.length === 1) {
      const idol = activeIdols[0];
      $('#settle-bond').textContent = `${idol.name}: ${Game.getBondLevelName(idol.bondLevel)} (${idol.bond})`;
    } else if (activeIdols.length > 0) {
      $('#settle-bond').textContent = activeIdols.map(i =>
        `${i.emoji}${Game.getBondLevelName(i.bondLevel)}(${i.bond})`
      ).join(' / ');
    } else {
      $('#settle-bond').textContent = '无';
    }

    $('#settle-economy').textContent = s.economy;
    renderDelta('settle-economy-delta', ecoDelta);
    $('#settle-energy').textContent = s.energy + '/' + s.energyCap;
    renderDelta('settle-energy-delta', engDelta);
    $('#settle-mood').textContent = s.mood;
    renderDelta('settle-mood-delta', moodDelta);

    const list = $('#settle-event-list');
    list.innerHTML = '';
    s.turnEvents.forEach(evt => {
      const li = document.createElement('li');
      li.textContent = `${evt.icon} ${evt.name} - ${evt.desc}`;
      list.appendChild(li);
    });
    if (s.turnEvents.length === 0) list.innerHTML = '<li>本月无特殊事件</li>';

    const btnNext = $('#btn-next-month');
    btnNext.textContent = s.turn >= TOTAL_MONTHS ? '查看结局' : '进入下月';
    showScreen('settle');
  }

  function renderDelta(elId, delta) {
    const el = $(`#${elId}`);
    if (delta > 0) { el.textContent = `+${delta}`; el.className = 'settle-delta positive'; }
    else if (delta < 0) { el.textContent = `${delta}`; el.className = 'settle-delta negative'; }
    else { el.textContent = ''; el.className = 'settle-delta'; }
  }

  function initSettle() {
    $('#btn-next-month').addEventListener('click', () => {
      const result = Game.nextMonth();
      if (result.ended) { showEndingScreen(); }
      else { renderGameScreen(); showScreen('game'); }
    });
  }

  // ==================== 结局屏 ====================
  function showEndingScreen() {
    const s = Game.getState();
    const ending = Game.determineEnding();
    $('#ending-title').textContent = ending.title;
    $('#ending-desc').textContent = ending.desc;
    const reasonEl = $('#ending-reason');
    if (ending.isEarly) {
      reasonEl.style.display = 'block';
      reasonEl.textContent = s.gameOverReason === 'early_special' && s._earlyEndReason
        ? s._earlyEndReason : getEarlyEndText(s.gameOverReason);
    } else { reasonEl.style.display = 'none'; }

    const playerStats = $('#ending-player-stats');
    playerStats.innerHTML = '';
    [{label:'💰 经济',value:s.economy},{label:'⚡ 精力',value:s.energy+'/'+s.energyCap},{label:'💖 心情',value:s.mood},{label:'📅 回合',value:s.turn+'/25个月'}].forEach(st => {
      const div = document.createElement('div');
      div.className = 'ending-stat-item';
      div.innerHTML = `<span class="value">${st.value}</span>`;
      playerStats.appendChild(div);
    });

    const idolStats = $('#ending-idol-stats');
    idolStats.innerHTML = '';
    s.idols.forEach(idol => {
      const card = document.createElement('div');
      card.className = 'ending-idol-card';
      card.innerHTML = `
        <div class="ending-idol-name">${idol.emoji} ${idol.name} - ${Game.getBondLevelName(idol.bondLevel)} (羁绊:${idol.bond})</div>
        <div class="ending-idol-details">
          <div class="ending-hidden-stat"><span class="stat-name">心理值</span><span class="stat-value ${idol.mental<=20?'low':idol.mental<=50?'mid':'high'}">${idol.mental}</span></div>
          <div class="ending-hidden-stat"><span class="stat-name">好感度</span><span class="stat-value ${idol.affection<=20?'low':idol.affection<=50?'mid':'high'}">${idol.affection}</span></div>
          <div class="ending-hidden-stat"><span class="stat-name">关注度</span><span class="stat-value ${idol.attention<=20?'low':idol.attention<=50?'mid':'high'}">${idol.attention}</span></div>
        </div>
      `;
      idolStats.appendChild(card);
    });
    showScreen('ending');
  }

  function getEarlyEndText(reason) {
    const texts = { early_economy:'你的经济已完全耗尽...', early_energy:'你的精力已完全耗尽...', early_mood:'你的心情已跌至谷底...', early_idol:'你推的偶像们接连倒下了...', early_special:'发生了意想不到的事...' };
    return texts[reason] || '游戏提前结束。';
  }

  function initEnding() {
    $('#btn-restart').addEventListener('click', () => {
      Game.reset(); selectedChar = null;
      $$('.char-card').forEach(c => c.classList.remove('selected'));
      $('#btn-char-confirm').disabled = true;
      showScreen('title');
    });
  }

  // ==================== 背景粒子 ====================
  function initBgCanvas() {
    const canvas = $('#bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        color: ['#FF6B9D','#00E5FF','#FFD700','#FF8EC7'][Math.floor(Math.random()*4)],
      });
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX; p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.opacity; ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }
    animate();
  }

  function init() {
    initBgCanvas(); initTitle(); initCharSelect();
    initGamePanel(); initSettle(); initEnding();
  }
  return { init };
})();

document.addEventListener('DOMContentLoaded', () => UI.init());
