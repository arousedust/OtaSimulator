/* ============================
   game.js - 游戏核心引擎
   ============================ */

const Game = (() => {
  // ==================== 游戏状态 ====================
  let state = null;

  // ==================== 初始化 ====================
  function initState(characterType, selectedIdolIds) {
    const config = CHARACTER_CONFIGS[characterType];
    const idols = selectedIdolIds.map(id => {
      const def = IDOL_POOL.find(i => i.id === id);
      return {
        id: def.id,
        name: def.name,
        emoji: def.emoji,
        mental: def.mental,
        affection: def.affection,
        attention: def.attention,
        bond: 0,
        bondLevel: 0,
      };
    });

    state = {
      character: characterType,
      turn: 1,
      phase: 'start',     // 'start' | 'action' | 'event' | 'settle'
      actionStep: 1,       // 1-5 行动子步骤
      economy: config.economy.initial,
      energy: config.energy.initial,
      energyCap: config.energy.cap,
      mood: config.mood.initial,
      idols: idols,
      choices: {
        activityCount: 1,
        participationMethod: null,
        ticketCount: 0,
        targetIdolId: idols.length === 1 ? idols[0].id : null,
        tokutenMethod: null,
        specialAction: null,
      },
      modifiers: {
        economyRecoveryMod: 1,
        energyRecoveryMod: 1,
        moodDrainMod: 1,
      },
      eventLog: [],
      turnEvents: [],
      gameOverReason: null,
      prevStats: null,  // 回合开始前的快照，用于结算
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

  // ==================== 回合流程 ====================

  // 阶段1：回合开始 - 恢复数值
  function startTurn() {
    const config = CHARACTER_CONFIGS[state.character];

    // 保存快照
    state.prevStats = {
      economy: state.economy,
      energy: state.energy,
      mood: state.mood,
    };

    // 应用恢复（受modifiers影响）
    const ecoRecovery = Math.round(config.economy.recovery * state.modifiers.economyRecoveryMod);
    const engRecovery = Math.round(config.energy.recovery * state.modifiers.energyRecoveryMod);
    const moodDrain = Math.round(config.mood.monthlyDrain * state.modifiers.moodDrainMod);

    state.economy += ecoRecovery;
    state.energy = Math.min(state.energy + engRecovery, state.energyCap);
    state.mood -= moodDrain;

    // 重置modifiers为默认值（事件可能重新设置）
    state.modifiers = {
      economyRecoveryMod: 1,
      energyRecoveryMod: 1,
      moodDrainMod: 1,
    };

    // 重置当回合选择
    state.choices = {
      activityCount: 1,
      participationMethod: null,
      ticketCount: 0,
      targetIdolId: state.idols.length === 1 ? state.idols[0].id : null,
      tokutenMethod: null,
      specialAction: null,
    };

    state.turnEvents = [];
    state.actionStep = 1;
    state.phase = 'action';

    clampPlayerStats();
  }

  // 阶段2：处理行动选择
  function processAction() {
    const choices = state.choices;
    const method = PARTICIPATION_METHODS[choices.participationMethod];
    const tokuten = TOKUTEN_METHODS[choices.tokutenMethod];

    if (!method || !tokuten) return;

    // 计算总消耗
    const totalEconomyCost =
      method.cost.economy * choices.activityCount +
      TICKET_PRICE * choices.ticketCount +
      tokuten.cost.economy;
    const totalEnergyCost = method.cost.energy * choices.activityCount;

    // 扣除玩家数值
    state.economy -= totalEconomyCost;
    state.energy -= totalEnergyCost;

    // 增加玩家收益
    state.mood += method.effect.mood * choices.activityCount + tokuten.effect.mood;
    const totalBond = method.effect.bond * choices.activityCount + tokuten.effect.bond;

    // 对目标偶像增加羁绊和隐藏数值
    let targetIdol = state.idols.find(i => i.id === choices.targetIdolId);
    // 兜底：如果未指定目标偶像，默认选第一个
    if (!targetIdol && state.idols.length > 0) {
      targetIdol = state.idols[0];
    }
    if (targetIdol) {
      targetIdol.bond += totalBond;
      targetIdol.bondLevel = getBondLevel(targetIdol.bond);

      // 偶活方式对偶像的影响（乘以偶活次数）
      targetIdol.mental += method.idolEffect.mental * choices.activityCount;
      targetIdol.affection += method.idolEffect.affection * choices.activityCount;
      targetIdol.attention += method.idolEffect.attention * choices.activityCount;

      // 特典方式对偶像的影响
      targetIdol.mental += tokuten.idolEffect.mental;
      targetIdol.affection += tokuten.idolEffect.affection;
      targetIdol.attention += tokuten.idolEffect.attention;
    }

    // 处理特殊行动
    if (choices.specialAction) {
      const action = SPECIAL_ACTIONS.find(a => a.id === choices.specialAction);
      if (action) {
        state.economy -= (action.cost.economy || 0);
        state.energy -= (action.cost.energy || 0);
        state.mood += (action.effect.mood || 0);
        if (targetIdol) {
          targetIdol.bond += (action.effect.bond || 0);
          targetIdol.bondLevel = getBondLevel(targetIdol.bond);
        }
      }
    }

    clampPlayerStats();
    state.idols.forEach(clampIdolStats);

    state.phase = 'event';
  }

  // 阶段3：触发事件
  function triggerEvents() {
    const eligibleEvents = EVENT_POOL.filter(evt => {
      // 检查是否已在本次触发过
      if (state.turnEvents.some(te => te.id === evt.id)) return false;
      return evt.condition(state);
    });

    if (eligibleEvents.length === 0) return [];

    // 按优先级排序，高优先级先触发
    eligibleEvents.sort((a, b) => (a.priority || 3) - (b.priority || 3));

    // 随机选1~2个事件
    const count = Math.random() < 0.3 ? 2 : 1;
    const selected = [];
    const pool = [...eligibleEvents];

    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(idx, 1)[0]);
    }

    // 应用事件效果
    selected.forEach(evt => {
      // 玩家数值
      if (evt.effect) {
        if (evt.effect.economy) state.economy += evt.effect.economy;
        if (evt.effect.energy) state.energy += evt.effect.energy;
        if (evt.effect.mood) state.mood += evt.effect.mood;
      }

      // 偶像数值
      if (evt.idolEffect) {
        const targetIdol = state.idols.find(i => i.id === state.choices.targetIdolId);

        if (evt.idolEffect._all) {
          // 影响所有偶像
          state.idols.forEach(idol => {
            if (evt.idolEffect._all.mental) idol.mental += evt.idolEffect._all.mental;
            if (evt.idolEffect._all.affection) idol.affection += evt.idolEffect._all.affection;
            if (evt.idolEffect._all.attention) idol.attention += evt.idolEffect._all.attention;
          });
        } else if (targetIdol) {
          // 只影响目标偶像
          if (evt.idolEffect.mental) targetIdol.mental += evt.idolEffect.mental;
          if (evt.idolEffect.affection) targetIdol.affection += evt.idolEffect.affection;
          if (evt.idolEffect.attention) targetIdol.attention += evt.idolEffect.attention;
        }
      }

      // 记录事件
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

  // 阶段4：结算
  function settleTurn() {
    // 更新所有偶像羁绊等级
    state.idols.forEach(idol => {
      idol.bondLevel = getBondLevel(idol.bond);
    });

    state.phase = 'settle';

    // 检查游戏结束条件
    const gameOver = checkGameOver();
    return gameOver;
  }

  // ==================== 游戏结束检查 ====================
  function checkGameOver() {
    // 条件1：玩家数值归零
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

    // 条件2：2名及以上偶像心理值或好感度归零
    const deadIdols = state.idols.filter(i => i.mental <= 0 || i.affection <= 0);
    if (deadIdols.length >= 2) {
      state.gameOverReason = 'early_idol';
      return true;
    }

    // 条件3：提前结束触发器
    for (const trigger of EARLY_END_TRIGGERS) {
      if (trigger.condition(state)) {
        state.gameOverReason = 'early_special';
        state._earlyEndReason = trigger.reason;
        return true;
      }
    }

    return false;
  }

  // ==================== 结局判定 ====================
  function determineEnding() {
    if (state.gameOverReason) {
      if (state.gameOverReason === 'early_special' && state._earlyEndReason) {
        return {
          ...ENDINGS.early_special,
          desc: state._earlyEndReason,
        };
      }
      return ENDINGS[state.gameOverReason] || ENDINGS.early_special;
    }

    // 按优先级判定正常结局
    const endingOrder = ['legend', 'true_friend', 'dedicated_fan', 'casual_fan', 'lost_soul'];
    for (const key of endingOrder) {
      const ending = ENDINGS[key];
      if (ending.condition && ending.condition(state)) {
        return ending;
      }
    }
    return ENDINGS.lost_soul;
  }

  // ==================== 前进到下一回合 ====================
  function nextTurn() {
    state.turn++;
    if (state.turn > 25) {
      return { ended: true, ending: determineEnding() };
    }
    startTurn();
    return { ended: false };
  }

  // ==================== 计算行动消耗预览 ====================
  function calcActionCost() {
    const choices = state.choices;
    const method = PARTICIPATION_METHODS[choices.participationMethod];
    const tokuten = TOKUTEN_METHODS[choices.tokutenMethod];

    if (!method) {
      return { economy: 0, energy: 0, mood: 0, bond: 0, affordable: true };
    }

    const tokutenEco = tokuten ? tokuten.cost.economy : 0;
    const tokutenMood = tokuten ? tokuten.effect.mood : 0;
    const tokutenBond = tokuten ? tokuten.effect.bond : 0;

    const economy = method.cost.economy * choices.activityCount + TICKET_PRICE * choices.ticketCount + tokutenEco;
    const energy = method.cost.energy * choices.activityCount;
    const mood = method.effect.mood * choices.activityCount + tokutenMood;
    const bond = method.effect.bond * choices.activityCount + tokutenBond;

    return {
      economy,
      energy,
      mood,
      bond,
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
    startTurn,
    processAction,
    triggerEvents,
    settleTurn,
    nextTurn,
    determineEnding,
    calcActionCost,
    checkGameOver,
    reset,
    getBondLevel,
    getBondLevelName,
    clampPlayerStats,
  };
})();
