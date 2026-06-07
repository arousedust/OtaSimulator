/* ============================
   ui.js - UI渲染与交互层（月/周制）
   ============================ */

const UI = (() => {
  // ==================== DOM引用 ====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screens = {
    title: $('#screen-title'),
    charSelect: $('#screen-char-select'),
    game: $('#screen-game'),
    settle: $('#screen-settle'),
    ending: $('#screen-ending'),
  };

  // ==================== 屏幕切换 ====================
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ==================== Toast提示 ====================
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
      // 直接进入游戏，不选择偶像
      Game.initState(selectedChar);
      Game.startMonth();
      renderGameScreen();
      showScreen('game');
    });
  }

  // ==================== 主游戏面板 ====================
  // 当前阶段: 'week_decision' | 'week_method' | 'week_tokuten'
  let currentPhase = 'week_decision';

  function renderGameScreen() {
    const s = Game.getState();
    updateTopBar(s);
    updateMonthInfo(s);
    updateEventLog(s);
    renderTargetIdolOptions(s);
    setPhase('week_decision');
    updateSummary(s);
    updateChatPenaltyHint(s);
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

    // 偶像徽章 - 只显示羁绊>0的
    const badges = $('#idol-badges');
    badges.innerHTML = '';
    const activeIdols = s.idols.filter(i => i.bond > 0 || i.bondLevel > 0);
    if (activeIdols.length === 0) {
      // 显示所有偶像简要
      s.idols.slice(0, 4).forEach(idol => {
        const badge = document.createElement('span');
        badge.className = 'idol-badge';
        badge.textContent = `${idol.emoji} ${idol.name}`;
        badges.appendChild(badge);
      });
    } else {
      activeIdols.forEach(idol => {
        const badge = document.createElement('span');
        badge.className = 'idol-badge';
        badge.innerHTML = `${idol.emoji} ${idol.name} <span class="bond-level">Lv.${idol.bondLevel}</span>`;
        badges.appendChild(badge);
      });
    }
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
    // 默认选中第一个
    if (!s.choices.targetIdolId && s.idols.length > 0) {
      s.choices.targetIdolId = s.idols[0].id;
      const firstBtn = container.querySelector('.target-idol-btn');
      if (firstBtn) firstBtn.classList.add('selected');
    }
  }

  // 更新聊天"聊舞台"的惩罚提示
  function updateChatPenaltyHint(s) {
    const stageCard = document.querySelector('[data-chat="stage"]');
    if (!stageCard) return;
    const hint = stageCard.querySelector('.penalty-hint');
    if (!hint) return;
    if (s.choices.participationMethod === 'tokuten') {
      hint.style.display = 'block';
    } else {
      hint.style.display = 'none';
    }
  }

  // ==================== 阶段管理 ====================
  function setPhase(phase) {
    currentPhase = phase;

    // 隐藏所有步骤
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

    // 更新阶段指示器
    $$('.phase-dot').forEach(dot => {
      dot.classList.remove('active', 'completed');
    });
    const dotMap = {
      'week_decision': 'week_decision',
      'week_method': 'week_method',
      'week_tokuten': 'week_tokuten',
    };
    const currentDot = dotMap[phase];
    $$('.phase-dot').forEach(dot => {
      const dp = dot.dataset.phase;
      if (dp === currentDot) dot.classList.add('active');
      else if (phase === 'week_tokuten' && (dp === 'week_decision' || dp === 'week_method')) dot.classList.add('completed');
      else if (phase === 'week_method' && dp === 'week_decision') dot.classList.add('completed');
    });

    // 上一步按钮
    if (phase === 'week_decision') {
      $('#btn-prev-phase').style.display = 'none';
    } else {
      $('#btn-prev-phase').style.display = 'inline-flex';
    }

    // 确认按钮文字
    $('#btn-confirm-week').textContent = phase === 'week_tokuten' ? '确认行动' : '下一步';
  }

  function updateSummary(s) {
    const cost = Game.calcWeekCost();
    const c = s.choices;

    if (c.participate === null) {
      $('#sum-participate').textContent = '-';
      $('#sum-method').textContent = '-';
    } else if (!c.participate) {
      $('#sum-participate').textContent = '⏭️ 休息';
      $('#sum-method').textContent = '-';
    } else {
      $('#sum-participate').textContent = '✅ 参加';
      const method = PARTICIPATION_METHODS[c.participationMethod];
      $('#sum-method').textContent = method ? method.name : '-';
    }

    const targetIdol = s.idols.find(i => i.id === c.targetIdolId);
    $('#sum-idol').textContent = targetIdol ? targetIdol.name : '-';

    const ticket = c.ticketType ? TICKET_TYPES[c.ticketType] : null;
    $('#sum-ticket').textContent = ticket ? ticket.name : '-';

    const chat = c.chatMethod ? CHAT_METHODS[c.chatMethod] : null;
    $('#sum-chat').textContent = chat ? chat.name : '-';

    // 数值
    if (cost.skip) {
      $('#sum-cost-economy').textContent = '0';
      $('#sum-cost-energy').textContent = '+5';
      $('#sum-gain-mood').textContent = '-2';
      $('#sum-gain-bond').textContent = '0';
    } else {
      $('#sum-cost-economy').textContent = '-' + cost.economy;
      $('#sum-cost-energy').textContent = '-' + cost.energy;
      $('#sum-gain-mood').textContent = (cost.mood >= 0 ? '+' : '') + cost.mood;
      $('#sum-gain-bond').textContent = '+' + cost.bond;
    }

    // 惩罚提示
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
        if (!card.dataset.participate) return;
        const s = Game.getState();
        s.choices.participate = card.dataset.participate === 'yes';
        $$('#action-step-decide .choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        if (s.choices.participate) {
          // 参加 → 进入方式选择
          setPhase('week_method');
        } else {
          // 休息 → 直接显示确认
          setPhase('week_decision'); // 保持但更新summary
          updateSummary(s);
        }
        updateSummary(s);
      });
    });

    // 阶段2：参与方式
    $$('#action-step-method .choice-card').forEach(card => {
      card.addEventListener('click', () => {
        const s = Game.getState();
        const method = PARTICIPATION_METHODS[card.dataset.method];
        if (!method) return;

        if (s.economy < method.cost.economy || s.energy < method.cost.energy) {
          showToast('经济或精力不足以选择此方式');
          return;
        }

        $$('#action-step-method .choice-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        s.choices.participationMethod = card.dataset.method;

        updateChatPenaltyHint(s);
        updateSummary(s);

        // 如果选了"只是看现场"，跳过特典
        if (method.skipTokuten) {
          // 直接确认
          s.choices.ticketType = null;
          s.choices.chatMethod = null;
        } else {
          // 进入特典+聊天
          setPhase('week_tokuten');
        }
      });
    });

    // 阶段3：买券方式
    $$('#action-step-tokuten .choice-card[data-ticket]').forEach(card => {
      card.addEventListener('click', () => {
        const s = Game.getState();
        const ticket = TICKET_TYPES[card.dataset.ticket];
        if (!ticket) return;

        if (ticket.cost.economy > 0 && s.economy < ticket.cost.economy) {
          showToast('经济不足以选择此买券方式');
          return;
        }

        $$('#action-step-tokuten .choice-card[data-ticket]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        s.choices.ticketType = card.dataset.ticket;
        updateSummary(s);
      });
    });

    // 阶段3：聊天方式
    $$('#action-step-tokuten .choice-card[data-chat]').forEach(card => {
      card.addEventListener('click', () => {
        const s = Game.getState();
        const chat = CHAT_METHODS[card.dataset.chat];
        if (!chat) return;

        $$('#action-step-tokuten .choice-card[data-chat]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        s.choices.chatMethod = card.dataset.chat;
        updateSummary(s);
      });
    });

    // 上一步
    $('#btn-prev-phase').addEventListener('click', () => {
      const s = Game.getState();

      if (currentPhase === 'week_tokuten') {
        setPhase('week_method');
        // 清除特典选择
        s.choices.ticketType = null;
        s.choices.chatMethod = null;
        updateSummary(s);
      } else if (currentPhase === 'week_method') {
        setPhase('week_decision');
        s.choices.participationMethod = null;
        updateSummary(s);
      }
    });

    // 确认行动
    $('#btn-confirm-week').addEventListener('click', () => {
      confirmWeek();
    });
  }

  // ==================== 确认本周行动 ====================
  async function confirmWeek() {
    const s = Game.getState();
    const c = s.choices;

    // 验证
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
      if (!method.skipTokuten) {
        if (!c.targetIdolId) {
          showToast('请选择特典对象');
          setPhase('week_tokuten');
          return;
        }
        if (!c.ticketType) {
          showToast('请选择买券方式');
          setPhase('week_tokuten');
          return;
        }
        if (!c.chatMethod) {
          showToast('请选择聊天内容');
          setPhase('week_tokuten');
          return;
        }
      }
    }

    // 检查经济/精力
    const cost = Game.calcWeekCost();
    if (c.participate && !cost.affordable) {
      showToast('经济或精力不足，无法执行此行动！');
      return;
    }

    // 处理本周行动
    const weekResult = Game.processWeek();

    // 如果有聊天惩罚，先弹窗提示
    if (Game.getState()._chatPenalty) {
      await showChatPenaltyPopup(Game.getState()._chatPenalty);
    }

    updateTopBar(Game.getState());
    updateEventLog(Game.getState());

    // 前进到下一周
    const nextResult = Game.nextWeek();

    if (nextResult.monthEnded) {
      // 月底：事件 → 结算
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

      // 显示月结算
      showSettleScreen();
    } else {
      // 继续下一周
      renderGameScreen();
    }
  }

  // ==================== 聊天惩罚弹窗 ====================
  function showChatPenaltyPopup(desc) {
    return new Promise(resolve => {
      const overlay = $('#overlay-chat-penalty');
      $('#chat-penalty-desc').textContent = desc || '只来特典会却只谈舞台话题，对方感到困惑...';

      const effectsDiv = $('#chat-penalty-effects');
      effectsDiv.innerHTML = '';
      const tag = document.createElement('span');
      tag.className = 'effect-tag negative';
      tag.textContent = '好感度与心情下降';
      effectsDiv.appendChild(tag);

      overlay.classList.add('active');

      const btn = $('#btn-chat-penalty-continue');
      const handler = () => {
        overlay.classList.remove('active');
        btn.removeEventListener('click', handler);
        resolve();
      };
      btn.addEventListener('click', handler);
    });
  }

  // ==================== 事件弹窗 ====================
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

      const continueBtn = $('#btn-event-continue');
      const handler = () => {
        overlay.classList.remove('active');
        continueBtn.removeEventListener('click', handler);
        resolve();
      };
      continueBtn.addEventListener('click', handler);
    });
  }

  // ==================== 月结算屏 ====================
  function showSettleScreen() {
    const s = Game.getState();
    const prev = s.prevStats || { economy: 0, energy: 0, mood: 0 };

    const ecoDelta = s.economy - prev.economy;
    const engDelta = s.energy - prev.energy;
    const moodDelta = s.mood - prev.mood;

    // 羁绊信息
    const activeIdols = s.idols.filter(i => i.bond > 0);
    if (activeIdols.length === 1) {
      const idol = activeIdols[0];
      $('#settle-bond').textContent = `${idol.name}: ${Game.getBondLevelName(idol.bondLevel)} (${idol.bond})`;
    } else if (activeIdols.length > 0) {
      $('#settle-bond').textContent = activeIdols.map(idol =>
        `${idol.emoji}${Game.getBondLevelName(idol.bondLevel)}(${idol.bond})`
      ).join(' / ');
    } else {
      $('#settle-bond').textContent = '无';
    }

    // 数值变化
    $('#settle-economy').textContent = s.economy;
    renderDelta('settle-economy-delta', ecoDelta);
    $('#settle-energy').textContent = s.energy + '/' + s.energyCap;
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

    const btnNext = $('#btn-next-month');
    if (s.turn >= TOTAL_MONTHS) {
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
    $('#btn-next-month').addEventListener('click', () => {
      const result = Game.nextMonth();
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
      { label: '📅 回合', value: s.turn + '/25个月' },
    ];
    pStats.forEach(st => {
      const div = document.createElement('div');
      div.className = 'ending-stat-item';
      div.innerHTML = `<span class="value">${st.value}</span>`;
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

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

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
    initGamePanel();
    initSettle();
    initEnding();
  }

  return { init };
})();

// 启动
document.addEventListener('DOMContentLoaded', () => UI.init());
