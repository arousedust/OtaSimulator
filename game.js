/* ============================
   game.js - 游戏核心引擎（月/周制）
   偶像数值: mental / affection / awareness
   特典: 逐偶像延迟结算，会话池驱动
   ============================ */

const Game = (() => {
  let state = null;

  function initState(characterType, name) {
    const config = CHARACTER_CONFIGS[characterType];
    const idols = IDOL_POOL.map(def => {
      const idol = {
        id: def.id, name: def.name, emoji: def.emoji,
        mental: def.mental, affection: def.affection, awareness: def.awareness || 50,
        tags: [],
      };
      // ★ 应用偶像初始被动标签
      if (def.initialTags) {
        def.initialTags.forEach(tagId => addIdolTag(idol, tagId));
      }
      return idol;
    });
    state = {
      character: characterType, turn: 1, week: 1, phase: 'week_decision',
      economy: config.economy.initial, mood: config.mood.initial,
      playerName: name || '无名OTA',
      idols, knownIdols: [], playerTags: [],
      cutCounts: {},
      actionLog: { participate: 0, rest: 0, cheer: 0, watch: 0, tokuten: 0, stash: 0, totalWeeks: 0 },
      choices: { participate: null, participationMethod: null, tokutenSelections: [], cheerTargetIds: [] },
      modifiers: { economyRecoveryMod: 1, moodDrainMod: 1 },
      eventLog: [], turnEvents: [], gameOverReason: null, prevStats: null,
      _tokutenInteractions: [],
    };
    // ★ 应用玩家初始被动标签（按身份差异化）
    if (characterType === 'worker') addPlayerTag(state, 'it_ota');
    else if (characterType === 'student') addPlayerTag(state, 'natural_charm');
    return state;
  }

  function getState() { return state; }

  // ==================== 工具 ====================
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function clampIdolStats(idol) {
    idol.mental = clamp(idol.mental, 0, 100);
    idol.affection = clamp(idol.affection, 0, 100);
    idol.awareness = clamp(idol.awareness ?? 50, 0, 100);
  }
  function clampPlayerStats() { state.economy = Math.max(0, state.economy); state.mood = clamp(state.mood, 0, 100); }
  function resetChoices() { state.choices = { participate: null, participationMethod: null, tokutenSelections: [], cheerTargetIds: [] }; }
  function addKnownIdol(idolId) {
    if (!state.knownIdols.some(k => k.idolId === idolId)) {
      const idol = state.idols.find(i => i.id === idolId);
      if (idol) state.knownIdols.push({ idolId: idol.id, name: idol.name, emoji: idol.emoji });
    }
  }

  // ==================== 月/周流程 ====================
  function startMonth() {
    const config = CHARACTER_CONFIGS[state.character];
    state.prevStats = { economy: state.economy, mood: state.mood };
    const ecoRecovery = Math.round(config.economy.recovery * state.modifiers.economyRecoveryMod);
    const moodDrain = Math.round(config.mood.monthlyDrain * state.modifiers.moodDrainMod);
    const tagMods = collectPlayerModifiers(state);
    state.economy += Math.round(ecoRecovery * (tagMods.monthlyEconomyMult || 1));
    state.mood -= Math.round(moodDrain * (tagMods.monthlyMoodDrainMult || 1));
    state.modifiers = { economyRecoveryMod: 1, moodDrainMod: 1 };
    state.week = 1; state.turnEvents = [];
    tickPlayerTags(state); tickIdolTags(state);

    // ★ weekStart 节点事件
    const wsEvent = checkNodeEvents(state, 'weekStart');
    state._nodeEvent = wsEvent;
    state._endRound = wsEvent ? !!wsEvent.endRound : false;
    if (wsEvent && !wsEvent.choices) { applyEventEffect(wsEvent, wsEvent.effect, wsEvent.idolEffect); state.turnEvents.push(wsEvent); }

    state.phase = 'week_decision'; resetChoices(); clampPlayerStats();
  }

  // ★ processWeek: 经济立即结算，偶像互动延迟到 UI
  function processWeek() {
    const c = state.choices;
    state._tokutenInteractions = [];

    // ★ 行动计数（在处理前记录，确保 rest 也被统计）
    state.actionLog.totalWeeks++;
    if (!c.participate) { state.actionLog.rest++; state.mood -= 2; clampPlayerStats(); state.phase = 'week_settle'; return { skip: true }; }
    state.actionLog.participate++;
    if (c.participationMethod) state.actionLog[c.participationMethod] = (state.actionLog[c.participationMethod] || 0) + 1;
    const method = PARTICIPATION_METHODS[c.participationMethod];
    if (!method) { state.phase = 'week_settle'; return { skip: true }; }

    // 参与方式基础消耗（立即）
    state.economy -= method.cost.economy;
    state.mood += method.effect.mood;

    // ★ tag 行动惩罚：标签带有 actionPenalty 且匹配当前参与方式时追加消耗
    (state.playerTags || []).forEach(tag => {
      const def = PLAYER_TAG_DEFS[tag.id];
      if (!def || !def.actionPenalty) return;
      const penalty = def.actionPenalty[c.participationMethod];
      if (!penalty) return;
      if (penalty.economy) state.economy -= penalty.economy;
      if (penalty.mood) state.mood += penalty.mood;
    });

    // ★ 参与方式首次选择时授予标签（如专注现实生活 → focusing_life）
    if (method.onApplyTag) addPlayerTag(state, method.onApplyTag);

    const tagMods = collectPlayerModifiers(state);
    const econMult = tagMods.tokutenEconomyMult || 1;
    const moodMult = tagMods.tokutenMoodMult || 1;

    // ---- 特典：逐偶像生成互动数据，经济立即结算 ----
    if (!method.skipTokuten && c.tokutenSelections.length > 0) {
      // ★ preTokuten 节点事件
      const preEvt = checkNodeEvents(state, 'preTokuten');
      state._nodeEvent = preEvt;
      if (preEvt && preEvt.endRound) {
        if (!preEvt.choices) { applyEventEffect(preEvt, preEvt.effect, preEvt.idolEffect); state.turnEvents.push(preEvt); }
        state.phase = 'week_settle';
        return { skip: false, endRound: true };
      }
      if (preEvt && !preEvt.endRound) {
        if (!preEvt.choices) applyEventEffect(preEvt, preEvt.effect, preEvt.idolEffect);
        // endRound=false: 继续正常流程
      }
      state._tokutenEvents = [];

      c.tokutenSelections.forEach(sel => {
        const idol = state.idols.find(i => i.id === sel.idolId);
        if (!idol) return;

        const ticketResult = calcTicketEffect(sel.ticketCount || 1);
        sel.ticketResult = ticketResult;
        const w = ticketResult.weight;

        // 经济（立即结算）
        state.economy -= Math.round(Math.abs(ticketResult.economy) * econMult);

        // 参与方式 idolEffect（立即）
        if (method.idolEffect) {
          idol.mental += method.idolEffect.mental || 0;
          idol.affection += method.idolEffect.affection || 0;
        }

        // ★ postTicket 节点事件（仅第一个偶像触发一次）
        if (!state._nodeEvent) {
          const postEvt = checkNodeEvents(state, 'postTicket');
          state._nodeEvent = postEvt;
          if (postEvt && !postEvt.choices) { applyEventEffect(postEvt, postEvt.effect, postEvt.idolEffect); state.turnEvents.push(postEvt); }
        }

        // endRound: 跳过会话
        if (state._nodeEvent && state._nodeEvent.endRound) { addKnownIdol(sel.idolId); return; }

        // ★ 选择会话（延迟结算），传入该偶像累计切数
        const cutCount = state.cutCounts[sel.idolId] || 0;
        const interaction = selectConversation(state, idol, cutCount);
        state._tokutenInteractions.push({
          idolId: idol.id, idolName: idol.name, idolEmoji: idol.emoji,
          ticketResult, interaction, w,  // w 供 UI 乘算
        });

        addKnownIdol(sel.idolId);

        // 特典事件概率触发
        const eventChance = Math.min(ticketResult.eventChance + (tagMods.tokutenEventChanceAdd || 0), 0.95);
        if (Math.random() < eventChance) {
            const eligible = TOKUTEN_EVENT_POOL.filter(te => {
            if (!te.repeatable && state.turnEvents.some(t => t.id === te.id)) return false;
            if (te.minTurn && state.turn < te.minTurn) return false;
            if (!matchRequiredPlayerTag(state, te.requiredPlayerTag)) return false;
            if (!matchRequiredIdolTag(idol, te.requiredIdolTag)) return false;
            return te.condition ? te.condition(state, idol) : true;
          });
          if (eligible.length > 0) {
            const tevt = eligible[Math.floor(Math.random() * eligible.length)];
            // 无 choices: 立即结算  /  有 choices: 延迟到 UI
            if (!tevt.choices) { resolveEvent(state, tevt); }
            state.turnEvents.push(tevt);
            state.eventLog.push({ turn: state.turn, name: tevt.name, desc: tevt.desc });
            state._tokutenEvents.push(tevt);
          }
        }
      });

    } else if (method.skipTokuten) {
      const targetId = c.tokutenSelections[0]?.idolId || state.idols[0].id;
      const target = state.idols.find(i => i.id === targetId);
      if (target && method.idolEffect) {
        target.mental += method.idolEffect.mental || 0;
        target.affection += method.idolEffect.affection || 0;
      }
    }

    // 现场应援切偶像
    if (c.participationMethod === 'cheer' && c.cheerTargetIds.length > 0) {
      c.cheerTargetIds.forEach(idolId => {
        const idol = state.idols.find(i => i.id === idolId);
        if (!idol) return;
        state.mood -= 1; idol.affection += 5;
      });
    }

    // ★ 更新累计切数 + gachi 标签
    c.tokutenSelections.forEach(sel => {
      state.cutCounts[sel.idolId] = (state.cutCounts[sel.idolId] || 0) + (sel.ticketCount || 1);
      tryGrantGachi(state, sel.idolId);
    });

    // ★ 吃醋检查：偶像 A 累计切数≥20，本次没切A但切了别人 → 概率获得 jealous 标签
    const thisWeekIds = c.tokutenSelections.map(sel => sel.idolId);
    state.idols.forEach(idol => {
      const cut = state.cutCounts[idol.id] || 0;
      if (cut >= 20 && !thisWeekIds.includes(idol.id) && thisWeekIds.length > 0) {
        if (Math.random() < 0.35) {
          addIdolTag(idol, 'jealous');
          state.eventLog.push({ turn: state.turn, name: `${idol.name}吃醋了`, desc: `${idol.name}发了一条微博：「今天熟悉的人没有来...有点难过。」` });
        }
      }
    });

    clampPlayerStats(); state.idols.forEach(clampIdolStats);
    state.phase = 'week_settle';
    return { skip: false };
  }

  // ★ 应用单条偶像互动效果（UI 逐偶像调用）
  function applyTokutenInteraction(interactionData, choiceIndex, chatIndex) {
    const { idolId, ticketResult, interaction, w } = interactionData;
    const idol = state.idols.find(i => i.id === idolId);
    if (!idol) return null;
    const finalW = (idol.tags || []).some(t => t.id === 'ojousama') ? 1.0 : w;

    const tagMods = collectPlayerModifiers(state);
    const idolMods = collectIdolModifiers(idol);
    const moodMult = tagMods.tokutenMoodMult || 1;
    const affMult = (tagMods.idolAffectionMult || 1) * (idolMods.affectionGainMult || 1);
    const menMult = (tagMods.idolMentalMult || 1) * (idolMods.mentalGainMult || 1);

    let effect, idolEffect, grantTag;

    if (interaction.type === 'special_event' && choiceIndex != null) {
      // 特殊事件：使用事件专属选择的 effects
      const choice = interaction.data.choices[choiceIndex];
      if (!choice) return null;
      effect = choice.effect || {};
      idolEffect = choice.idolEffect || {};
      grantTag = choice.grantTag;
    } else if (chatIndex != null) {
      // 特殊会话/普通会话：使用玩家聊天选项的 effects
      const availableChats = getAvailableChats(state.playerTags);
      const chat = availableChats[chatIndex];
      if (!chat) return null;
      effect = chat.effect || {};
      idolEffect = chat.idolEffect || {};
      grantTag = chat.grantTag;
    } else {
      return null;
    }

    // 应用效果（聊天效果 × ticket weight × 各 multiplier）
    state.mood += Math.round((effect.mood || 0) * finalW * moodMult);
    idol.mental += Math.round((idolEffect.mental || 0) * finalW * menMult);
    idol.affection += Math.round((idolEffect.affection || 0) * finalW * affMult);
    const awarenessGain = Math.round((idolEffect.awareness || 0) * finalW);
    idol.awareness = (idol.awareness ?? 50) + awarenessGain;

    // 聊天选择附带的标签（概率获得）
    if (grantTag) {
      const tagId = typeof grantTag === 'string' ? grantTag : grantTag.tagId;
      const chance = typeof grantTag === 'string' ? 1.0 : (grantTag.chance ?? 1.0);
      if (Math.random() < chance) addPlayerTag(state, tagId);
    }

    clampPlayerStats(); clampIdolStats(idol);
    return { effect, idolEffect };
  }

  function nextWeek() {
    state._chatPenalty = null;

    // ★ 每周结束时检查提前结局条件
    if (checkGameOver()) {
      state.phase = 'month_end';
      return { weekEnded: true, monthEnded: true, gameOver: true };
    }

    state.week++;
    if (state.week > WEEKS_PER_MONTH) {
      state.phase = 'month_end';
      const events = triggerEvents();
      const gameOver = settleMonth();
      return { weekEnded: true, monthEnded: true, events, gameOver };
    }
    tickPlayerTags(state); tickIdolTags(state);

    // ★ weekStart 节点事件
    const wsEvent = checkNodeEvents(state, 'weekStart');
    state._nodeEvent = wsEvent;
    state._endRound = wsEvent ? !!wsEvent.endRound : false;
    if (wsEvent && !wsEvent.choices) { applyEventEffect(wsEvent, wsEvent.effect, wsEvent.idolEffect); state.turnEvents.push(wsEvent); }

    resetChoices(); state.phase = 'week_decision';
    return { weekEnded: true, monthEnded: false };
  }

  function settleMonth() { state.idols.forEach(clampIdolStats); return checkGameOver(); }

  function triggerEvents() {
    // 仅月度事件（无 triggerNode）+ requiredTag 过滤
    const eligible = EVENT_POOL.filter(evt => {
      if (evt.triggerNode) return false;
      if (state.turnEvents.some(te => te.id === evt.id)) return false;
      if (!matchRequiredTag(state, evt)) return false;
      return evt.condition(state);
    });
    if (eligible.length === 0) return [];
    eligible.sort((a, b) => (a.priority || 3) - (b.priority || 3));
    const count = Math.random() < 0.3 ? 2 : 1;
    const selected = []; const pool = [...eligible];
    for (let i = 0; i < count && pool.length > 0; i++) {
      selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    selected.forEach(evt => {
      if (!evt.choices) resolveEvent(state, evt);
      state.turnEvents.push(evt);
      state.eventLog.push({ turn: state.turn, name: evt.name, desc: evt.desc });
    });
    clampPlayerStats(); state.idols.forEach(clampIdolStats);
    return selected;
  }

  function applyEventEffect(evt, effect, idolEffect) { resolveEvent(state, evt); }

  function applyChoiceEvent(evt, choiceIndex) {
    const choice = evt.choices[choiceIndex];
    if (!choice) return null;
    resolveEvent(state, evt, choice);
    clampPlayerStats(); state.idols.forEach(clampIdolStats);
    return choice;
  }

  function getAvailableSpecialActions() { return [...(state.unlockedActions || [])]; }

  function checkGameOver() {
    // 遍历 ENDING_LIST 中所有提前结局，首个条件匹配即触发
    for (const ending of ENDING_LIST) {
      if (!ending.isEarly) continue;
      if (ending.condition(state)) {
        state.gameOverReason = ending.id;
        return true;
      }
    }
    // 额外动态注册的特殊提前结局（EARLY_END_TRIGGERS）
    for (const trigger of EARLY_END_TRIGGERS) {
      if (trigger.condition(state)) { state.gameOverReason = 'early_special'; state._earlyEndReason = trigger.reason; return true; }
    }
    return false;
  }

  function nextMonth() { state.turn++; if (state.turn > TOTAL_MONTHS) return { ended: true, ending: determineEnding() }; startMonth(); return { ended: false }; }

  function determineEnding() {
    // 特殊提前结局（从 EARLY_END_TRIGGERS 动态触发）
    if (state.gameOverReason === 'early_special' && state._earlyEndReason) {
      return { title:'意外终结', desc: state._earlyEndReason };
    }
    // 遍历 ENDING_LIST，首个条件匹配即为结局
    for (const ending of ENDING_LIST) {
      if (ending.condition(state)) return { title: ending.title, desc: ending.desc };
    }
    return { title:'迷途之羊', desc:'几个月过去了，你既没有建立深厚的感情，也没有找到应援的意义...' };
  }

  function calcWeekCost() {
    const c = state.choices;
    if (!c.participate) return { economy: 0, mood: -2, skip: true };
    const method = PARTICIPATION_METHODS[c.participationMethod];
    if (!method) return { economy: 0, mood: 0, skip: true };
    const tagMods = collectPlayerModifiers(state);
    const econMult = tagMods.tokutenEconomyMult || 1;
    let economy = method.cost.economy;
    let mood = method.effect.mood;
    if (!method.skipTokuten) {
      c.tokutenSelections.forEach(sel => {
        const ticketResult = calcTicketEffect(sel.ticketCount || 1);
        economy += Math.round(Math.abs(ticketResult.economy) * econMult);
      });
    }
    if (c.participationMethod === 'cheer') mood -= c.cheerTargetIds.length * 1;
    return { economy, mood, skip: false, hasTokuten: !method.skipTokuten, affordable: state.economy >= economy };
  }

  function reset() { state = null; }

  // ★ 外部增加切数接口（事件等调用）
  function addCutCount(idolId, amount) {
    state.cutCounts[idolId] = (state.cutCounts[idolId] || 0) + (amount || 1);
  }

  return {
    initState, getState, startMonth, processWeek, applyTokutenInteraction, nextWeek,
    settleMonth, triggerEvents, nextMonth, determineEnding,
    calcWeekCost, checkGameOver, reset,
    resetChoices, addKnownIdol, applyChoiceEvent, getAvailableSpecialActions,
    addCutCount,
  };
})();
