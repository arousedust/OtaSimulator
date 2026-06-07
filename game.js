/* ============================
   game.js - 游戏核心引擎（月/周制）
   ============================ */

const Game = (() => {
  // ==================== 游戏状态 ====================
  let state = null;

  // ==================== 初始化 ====================
  function initState(characterType) {
    const config = CHARACTER_CONFIGS[characterType];
    // 所有偶像默认存在（不需要选择推哪些）
    const idols = IDOL_POOL.map(def => ({
      id: def.id,
      name: def.name,
      emoji: def.emoji,
      mental: def.mental,
      affection: def.affection,
      attention: def.attention,
      bond: 0,
      bondLevel: 0,
    }));

    state = {
      character: characterType,
      turn: 1,                    // 月 1-25
      week: 1,                    // 周 1-4
      phase: 'week_decision',     // 'week_decision' | 'week_method' | 'week_tokuten' | 'week_settle' | 'month_end'
      economy: config.economy.initial,
      energy: config.energy.initial,
      energyCap: config.energy.cap,
      mood: config.mood.initial,
      idols: idols,
      choices: {
        participate: null,
        participationMethod: null,
        targetIdolId: null,
        ticketType: null,
        chatMethod: null,
      },
      modifiers: {
        economyRecoveryMod: 1,
        energyRecoveryMod: 1,
        moodDrainMod: 1,
      },
      eventLog: [],
      turnEvents: [],
      gameOverReason: null,
      prevStats: null,
    };
    return state;
  }

  function getState() { return state; }

  // ==================== 工具函数 ====================
  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  function clampIdolStats(idol) {
    idol.mental = clamp(idol.mental, 0, 100);
    idol.affection = clamp(idol.affection, 0, 100);
    idol.attention = clamp(idol.attention, 0, 100);
  }

  function clampPlayerStats() {
    state.economy = Math.max(0, state.economy);
    state.energy = clamp(state.energy, 0, state.energyCap);
    state.mood = clamp(state.mood, 0, 100);
  }

  function getBondLevel(bond) {
    for (let i = BOND_LEVELS.length - 1; i >= 0; i--) {
      if (bond >= BOND_LEVELS[i].minBond) return BOND_LEVELS[i].level;
    }
    return 0;
  }

  function getBondLevelName(level) {
    return BOND_LEVELS[level]?.name || '路人';
  }

  function resetChoices() {
    state.choices = {
      participate: null,
      participationMethod: null,
      targetIdolId: null,
      ticketType: null,
      chatMethod: null,
    };
  }

  // ==================== 月/周流程 ====================

  // 月份开始：发放工资、扣除月耗
  function startMonth() {
    const config = CHARACTER_CONFIGS[state.character];

    // 保存快照
    state.prevStats = {
      economy: state.economy,
      energy: state.energy,
      mood: state.mood,
    };

    // 应用恢复
    const ecoRecovery = Math.round(config.economy.recovery * state.modifiers.economyRecoveryMod);
    const engRecovery = Math.round(config.energy.recovery * state.modifiers.energyRecoveryMod);
    const moodDrain = Math.round(config.mood.monthlyDrain * state.modifiers.moodDrainMod);

    state.economy += ecoRecovery;
    state.energy = Math.min(state.energy + engRecovery, state.energyCap);
    state.mood -= moodDrain;

    // 重置modifiers
    state.modifiers = {
      economyRecoveryMod: 1,
      energyRecoveryMod: 1,
      moodDrainMod: 1,
    };

    // 回到第1周
    state.week = 1;
    state.turnEvents = [];
    state.phase = 'week_decision';
    resetChoices();

    clampPlayerStats();
  }

  // 处理本周行动
  function processWeek() {
    const c = state.choices;

    if (!c.participate) {
      // 休息：小幅恢复精力，小幅心情下降
      state.energy = Math.min(state.energy + 5, state.energyCap);
      state.mood -= 2;
      clampPlayerStats();
      state.phase = 'week_settle';
      return { skip: true };
    }

    const method = PARTICIPATION_METHODS[c.participationMethod];
    if (!method) { state.phase = 'week_settle'; return { skip: true }; }

    // 扣除参与方式消耗
    state.economy -= method.cost.economy;
    state.energy -= method.cost.energy;
    state.mood += method.effect.mood;
    let totalBond = method.effect.bond;

    // 非"只是看现场"则进入特典+聊天
    if (!method.skipTokuten && c.ticketType && c.chatMethod) {
      const ticket = TICKET_TYPES[c.ticketType];
      const chat = CHAT_METHODS[c.chatMethod];

      if (ticket && chat) {
        // 买券经济消耗
        state.economy -= ticket.cost.economy;
        state.mood += ticket.effect.mood + chat.effect.mood;
        totalBond += ticket.effect.bond + chat.effect.bond;

        const targetIdol = state.idols.find(i => i.id === c.targetIdolId);
        if (targetIdol) {
          targetIdol.bond += totalBond;
          targetIdol.bondLevel = getBondLevel(targetIdol.bond);

          // 参与方式对偶像影响
          if (method.idolEffect) {
            targetIdol.mental += method.idolEffect.mental || 0;
            targetIdol.affection += method.idolEffect.affection || 0;
            targetIdol.attention += method.idolEffect.attention || 0;
          }
          // 买券对偶像影响
          if (ticket.idolEffect) {
            targetIdol.mental += ticket.idolEffect.mental || 0;
            targetIdol.affection += ticket.idolEffect.affection || 0;
            targetIdol.attention += ticket.idolEffect.attention || 0;
          }
          // 聊天对偶像影响
          if (chat.idolEffect) {
            targetIdol.mental += chat.idolEffect.mental || 0;
            targetIdol.affection += chat.idolEffect.affection || 0;
            targetIdol.attention += chat.idolEffect.attention || 0;
          }

          // 聊舞台惩罚
          if (chat.penaltyCondition && chat.penaltyCondition(state)) {
            state.mood += chat.penalty.mood || 0;
            targetIdol.bond = Math.max(0, targetIdol.bond + (chat.penalty.bond || 0));
            if (chat.penaltyIdolEffect) {
              targetIdol.mental += chat.penaltyIdolEffect.mental || 0;
              targetIdol.affection += chat.penaltyIdolEffect.affection || 0;
              targetIdol.attention += chat.penaltyIdolEffect.attention || 0;
            }
            // 记录惩罚标记
            state._chatPenalty = chat.penaltyDesc || '';
          }
        }
      }
    } else if (!method.skipTokuten) {
      // 有特典但未选完（验证应在UI层阻止）
    }

    // 非特典时，参与方式的基础羁绊加到第一个互动最多的偶像
    if (method.skipTokuten || !c.ticketType) {
      // 默认加给最近互动的偶像或第一个
      const target = state.idols.find(i => i.id === c.targetIdolId) || state.idols[0];
      if (target) {
        target.bond += totalBond;
        target.bondLevel = getBondLevel(target.bond);
        if (method.idolEffect) {
          target.mental += method.idolEffect.mental || 0;
          target.affection += method.idolEffect.affection || 0;
          target.attention += method.idolEffect.attention || 0;
        }
      }
    }

    clampPlayerStats();
    state.idols.forEach(clampIdolStats);
    state.phase = 'week_settle';

    return { skip: false };
  }

  // 前进到下一周
  function nextWeek() {
    const wasPenalty = state._chatPenalty;
    state._chatPenalty = null;

    state.week++;
    if (state.week > WEEKS_PER_MONTH) {
      // 月底：触发事件 → 检查结束
      state.phase = 'month_end';
      const events = triggerEvents();
      const gameOver = settleMonth();
      return { weekEnded: true, monthEnded: true, events, gameOver, chatPenalty: wasPenalty };
    }

    // 下一个小回合
    resetChoices();
    state.phase = 'week_decision';
    return { weekEnded: true, monthEnded: false, chatPenalty: wasPenalty };
  }

  // 月份结算
  function settleMonth() {
    state.idols.forEach(idol => {
      idol.bondLevel = getBondLevel(idol.bond);
    });

    // 缓慢衰减未互动的偶像
    // (这里简单处理：所有偶像微幅关注度下降，模拟时间推移)
    state.idols.forEach(idol => {
      idol.attention = Math.max(0, idol.attention - 4);
      clampIdolStats(idol);
    });

    return checkGameOver();
  }

  // 触发事件（月底）
  function triggerEvents() {
    const eligibleEvents = EVENT_POOL.filter(evt => {
      if (state.turnEvents.some(te => te.id === evt.id)) return false;
      return evt.condition(state);
    });

    if (eligibleEvents.length === 0) return [];

    eligibleEvents.sort((a, b) => (a.priority || 3) - (b.priority || 3));

    const count = Math.random() < 0.3 ? 2 : 1;
    const selected = [];
    const pool = [...eligibleEvents];

    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(idx, 1)[0]);
    }

    selected.forEach(evt => {
      if (evt.effect) {
        if (evt.effect.economy) state.economy += evt.effect.economy;
        if (evt.effect.energy) state.energy += evt.effect.energy;
        if (evt.effect.mood) state.mood += evt.effect.mood;
      }

      if (evt.idolEffect) {
        const targetIdol = state.idols.find(i => i.id === state.choices.targetIdolId);
        if (evt.idolEffect._all) {
          state.idols.forEach(idol => {
            if (evt.idolEffect._all.mental) idol.mental += evt.idolEffect._all.mental;
            if (evt.idolEffect._all.affection) idol.affection += evt.idolEffect._all.affection;
            if (evt.idolEffect._all.attention) idol.attention += evt.idolEffect._all.attention;
          });
        } else if (targetIdol) {
          if (evt.idolEffect.mental) targetIdol.mental += evt.idolEffect.mental;
          if (evt.idolEffect.affection) targetIdol.affection += evt.idolEffect.affection;
          if (evt.idolEffect.attention) targetIdol.attention += evt.idolEffect.attention;
        }
      }

      state.turnEvents.push(evt);
      state.eventLog.push({
        turn: state.turn,
        name: evt.name,
        desc: evt.desc,
      });
    });

    clampPlayerStats();
    state.idols.forEach(clampIdolStats);

    return selected;
  }

  // ==================== 游戏结束检查 ====================
  function checkGameOver() {
    if (state.economy <= 0) {
      state.gameOverReason = 'early_economy';
      return true;
    }
    if (state.energy <= 0) {
      state.gameOverReason = 'early_energy';
      return true;
    }
    if (state.mood <= 0) {
      state.gameOverReason = 'early_mood';
      return true;
    }

    const deadIdols = state.idols.filter(i => i.mental <= 0 || i.affection <= 0);
    if (deadIdols.length >= 2) {
      state.gameOverReason = 'early_idol';
      return true;
    }

    for (const trigger of EARLY_END_TRIGGERS) {
      if (trigger.condition(state)) {
        state.gameOverReason = 'early_special';
        state._earlyEndReason = trigger.reason;
        return true;
      }
    }

    return false;
  }

  // ==================== 前进到下一个月 ====================
  function nextMonth() {
    state.turn++;
    if (state.turn > TOTAL_MONTHS) {
      return { ended: true, ending: determineEnding() };
    }
    startMonth();
    return { ended: false };
  }

  // ==================== 结局判定 ====================
  function determineEnding() {
    if (state.gameOverReason) {
      if (state.gameOverReason === 'early_special' && state._earlyEndReason) {
        return { ...ENDINGS.early_special, desc: state._earlyEndReason };
      }
      return ENDINGS[state.gameOverReason] || ENDINGS.early_special;
    }

    const endingOrder = ['legend', 'true_friend', 'dedicated_fan', 'casual_fan', 'lost_soul'];
    for (const key of endingOrder) {
      const ending = ENDINGS[key];
      if (ending.condition && ending.condition(state)) {
        return ending;
      }
    }
    return ENDINGS.lost_soul;
  }

  // ==================== 计算本周消耗预览 ====================
  function calcWeekCost() {
    const c = state.choices;
    if (!c.participate) {
      return { economy: 0, energy: -5, mood: -2, bond: 0, skip: true };
    }

    const method = PARTICIPATION_METHODS[c.participationMethod];
    if (!method) return { economy: 0, energy: 0, mood: 0, bond: 0 };

    let economy = method.cost.economy;
    let energy = method.cost.energy;
    let mood = method.effect.mood;
    let bond = method.effect.bond;

    let showPenalty = false;
    let penaltyDesc = '';

    if (!method.skipTokuten && c.ticketType && c.chatMethod) {
      const ticket = TICKET_TYPES[c.ticketType];
      const chat = CHAT_METHODS[c.chatMethod];
      if (ticket && chat) {
        economy += ticket.cost.economy;
        mood += ticket.effect.mood + chat.effect.mood;
        bond += ticket.effect.bond + chat.effect.bond;

        if (chat.penaltyCondition && chat.penaltyCondition(state)) {
          mood += chat.penalty.mood || 0;
          bond += chat.penalty.bond || 0;
          showPenalty = true;
          penaltyDesc = chat.penaltyDesc || '';
        }
      }
    }

    return {
      economy,
      energy,
      mood,
      bond,
      skip: false,
      hasTokuten: !method.skipTokuten,
      showPenalty,
      penaltyDesc,
      affordable: state.economy >= economy && state.energy >= energy,
    };
  }

  // ==================== 重置游戏 ====================
  function reset() {
    state = null;
  }

  // ==================== 公开API ====================
  return {
    initState,
    getState,
    startMonth,
    processWeek,
    nextWeek,
    settleMonth,
    triggerEvents,
    nextMonth,
    determineEnding,
    calcWeekCost,
    checkGameOver,
    reset,
    getBondLevel,
    getBondLevelName,
    resetChoices,
  };
})();
