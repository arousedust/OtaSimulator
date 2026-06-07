/* ============================
   data/config.js - 基础设定
   ============================ */

// ==================== 回合常数 ====================
const WEEKS_PER_MONTH = 4;
const TOTAL_MONTHS = 25;

// ==================== 角色配置 ====================
const CHARACTER_CONFIGS = {
  worker: {
    name: '社畜',
    economy: { initial: 5000, recovery: 3000 },
    energy: { initial: 60, cap: 60, recovery: 40 },
    mood: { initial: 70, monthlyDrain: 15 },
  },
  student: {
    name: '学生',
    economy: { initial: 2000, recovery: 1500 },
    energy: { initial: 100, cap: 100, recovery: 80 },
    mood: { initial: 70, monthlyDrain: 5 },
  },
};

// ==================== 参与方式消耗表 ====================
const PARTICIPATION_METHODS = {
  cheer: {
    name: '现场应援', emoji: '📣',
    cost: { economy: 500, energy: 15 },
    effect: { mood: 20, bond: 5 },
    idolEffect: { mental: 3, affection: 5, attention: 2 },
  },
  photo: {
    name: '拍照返图', emoji: '📸',
    cost: { economy: 300, energy: 10 },
    effect: { mood: 12, bond: 3 },
    idolEffect: { mental: 1, affection: 3, attention: 5 },
  },
  watch: {
    name: '只是看现场', emoji: '👀',
    cost: { economy: 200, energy: 5 },
    effect: { mood: 8, bond: 1 },
    idolEffect: { mental: 0, affection: 1, attention: 1 },
    skipTokuten: true,
  },
  tokuten: {
    name: '只参与特典', emoji: '🎫',
    cost: { economy: 100, energy: 3 },
    effect: { mood: 3, bond: 2 },
    idolEffect: { mental: 0, affection: 4, attention: 0 },
  },
};

// ==================== 特典买券方式 ====================
const TICKET_TYPES = {
  small: {
    name: '小券', emoji: '🎫',
    cost: { economy: 200 },
    effect: { mood: 5, bond: 3 },
    idolEffect: { mental: 1, affection: 3, attention: 1 },
    weight: 1,
    eventChance: 0.05,
  },
  large: {
    name: '大券', emoji: '🎟️',
    cost: { economy: 800 },
    effect: { mood: 10, bond: 8 },
    idolEffect: { mental: 2, affection: 6, attention: 2 },
    weight: 3,
    eventChance: 0.20,
  },
  close: {
    name: '关门', emoji: '🌟',
    cost: { economy: 2000 },
    effect: { mood: 25, bond: 15 },
    idolEffect: { mental: 3, affection: 10, attention: 3 },
    weight: 5,
    eventChance: 0.80,
  },
};

// ==================== 聊天方式（基础效果 × 权重 = 最终效果） ====================
const CHAT_METHODS = {
  casual:    { name:'随便聊聊', emoji:'💬', effect:{mood:3,bond:2},          idolEffect:{mental:1,affection:2,attention:1} },
  values:    { name:'聊价值观', emoji:'🤔', effect:{mood:5,bond:4},          idolEffect:{mental:0,affection:5,attention:0} },
  hobbies:   { name:'聊兴趣爱好', emoji:'🎮', effect:{mood:4,bond:3},          idolEffect:{mental:3,affection:3,attention:1} },
  stage:     { name:'聊舞台', emoji:'🎤', effect:{mood:8,bond:5},          idolEffect:{mental:5,affection:3,attention:3},
               penaltyCondition: (s) => s.choices.participationMethod === 'tokuten',
               penalty: { mood: -8, bond: -5 }, penaltyIdolEffect: { mental: -8, affection: -8, attention: -5 },
               penaltyDesc: '（只来特典会却谈舞台话题，对方感到困惑...）' },
  demand:    { name:'要求对应', emoji:'💪', effect:{mood:6,bond:7},          idolEffect:{mental:-2,affection:6,attention:2} },
};

// ★ 聊天效果乘算
function weightedChatEffect(chat, weight) {
  const w = weight || 1;
  return {
    mood: (chat.effect.mood || 0) * w,
    bond: (chat.effect.bond || 0) * w,
    mental: (chat.idolEffect?.mental || 0) * w,
    affection: (chat.idolEffect?.affection || 0) * w,
    attention: (chat.idolEffect?.attention || 0) * w,
  };
}

// ★ 聊天惩罚乘算
function weightedChatPenalty(chat, weight) {
  const w = weight || 1;
  return {
    mood: (chat.penalty?.mood || 0) * w,
    bond: (chat.penalty?.bond || 0) * w,
    mental: (chat.penaltyIdolEffect?.mental || 0) * w,
    affection: (chat.penaltyIdolEffect?.affection || 0) * w,
    attention: (chat.penaltyIdolEffect?.attention || 0) * w,
  };
}

// ==================== 羁绊等级 ====================
const BOND_LEVELS = [
  { level: 0, name: '路人',   minBond: 0 },
  { level: 1, name: '认识',   minBond: 10 },
  { level: 2, name: '熟悉',   minBond: 30 },
  { level: 3, name: '亲友',   minBond: 60 },
  { level: 4, name: '挚友',   minBond: 100 },
  { level: 5, name: '灵魂伴侣', minBond: 150 },
];
