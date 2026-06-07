/* ============================
   ui.js - UI渲染与交互层
   ============================ */

const UI = (() => {
  // ==================== DOM引用 ====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screens = {
    title: $('#screen-title'),
    charSelect: $('#screen-char-select'),
    idolSelect: $('#screen-idol-select'),
    game: $('#screen-game'),
    settle: $('#screen-settle'),
    ending: $('#screen-ending'),
  };

  // ==================== 屏幕切换 ====================
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ==================== 浮动数值动画 ====================
  function floatNumber(el, value, positive) {
    const rect = el.getBoundingClientRect();
    const div = document.createElement('div');
    div.className = `float-number ${positive ? 'positive' : 'negative'}`;
    div.textContent = (positive ? '+' : '') + value;
    div.style.left = rect.left + rect.width / 2 - 15 + 'px';
    div.style.top = rect.top + 'px';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1300);
  }

  // ==================== 标题屏 ====================
  function initTitle() {
    $('#btn-start').addEventListener('click', () => {
      showScreen('charSelect');
    });
  }

  // ==================== 角色选择屏 ====================
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
      renderIdolSelect();
      showScreen('idolSelect');
    });
  }

  // ==================== 偶像选择屏 ====================
  let selectedIdols = [];

  function renderIdolSelect() {
    const grid = $('#idol-grid');
    grid.innerHTML = '';
    selectedIdols = [];

    IDOL_POOL.forEach(idol => {
      const card = document.createElement('div');
      card.className = 'idol-card';
      card.dataset.idolId = idol.id;
      card.innerHTML = `
        <div class="idol-avatar">${idol.emoji}</div>
        <div class="idol-card-name">${idol.name}</div>
        <div class="idol-card-desc">${idol.desc}</div>
      `;
      card.addEventListener('click', () => toggleIdolSelection(idol.id, card));
      grid.appendChild(card);
    });

    updateIdolSelectedBar();
  }

  function toggleIdolSelection(idolId, cardEl) {
    const idx = selectedIdols.indexOf(idolId);
    if (idx >= 0) {
      selectedIdols.splice(idx, 1);
      cardEl.classList.remove('selected');
    } else {
      if (selectedIdols.length >= 3) return; // 最多3个
      selectedIdols.push(idolId);
      cardEl.classList.add('selected');
    }
    updateIdolSelectedBar();
  }

  function updateIdolSelectedBar() {
    const list = $('#idol-selected-list');
    list.innerHTML = '';
    selectedIdols.forEach(id => {
      const idol = IDOL_POOL.find(i => i.id === id);
      const chip = document.createElement('span');
      chip.className = 'idol-selected-chip';
      chip.textContent = `${idol.emoji} ${idol.name}`;
      list.appendChild(chip);
    });
    $('#btn-idol-confirm').disabled = selectedIdols.length === 0;
  }

  function initIdolSelect() {
    $('#btn-idol-confirm').addEventListener('click', () => {
      if (selectedIdols.length === 0 || !selectedChar) return;

      // 初始化游戏
      Game.initState(selectedChar, selectedIdols);
      Game.startTurn();
      renderGameScreen();
      showScreen('game');
    });
  }

  // ==================== 主游戏面板 ====================
  let currentStep = 1;

  function renderGameScreen() {
    const s = Game.getState();
    updateTopBar(s);
    updateMonthInfo(s);
    updateActionSteps(s);
    updateEventLog(s);
    renderTargetIdolOptions(s);
    renderSpecialActions(s);
    setActionStep(1);
    updateSummary(s);
  }

  function updateTopBar(s) {
    $('#turn-num').textContent = s.turn;
    $('#stat-val-economy').textContent = s.economy;
    const ecoPct = Math.min(100, (s.economy / 8000) * 100);
    $('#stat-bar-economy').style.width = ecoPct + '%';
    // 低经济警告
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

    // 偶像徽章
    const badges = $('#idol-badges');
    badges.innerHTML = '';
    s.idols.forEach(idol => {
      const badge = document.createElement('span');
      badge.className = 'idol-badge';
      badge.innerHTML = `${idol.emoji} ${idol.name} <span class="bond-level">Lv.${idol.bondLevel}</span>`;
      badges.appendChild(badge);
    });
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
    // 显示最近10条
    const recent = s.eventLog.slice(-10);
    recent.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.innerHTML = `<span class="log-turn">第${entry.turn}月</span> ${entry.name}`;
      log.appendChild(div);
    });
    log.scrollTop = log.scrollHeight;
  }

  function renderTargetIdolOptions(s) {
    const container = $('#target-idol-options');
    container.innerHTML = '';
    s.idols.forEach(idol => {
      const btn = document.createElement('button');
      btn.className = 'target-idol-btn' + (s.choices.targetIdolId === idol.id ? ' selected' : '');
      btn.textContent = `${idol.emoji} ${idol.name}`;
      btn.addEventListener('click', () => {
        s.choices.targetIdolId = idol.id;
        container.querySelectorAll('.target-idol-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        updateSummary(s);
      });
      container.appendChild(btn);
    });

    // 只有一个偶像时隐藏选择区
    const selectDiv = $('#target-idol-select');
    selectDiv.style.display = s.idols.length > 1 ? 'block' : 'none';
  }

  function renderSpecialActions(s) {
    const list = $('#special-actions-list');
    if (SPECIAL_ACTIONS.length === 0) {
      list.innerHTML = '<p class="step-hint">本月无可用特殊行动</p>';
      return;
    }
    list.innerHTML = '';
    SPECIAL_ACTIONS.forEach(action => {
      const available = action.condition ? action.condition(s) : true;
      const div = document.createElement('div');
      div.className = 'choice-card' + (available ? '' : ' disabled');
      if (s.choices.specialAction === action.id) div.classList.add('selected');
      div.innerHTML = `
        <div class="choice-icon">${action.emoji || '⚡'}</div>
        <h4>${action.name}</h4>
        <p class="choice-cost">经济-${action.cost.economy || 0} / 精力-${action.cost.energy || 0}</p>
        <p class="choice-effect">心情+${action.effect.mood || 0} / 羁绊+${action.effect.bond || 0}</p>
      `;
      if (available) {
        div.addEventListener('click', () => {
          s.choices.specialAction = s.choices.specialAction === action.id ? null : action.id;
          renderSpecialActions(s);
          updateSummary(s);
        });
      }
      list.appendChild(div);
    });
  }

  // ==================== 行动步骤管理 ====================
  function setActionStep(step) {
    currentStep = step;
    $$('.action-step').forEach(el => el.classList.remove('active'));
    $(`#action-step-${step}`).classList.add('active');

    // 更新步骤指示器
    $$('.action-steps .step').forEach(el => {
      const stepNum = parseInt(el.dataset.step);
      el.classList.remove('active', 'completed');
      if (stepNum === step) el.classList.add('active');
      else if (stepNum < step) el.classList.add('completed');
    });

    // 上一步/下一步按钮
    $('#btn-prev-step').style.display = step > 1 ? 'inline-flex' : 'none';
    $('#btn-next-step').textContent = step >= 5 ? '确认行动' : '下一步';
  }

  function updateActionSteps(s) {
    // 重置所有选择卡片状态
    $$('.choice-card').forEach(c => c.classList.remove('selected', 'disabled'));

    // 恢复参与方式选择
    if (s.choices.participationMethod) {
      $$(`#action-step-2 .choice-card`).forEach(c => {
        if (c.dataset.method === s.choices.participationMethod) c.classList.add('selected');
      });
    }

    // 恢复特典方式选择
    if (s.choices.tokutenMethod) {
      $$(`#action-step-4 .choice-card`).forEach(c => {
        if (c.dataset.tokuten === s.choices.tokutenMethod) c.classList.add('selected');
      });
    }

    // 恢复滑块值
    $('#activity-count').value = s.choices.activityCount;
    $('#ticket-count').value = s.choices.ticketCount;

    // 更新可选性
    updateChoiceCardAffordability(s);
  }

  // 实时更新选择卡片的可选状态
  function updateChoiceCardAffordability(s) {
    $$(`#action-step-2 .choice-card`).forEach(card => {
      const method = PARTICIPATION_METHODS[card.dataset.method];
      const canAfford = s.economy >= method.cost.economy && s.energy >= method.cost.energy;
      card.classList.toggle('disabled', !canAfford);
    });
    $$(`#action-step-4 .choice-card`).forEach(card => {
      const tokuten = TOKUTEN_METHODS[card.dataset.tokuten];
      const canAfford = tokuten.cost.economy === 0 || s.economy >= tokuten.cost.economy;
      card.classList.toggle('disabled', !canAfford);
    });
  }

  function updateSummary(s) {
    const choices = s.choices;
    const method = PARTICIPATION_METHODS[choices.participationMethod];
    const tokuten = TOKUTEN_METHODS[choices.tokutenMethod];
    const cost = Game.calcActionCost();

    $('#sum-activity').textContent = choices.activityCount + '次';
    $('#sum-method').textContent = method ? method.name : '-';
    $('#sum-tickets').textContent = choices.ticketCount + '张';
    const targetIdol = s.idols.find(i => i.id === choices.targetIdolId);
    $('#sum-idol').textContent = targetIdol ? targetIdol.name : '-';
    $('#sum-tokuten').textContent = tokuten ? tokuten.name : '-';
    $('#sum-cost-economy').textContent = cost.economy;
    $('#sum-cost-energy').textContent = cost.energy;
    $('#sum-gain-mood').textContent = '+' + cost.mood;
    $('#sum-gain-bond').textContent = '+' + cost.bond;
  }

  function initGamePanel() {
    // 偶活次数滑块
    $('#activity-count').addEventListener('input', (e) => {
      const s = Game.getState();
      s.choices.activityCount = parseInt(e.target.value);
      updateSummary(s);
      updateChoiceCardAffordability(s);
    });

    // 特典券滑块
    $('#ticket-count').addEventListener('input', (e) => {
      const s = Game.getState();
      s.choices.ticketCount = parseInt(e.target.value);
      updateSummary(s);
      updateChoiceCardAffordability(s);
    });

    // 参与方式选择
    $$(`#action-step-2 .choice-card`).forEach(card => {
      card.addEventListener('click', () => {
        const s = Game.getState();
        const method = PARTICIPATION_METHODS[card.dataset.method];
        // 检查经济和精力是否足够（单次）
        if (s.economy < method.cost.economy || s.energy < method.cost.energy) {
          showToast('经济或精力不足以选择此方式');
          return;
        }
        $$(`#action-step-2 .choice-card`).forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        s.choices.participationMethod = card.dataset.method;
        updateSummary(s);
        updateChoiceCardAffordability(s);
      });
    });

    // 特典方式选择
    $$(`#action-step-4 .choice-card`).forEach(card => {
      card.addEventListener('click', () => {
        const s = Game.getState();
        const tokuten = TOKUTEN_METHODS[card.dataset.tokuten];
        // 检查经济
        if (tokuten.cost.economy > 0 && s.economy < tokuten.cost.economy) {
          showToast('经济不足以选择此特典方式');
          return;
        }
        $$(`#action-step-4 .choice-card`).forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        s.choices.tokutenMethod = card.dataset.tokuten;
        updateSummary(s);
      });
    });

    // 上一步/下一步
    $('#btn-prev-step').addEventListener('click', () => {
      if (currentStep > 1) setActionStep(currentStep - 1);
    });

    $('#btn-next-step').addEventListener('click', () => {
      if (currentStep < 5) {
        // 校验当前步骤
        if (!validateStep(currentStep)) return;
        setActionStep(currentStep + 1);
      } else {
        // 确认行动前校验所有步骤
        for (let i = 1; i <= 4; i++) {
          if (!validateStep(i)) {
            setActionStep(i);
            return;
          }
        }
        confirmAction();
      }
    });

    // 跳过特殊行动，直接确认
    $('#btn-skip-special').addEventListener('click', () => {
      Game.getState().choices.specialAction = null;
      for (let i = 1; i <= 4; i++) {
        if (!validateStep(i)) {
          setActionStep(i);
          return;
        }
      }
      confirmAction();
    });
  }

  function validateStep(step) {
    const s = Game.getState();
    switch (step) {
      case 1:
        return true;
      case 2:
        if (!s.choices.participationMethod) {
          showToast('请选择参与方式');
          return false;
        }
        return true;
      case 3:
        // 有特典券或选择了非"不参与"的特典方式时，需要目标偶像
        if (s.idols.length > 1 && !s.choices.targetIdolId) {
          showToast('请选择目标偶像');
          return false;
        }
        return true;
      case 4:
        if (!s.choices.tokutenMethod) {
          showToast('请选择特典方式');
          return false;
        }
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  }

  // ==================== 确认行动 → 事件 → 结算 ====================
  async function confirmAction() {
    const s = Game.getState();
    const cost = Game.calcActionCost();

    // 检查经济是否足够
    if (s.economy < cost.economy) {
      showToast('经济不足，无法执行此行动！');
      return;
    }
    if (s.energy < cost.energy) {
      showToast('精力不足，无法执行此行动！');
      return;
    }

    // 处理行动
    Game.processAction();
    updateTopBar(Game.getState());

    // 触发事件
    const events = Game.triggerEvents();
    if (events.length > 0) {
      for (const evt of events) {
        await showEventPopup(evt);
      }
      updateTopBar(Game.getState());
      updateEventLog(Game.getState());
    }

    // 结算
    const gameOver = Game.settleTurn();
    if (gameOver) {
      // 游戏提前结束
      showEndingScreen();
      return;
    }

    // 显示结算屏
    showSettleScreen();
  }

  // ==================== 事件弹窗 ====================
  function showEventPopup(evt) {
    return new Promise(resolve => {
      const overlay = $('#overlay-event');
      $('#event-icon').textContent = evt.icon || '📢';
      $('#event-title').textContent = evt.name;
      $('#event-desc').textContent = evt.desc;

      // 效果标签
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

      const continueBtn = $('#btn-event-continue');
      const handler = () => {
        overlay.classList.remove('active');
        continueBtn.removeEventListener('click', handler);
        resolve();
      };
      continueBtn.addEventListener('click', handler);
    });
  }

  // ==================== 结算屏 ====================
  function showSettleScreen() {
    const s = Game.getState();
    const prev = s.prevStats || { economy: 0, energy: 0, mood: 0 };

    // 计算变化量
    const ecoDelta = s.economy - prev.economy;
    const engDelta = s.energy - prev.energy;
    const moodDelta = s.mood - prev.mood;

    // 羁绊信息 - 显示所有偶像
    if (s.idols.length === 1) {
      const idol = s.idols[0];
      $('#settle-bond').textContent = `${idol.name}: ${Game.getBondLevelName(idol.bondLevel)} (${idol.bond})`;
    } else {
      $('#settle-bond').textContent = s.idols.map(idol =>
        `${idol.emoji}${Game.getBondLevelName(idol.bondLevel)}(${idol.bond})`
      ).join(' / ');
    }

    // 数值变化
    $('#settle-economy').textContent = s.economy;
    renderDelta('settle-economy-delta', ecoDelta);
    $('#settle-energy').textContent = s.energy;
    renderDelta('settle-energy-delta', engDelta);
    $('#settle-mood').textContent = s.mood;
    renderDelta('settle-mood-delta', moodDelta);

    // 事件列表
    const list = $('#settle-event-list');
    list.innerHTML = '';
    s.turnEvents.forEach(evt => {
      const li = document.createElement('li');
      li.textContent = `${evt.icon} ${evt.name} - ${evt.desc}`;
      list.appendChild(li);
    });
    if (s.turnEvents.length === 0) {
      list.innerHTML = '<li>本月无特殊事件</li>';
    }

    // 按钮文字
    const btnNext = $('#btn-next-turn');
    if (s.turn >= 25) {
      btnNext.textContent = '查看结局';
    } else {
      btnNext.textContent = '进入下月';
    }

    showScreen('settle');
  }

  function renderDelta(elId, delta) {
    const el = $(`#${elId}`);
    if (delta > 0) {
      el.textContent = `+${delta}`;
      el.className = 'settle-delta positive';
    } else if (delta < 0) {
      el.textContent = `${delta}`;
      el.className = 'settle-delta negative';
    } else {
      el.textContent = '';
      el.className = 'settle-delta';
    }
  }

  function initSettle() {
    $('#btn-next-turn').addEventListener('click', () => {
      const result = Game.nextTurn();
      if (result.ended) {
        showEndingScreen();
      } else {
        renderGameScreen();
        showScreen('game');
      }
    });
  }

  // ==================== 结局屏 ====================
  function showEndingScreen() {
    const s = Game.getState();
    const ending = Game.determineEnding();

    $('#ending-title').textContent = ending.title;
    $('#ending-desc').textContent = ending.desc;

    // 提前结束原因
    const reasonEl = $('#ending-reason');
    if (ending.isEarly) {
      reasonEl.style.display = 'block';
      reasonEl.textContent = s.gameOverReason === 'early_special' && s._earlyEndReason
        ? s._earlyEndReason
        : getEarlyEndText(s.gameOverReason);
    } else {
      reasonEl.style.display = 'none';
    }

    // 玩家数值
    const playerStats = $('#ending-player-stats');
    playerStats.innerHTML = '';
    const pStats = [
      { label: '💰 经济', value: s.economy },
      { label: '⚡ 精力', value: s.energy + '/' + s.energyCap },
      { label: '💖 心情', value: s.mood },
      { label: '📅 回合', value: s.turn + '/25' },
    ];
    pStats.forEach(st => {
      const div = document.createElement('div');
      div.className = 'ending-stat-item';
      div.innerHTML = `<span class="label">${st.label}</span><span class="value">${st.value}</span>`;
      playerStats.appendChild(div);
    });

    // 偶像状态揭秘
    const idolStats = $('#ending-idol-stats');
    idolStats.innerHTML = '';
    s.idols.forEach(idol => {
      const card = document.createElement('div');
      card.className = 'ending-idol-card';
      card.innerHTML = `
        <div class="ending-idol-name">${idol.emoji} ${idol.name} - ${Game.getBondLevelName(idol.bondLevel)} (羁绊:${idol.bond})</div>
        <div class="ending-idol-details">
          <div class="ending-hidden-stat">
            <span class="stat-name">心理值</span>
            <span class="stat-value ${idol.mental <= 20 ? 'low' : idol.mental <= 50 ? 'mid' : 'high'}">${idol.mental}</span>
          </div>
          <div class="ending-hidden-stat">
            <span class="stat-name">好感度</span>
            <span class="stat-value ${idol.affection <= 20 ? 'low' : idol.affection <= 50 ? 'mid' : 'high'}">${idol.affection}</span>
          </div>
          <div class="ending-hidden-stat">
            <span class="stat-name">关注度</span>
            <span class="stat-value ${idol.attention <= 20 ? 'low' : idol.attention <= 50 ? 'mid' : 'high'}">${idol.attention}</span>
          </div>
        </div>
      `;
      idolStats.appendChild(card);
    });

    showScreen('ending');
  }

  function getEarlyEndText(reason) {
    const texts = {
      early_economy: '你的经济已完全耗尽...',
      early_energy: '你的精力已完全耗尽...',
      early_mood: '你的心情已跌至谷底...',
      early_idol: '你推的偶像们接连倒下了...',
      early_special: '发生了意想不到的事...',
    };
    return texts[reason] || '游戏提前结束。';
  }

  function initEnding() {
    $('#btn-restart').addEventListener('click', () => {
      Game.reset();
      selectedChar = null;
      selectedIdols = [];
      $$('.char-card').forEach(c => c.classList.remove('selected'));
      $('#btn-char-confirm').disabled = true;
      showScreen('title');
    });
  }

  // ==================== Toast提示 ====================
  function showToast(msg) {
    let toast = $('#toast-msg');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-msg';
      toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        padding: 12px 24px; background: rgba(255,71,87,.9); color: #fff;
        border-radius: 8px; font-size: 14px; z-index: 300;
        opacity: 0; transition: opacity .3s; pointer-events: none;
        font-family: var(--font);
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
  }

  // ==================== 背景粒子 ====================
  function initBgCanvas() {
    const canvas = $('#bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // 创建粒子
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        color: ['#FF6B9D', '#00E5FF', '#FFD700', '#FF8EC7'][Math.floor(Math.random() * 4)],
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }
    animate();
  }

  // ==================== 初始化 ====================
  function init() {
    initBgCanvas();
    initTitle();
    initCharSelect();
    initIdolSelect();
    initGamePanel();
    initSettle();
    initEnding();
  }

  return { init };
})();

// 启动
document.addEventListener('DOMContentLoaded', () => UI.init());
