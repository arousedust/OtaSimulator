/* ============================
   game.js - 游戏核心引擎（月/周制）
   ============================ */

const Game = (() => {
  let state = null;

  // ==================== 初始化 ====================
  function initState(characterType) {
    const config = CHARACTER_CONFIGS[characterType];
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
      turn: 1,
      week: 1,
      phase: 'week_decision',
      economy: config.economy.initial,
      energy: config.energy.initial,
      energyCap: config.energy.cap,
      mood: config.mood.initial,
      idols: idols,
      knownIdols: [],            // 特典会相识的偶像 [{idolId, name, emoji, bond}]
      choices: {
        participate: null,
        participationMethod: null,
        tokutenSelections: [],   // [{idolId, ticketType, chatMethod}]
        cheerTargetIds: [],      // 现场应援切偶像（多选已知偶像）
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
      tokutenSelections: [],
      cheerTargetIds: [],
    };
  }

  // 将偶像加入相识列表
  function addKnownIdol(idolId) {
    if (!state.knownIdols.some(k => k.idolId === idolId)) {
      const idol = state.idols.find(i => i.id === idolId);
      if (idol) {
        state.knownIdols.push({
          idolId: idol.id,
          name: idol.name,
          emoji: idol.emoji,
          bond: idol.bond,
        });
      }
    }
  }

  // ==================== 月/周流程 ====================

  function startMonth() {
    const config = CHARACTER_CONFIGS[state.character];
    state.prevStats = {
      economy: state.economy,
      energy: state.energy,
      mood: state.mood,
    };

    const ecoRecovery = Math.round(config.economy.recovery * state.modifiers.economyRecoveryMod);
    const engRecovery = Math.round(config.energy.recovery * state.modifiers.energyRecoveryMod);
    const moodDrain = Math.round(config.mood.monthlyDrain * state.modifiers.moodDrainMod);

    state.economy += ecoRecovery;
    state.energy = Math.min(state.energy + engRecovery, state.energyCap);
    state.mood -= moodDrain;

    state.modifiers = { economyRecoveryMod: 1, energyRecoveryMod: 1, moodDrainMod: 1 };
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
      state.energy = Math.min(state.energy + 5, state.energyCap);
      state.mood -= 2;
      clampPlayerStats();
      state.phase = 'week_settle';
      return { skip: true };
    }

    const method = PARTICIPATION_METHODS[c.participationMethod];
    if (!method) { state.phase = 'week_settle'; return { skip: true }; }

    // 扣除参与方式基础消耗
    state.economy -= method.cost.economy;
    state.energy -= method.cost.energy;
    state.mood += method.effect.mood;
    const methodBond = method.effect.bond;

    let hasChatPenalty = false;

    // ---- 非"只是看现场" → 特典 + 聊天（逐偶像独立配置） ----
    if (!method.skipTokuten && c.tokutenSelections.length > 0) {
      c.tokutenSelections.forEach(sel => {
        const idol = state.idols.find(i => i.id === sel.idolId);
        if (!idol) return;

        const ticket = TICKET_TYPES[sel.ticketType];
        const chat = CHAT_METHODS[sel.chatMethod];
        if (!ticket || !chat) return;

        // 经济 / 心情（每个偶像独立消耗）
        state.economy -= ticket.cost.economy;
        state.mood += ticket.effect.mood + chat.effect.mood;
        const perIdolBond = methodBond + ticket.effect.bond + chat.effect.bond;

        idol.bond += perIdolBond;
        idol.bondLevel = getBondLevel(idol.bond);

        // 偶像隐藏数值
        if (method.idolEffect) {
          idol.mental += method.idolEffect.mental || 0;
          idol.affection += method.idolEffect.affection || 0;
          idol.attention += method.idolEffect.attention || 0;
        }
        if (ticket.idolEffect) {
          idol.mental += ticket.idolEffect.mental || 0;
          idol.affection += ticket.idolEffect.affection || 0;
          idol.attention += ticket.idolEffect.attention || 0;
        }
        if (chat.idolEffect) {
          idol.mental += chat.idolEffect.mental || 0;
          idol.affection += chat.idolEffect.affection || 0;
          idol.attention += chat.idolEffect.attention || 0;
        }

        // 聊舞台惩罚
        if (chat.penaltyCondition && chat.penaltyCondition(state)) {
          state.mood += chat.penalty.mood || 0;
          idol.bond = Math.max(0, idol.bond + (chat.penalty.bond || 0));
          if (chat.penaltyIdolEffect) {
            idol.mental += chat.penaltyIdolEffect.mental || 0;
            idol.affection += chat.penaltyIdolEffect.affection || 0;
            idol.attention += chat.penaltyIdolEffect.attention || 0;
          }
          hasChatPenalty = true;
        }

        // 加入相识列表
        addKnownIdol(sel.idolId);
      });

      if (hasChatPenalty) {
        state._chatPenalty = CHAT_METHODS.stage?.penaltyDesc || '';
      }

    } else if (method.skipTokuten) {
      // 只是看现场
      const targetId = c.tokutenSelections[0]?.idolId || state.idols[0].id;
      const target = state.idols.find(i => i.id === targetId);
      if (target) {
        target.bond += methodBond;
        target.bondLevel = getBondLevel(target.bond);
        if (method.idolEffect) {
          target.mental += method.idolEffect.mental || 0;
          target.affection += method.idolEffect.affection || 0;
          target.attention += method.idolEffect.attention || 0;
        }
      }
    }

    // ---- 现场应援切偶像（额外效果） ----
    if (c.participationMethod === 'cheer' && c.cheerTargetIds.length > 0) {
      c.cheerTargetIds.forEach(idolId => {
        const idol = state.idols.find(i => i.id === idolId);
        if (!idol) return;
        // 额外精力消耗 + 好感度提升
        state.energy -= 5;
        idol.affection += 5;
        idol.attention += 3;
        idol.bond += 2;
        idol.bondLevel = getBondLevel(idol.bond);
      });
    }

    clampPlayerStats();
    state.idols.forEach(clampIdolStats);
    state.phase = 'week_settle';
    return { skip: false };
  }

  function nextWeek() {
    const wasPenalty = state._chatPenalty;
    state._chatPenalty = null;
    state.week++;
    if (state.week > WEEKS_PER_MONTH) {
      state.phase = 'month_end';
      const events = triggerEvents();
      const gameOver = settleMonth();
      return { weekEnded: true, monthEnded: true, events, gameOver, chatPenalty: wasPenalty };
    }
    resetChoices();
    state.phase = 'week_decision';
    return { weekEnded: true, monthEnded: false, chatPenalty: wasPenalty };
  }

  function settleMonth() {
    state.idols.forEach(idol => {
      idol.bondLevel = getBondLevel(idol.bond);
    });
    // 微幅衰减
    state.idols.forEach(idol => {
      idol.attention = Math.max(0, idol.attention - 4);
      clampIdolStats(idol);
    });
    return checkGameOver();
  }

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
        const firstId = state.choices.tokutenSelections[0]?.idolId || state.idols[0]?.id;
        const targetIdol = state.idols.find(i => i.id === firstId);
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
      state.eventLog.push({ turn: state.turn, name: evt.name, desc: evt.desc });
    });

    clampPlayerStats();
    state.idols.forEach(clampIdolStats);
    return selected;
  }

  // ==================== 游戏结束检查 ====================
  function checkGameOver() {
    if (state.economy <= 0) { state.gameOverReason = 'early_economy'; return true; }
    if (state.energy <= 0) { state.gameOverReason = 'early_energy'; return true; }
    if (state.mood <= 0) { state.gameOverReason = 'early_mood'; return true; }
    const deadIdols = state.idols.filter(i => i.mental <= 0 || i.affection <= 0);
    if (deadIdols.length >= 2) { state.gameOverReason = 'early_idol'; return true; }
    for (const trigger of EARLY_END_TRIGGERS) {
      if (trigger.condition(state)) {
        state.gameOverReason = 'early_special';
        state._earlyEndReason = trigger.reason;
        return true;
      }
    }
    return false;
  }

  function nextMonth() {
    state.turn++;
    if (state.turn > TOTAL_MONTHS) {
      return { ended: true, ending: determineEnding() };
    }
    startMonth();
    return { ended: false };
  }

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
      if (ending.condition && ending.condition(state)) return ending;
    }
    return ENDINGS.lost_soul;
  }

  // ==================== 计算本周消耗预览 ====================
  function calcWeekCost() {
    const c = state.choices;
    if (!c.participate) {
      return { economy: 0, energy: -5, mood: -2, skip: true };
    }
    const method = PARTICIPATION_METHODS[c.participationMethod];
    if (!method) return { economy: 0, energy: 0, mood: 0, skip: true };

    let economy = method.cost.economy;
    let energy = method.cost.energy;
    let mood = method.effect.mood;

    let showPenalty = false;
    let penaltyDesc = '';

    // 逐偶像独立计算
    if (!method.skipTokuten) {
      c.tokutenSelections.forEach(sel => {
        const ticket = TICKET_TYPES[sel.ticketType];
        const chat = CHAT_METHODS[sel.chatMethod];
        if (ticket && chat) {
          economy += ticket.cost.economy;
          mood += ticket.effect.mood + chat.effect.mood;
          if (chat.penaltyCondition && chat.penaltyCondition(state)) {
            mood += chat.penalty.mood || 0;
            showPenalty = true;
            penaltyDesc = chat.penaltyDesc || '';
          }
        }
      });
    }

    // 应援切偶像额外消耗
    if (c.participationMethod === 'cheer') {
      energy += c.cheerTargetIds.length * 5;
    }

    return {
      economy, energy, mood,
      skip: false,
      hasTokuten: !method.skipTokuten,
      showPenalty, penaltyDesc,
      affordable: state.economy >= economy && state.energy >= energy,
    };
  }

  function reset() { state = null; }

  // ==================== API ====================
  return {
    initState, getState, startMonth, processWeek, nextWeek,
    settleMonth, triggerEvents, nextMonth, determineEnding,
    calcWeekCost, checkGameOver, reset,
    getBondLevel, getBondLevelName, resetChoices,
    addKnownIdol,
  };
})();
