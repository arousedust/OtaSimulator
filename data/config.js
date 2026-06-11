/* ============================
   data/config.js - 基础设定
   ============================ */

// ==================== 回合常数 ====================
const WEEKS_PER_MONTH = 4;
const TOTAL_MONTHS = 4;

// ==================== 角色配置 ====================
const CHARACTER_CONFIGS = {
  worker: {
    name: '社畜',
    economy: { initial: 5000, recovery: 3000 },
    mood: { initial: 70, monthlyDrain: 20 },
  },
  student: {
    name: '学生',
    economy: { initial: 2000, recovery: 1000 },
    mood: { initial: 70, monthlyDrain: 5 },
  },
};

// ==================== 参与方式消耗表 ====================
const PARTICIPATION_METHODS = {
  cheer: {
    name: '现场应援', emoji: '📣',
    cost: { economy: 100 },
    effect: { mood: 5 },
    idolEffect: { mental: 3, affection: 3 },
  },
  watch: {
    name: '只是看现场', emoji: '👀',
    cost: { economy: 80 },
    effect: { mood: 3 },
    idolEffect: { mental: 0, affection: 0 },
    skipTokuten: true,
  },
  tokuten: {
    name: '只参与特典', emoji: '🎫',
    cost: { economy: 80 },
    effect: { mood: 0 },
    idolEffect: { mental: -3, affection: 0 },
  },
  stash: {
    name: '地藏', emoji: '📦',
    cost: { economy: 80 },
    effect: { mood: 1 },
    idolEffect: { mental: 0, affection: 1 },
  },
  focus_life: {
    name: '专注现实生活', emoji: '🏠',
    cost: { economy: 0 },
    effect: { mood: 5 },
    skipTokuten: true,
    requiredRest: 3,           // 累计 rest ≥ 3 才显示
    onApplyTag: 'focusing_life',  // 首次选择时获得
  },
};

function getAvailableParticipation(state) {
  const result = {};
  const blocked = getBlockedMethods(state);
  for (const [key, m] of Object.entries(PARTICIPATION_METHODS)) {
    if (m.requiredRest && (state.actionLog.rest || 0) < m.requiredRest) continue;
    if (m.requiredTag && !hasPlayerTag(state, m.requiredTag)) continue;
    if (blocked.includes(key)) continue;
    result[key] = m;
  }
  return result;
}

// ==================== 特典券系统（按张数购买，后台量级区分） ====================

const TICKET_PRICE = 100;

const TICKET_TIER = {
  punch_card: { min: 1, max: 2, key: 'punch_card', name: '打卡', emoji: '👋', weight: 1.0, eventChanceBase: 0.03 },
  small:      { min: 3, max: 5, key: 'small', name: '小券', emoji: '🎫', weight: 1.5, eventChanceBase: 0.06 },
  large:      { min: 6, max: 10, key: 'large', name: '大券', emoji: '🎟️', weight: 2.5, eventChanceBase: 0.12 },
  boss:       { min: 11, max: 99, key: 'boss', name: '大爹', emoji: '🌟', weight: 4.0, eventChanceBase: 0.20 },
};

function getTicketTier(count) {
  const n = Math.max(1, Math.round(count));
  if (n <= 2) return TICKET_TIER.punch_card;
  if (n <= 5) return TICKET_TIER.small;
  if (n <= 10) return TICKET_TIER.large;
  return TICKET_TIER.boss;
}

function calcTicketEffect(count) {
  const n = Math.max(1, Math.round(count));
  const tier = getTicketTier(n);
  return {
    economy: -(TICKET_PRICE * n),
    ticketCount: n,
    tier: tier,
    weight: tier.weight,    // 聊天效果仅 × tier.weight
    eventChance: Math.min(tier.eventChanceBase * n, 0.85),
  };
}

// ==================== 聊天方式（固定选项 + 标签触发隐藏选项） ====================
const CHAT_METHODS = {
  casual: {
    name: '随便聊聊', emoji: '💬',
    effect: { mood: 3 },
    idolEffect: { mental: 1, affection: 2, awareness: 1 },
    visible: true,
  },
  hobbies: {
    name: '聊兴趣爱好', emoji: '🎮',
    effect: { mood: 4 },
    idolEffect: { mental: 3, affection: 3, awareness: 1 },
    visible: true,
  },
  stage: {
    name: '聊舞台', emoji: '🎤',
    effect: { mood: 8 },
    idolEffect: { mental: 5, affection: 3, awareness: 2 },
    visible: true,
    penaltyCondition: (s) => s.choices.participationMethod === 'tokuten',
    penalty: { mood: -8 },
    penaltyIdolEffect: { mental: -8, affection: -8 },
    penaltyDesc: '（只来特典会却谈舞台话题，对方感到困惑...）',
  },
  values: {
    name: '聊价值观', emoji: '🤔',
    effect: { mood: 5 },
    idolEffect: { mental: 0, affection: 5, awareness: 3 },
    visible: false,
    requiredTag: 'deep_thinker',
    tagHint: '（深度思考）',
  },
  demand: {
    name: '要求对应', emoji: '💪',
    effect: { mood: 6 },
    idolEffect: { mental: -2, affection: 6, awareness: -3 },
    visible: false,
    requiredTag: 'bold_fan',
    tagHint: '（大胆表达）',
  },
  secret_talk: {
    name: '悄悄话', emoji: '🤫',
    effect: { mood: 7 },
    idolEffect: { mental: 2, affection: 4, awareness: 5 },
    visible: false,
    requiredTag: 'trusted_ota',
    tagHint: '（受信赖）',
  },
};

function getAvailableChatMethods(playerTags) {
  const available = [];
  const tagIds = (playerTags || []).map(t => t.id);
  for (const [key, chat] of Object.entries(CHAT_METHODS)) {
    if (chat.visible) {
      available.push({ key, ...chat });
    } else if (chat.requiredTag && tagIds.includes(chat.requiredTag)) {
      available.push({ key, ...chat });
    }
  }
  return available;
}

function weightedChatEffect(chat, ticketResult) {
  const w = (ticketResult && ticketResult.weight) ? ticketResult.weight : 1;
  return {
    mood: (chat.effect.mood || 0) * w,
    mental: (chat.idolEffect?.mental || 0) * w,
    affection: (chat.idolEffect?.affection || 0) * w,
    awareness: (chat.idolEffect?.awareness || 0) * w,
  };
}

function weightedChatPenalty(chat, ticketResult) {
  const w = (ticketResult && ticketResult.weight) ? ticketResult.weight : 1;
  return {
    mood: (chat.penalty?.mood || 0) * w,
    mental: (chat.penaltyIdolEffect?.mental || 0) * w,
    affection: (chat.penaltyIdolEffect?.affection || 0) * w,
  };
}

// ==================== Modifier 标签对照（供 UI 显示） ====================
const MODIFIER_LABELS = {
  tokutenMoodMult: '特典心情',
  tokutenEconomyMult: '特典花费',
  participateMoodMult: '参与心情',
  participateEconomyMult: '参与花费',
  monthlyEconomyMult: '月度经济',
  monthlyMoodDrainMult: '月度心情消耗',
  idolAffectionMult: '偶像好感',
  idolMentalMult: '偶像心理',
  affectionGainMult: '好感获取',
  mentalGainMult: '心理获取',
  interactMoodMult: '互动心情',
};
