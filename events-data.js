/* ============================
   events-data.js - 游戏基础数据定义
   ============================ */

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

// ==================== 偶像定义池 ====================
const IDOL_POOL = [
  { id: 'idol_1', name: '星宫莓', desc: '元气满满的偶像新人', emoji: '🍓', mental: 80, affection: 50, attention: 60 },
  { id: 'idol_2', name: '月城雪', desc: '冷淡但有故事的偶像', emoji: '❄️', mental: 65, affection: 40, attention: 70 },
  { id: 'idol_3', name: '日向葵', desc: '温柔治愈系偶像', emoji: '🌻', mental: 85, affection: 60, attention: 50 },
  { id: 'idol_4', name: '天羽凛', desc: '实力派偶像', emoji: '🦅', mental: 70, affection: 35, attention: 80 },
  { id: 'idol_5', name: '花咲音', desc: '天才创作型偶像', emoji: '🎵', mental: 55, affection: 55, attention: 75 },
  { id: 'idol_6', name: '翡翠琉璃', desc: '神秘大人气偶像', emoji: '💎', mental: 75, affection: 30, attention: 90 },
];

// ==================== WEEKS_PER_MONTH ====================
const WEEKS_PER_MONTH = 4;
const TOTAL_MONTHS = 25;

// ==================== 参与方式消耗表 ====================
const PARTICIPATION_METHODS = {
  cheer: {
    name: '现场应援',
    emoji: '📣',
    cost: { economy: 500, energy: 15 },
    effect: { mood: 20, bond: 5 },
    idolEffect: { mental: 3, affection: 5, attention: 2 },
  },
  photo: {
    name: '拍照返图',
    emoji: '📸',
    cost: { economy: 300, energy: 10 },
    effect: { mood: 12, bond: 3 },
    idolEffect: { mental: 1, affection: 3, attention: 5 },
  },
  watch: {
    name: '只是看现场',
    emoji: '👀',
    cost: { economy: 200, energy: 5 },
    effect: { mood: 8, bond: 1 },
    idolEffect: { mental: 0, affection: 1, attention: 1 },
    skipTokuten: true,  // 不进入特典环节
  },
  tokuten: {
    name: '只参与特典',
    emoji: '🎫',
    cost: { economy: 100, energy: 3 },
    effect: { mood: 3, bond: 2 },
    idolEffect: { mental: 0, affection: 4, attention: 0 },
  },
};

// ==================== 特典买券方式（3种） ====================
const TICKET_TYPES = {
  small: {
    name: '小券',
    emoji: '🎫',
    cost: { economy: 200 },
    effect: { mood: 5, bond: 3 },
    idolEffect: { mental: 1, affection: 3, attention: 1 },
    weight: 1,          // 聊天效果乘算权重
    eventChance: 0.05,  // 特典事件触发概率 5%
  },
  large: {
    name: '大券',
    emoji: '🎟️',
    cost: { economy: 800 },
    effect: { mood: 10, bond: 8 },
    idolEffect: { mental: 2, affection: 6, attention: 2 },
    weight: 3,
    eventChance: 0.20,  // 20%
  },
  close: {
    name: '关门',
    emoji: '🌟',
    cost: { economy: 2000 },
    effect: { mood: 25, bond: 15 },
    idolEffect: { mental: 3, affection: 10, attention: 3 },
    weight: 5,
    eventChance: 0.80,  // 80%
  },
};

// ==================== 聊天方式（基础效果 × 买券权重 = 最终效果） ====================
// 小券(×1) / 大券(×3) / 关门(×5)
const CHAT_METHODS = {
  casual: {
    name: '随便聊聊',
    emoji: '💬',
    effect: { mood: 3, bond: 2 },
    idolEffect: { mental: 1, affection: 2, attention: 1 },
  },
  values: {
    name: '聊价值观',
    emoji: '🤔',
    effect: { mood: 5, bond: 4 },
    idolEffect: { mental: 0, affection: 5, attention: 0 },
  },
  hobbies: {
    name: '聊兴趣爱好',
    emoji: '🎮',
    effect: { mood: 4, bond: 3 },
    idolEffect: { mental: 3, affection: 3, attention: 1 },
  },
  stage: {
    name: '聊舞台',
    emoji: '🎤',
    effect: { mood: 8, bond: 5 },
    idolEffect: { mental: 5, affection: 3, attention: 3 },
    // 如果参与方式是"只参与特典"则有负面效果（同样×权重）
    penaltyCondition: (s) => s.choices.participationMethod === 'tokuten',
    penalty: { mood: -8, bond: -5 },
    penaltyIdolEffect: { mental: -8, affection: -8, attention: -5 },
    penaltyDesc: '（只来特典会却谈舞台话题，对方感到困惑...）',
  },
  demand: {
    name: '要求对应',
    emoji: '💪',
    effect: { mood: 6, bond: 7 },
    idolEffect: { mental: -2, affection: 6, attention: 2 },
  },
};

// ★ 聊天效果乘算：base × ticket.weight
function weightedChatEffect(chat, weight) {
  const w = weight || 1;
  return {
    mood:    (chat.effect.mood || 0) * w,
    bond:    (chat.effect.bond || 0) * w,
    mental:    (chat.idolEffect?.mental || 0) * w,
    affection: (chat.idolEffect?.affection || 0) * w,
    attention: (chat.idolEffect?.attention || 0) * w,
  };
}

// ★ 聊天惩罚乘算：penalty × ticket.weight
function weightedChatPenalty(chat, weight) {
  const w = weight || 1;
  return {
    mood:    (chat.penalty?.mood || 0) * w,
    bond:    (chat.penalty?.bond || 0) * w,
    mental:    (chat.penaltyIdolEffect?.mental || 0) * w,
    affection: (chat.penaltyIdolEffect?.affection || 0) * w,
    attention: (chat.penaltyIdolEffect?.attention || 0) * w,
  };
}

// ==================== 羁绊等级定义 ====================
const BOND_LEVELS = [
  { level: 0, name: '路人',   minBond: 0 },
  { level: 1, name: '认识',   minBond: 10 },
  { level: 2, name: '熟悉',   minBond: 30 },
  { level: 3, name: '亲友',   minBond: 60 },
  { level: 4, name: '挚友',   minBond: 100 },
  { level: 5, name: '灵魂伴侣', minBond: 150 },
];

// ==================== 结局定义 ====================
const ENDINGS = {
  early_economy: {
    title: '破产离场',
    desc: '经济完全枯竭，连最基本的应援都无法维持。你不得不退出偶像宅的世界，回归平凡生活。也许有一天，你会重新回来...',
    isEarly: true,
  },
  early_energy: {
    title: '精疲力竭',
    desc: '精力完全耗尽，身体已经亮起红灯。在应援和生活的夹缝中，你倒下了。休息吧，她不会怪你的...',
    isEarly: true,
  },
  early_mood: {
    title: '心如死灰',
    desc: '心情跌至谷底，再也感受不到应援的快乐。曾经照亮你生活的星光，如今只剩灰烬...',
    isEarly: true,
  },
  early_idol: {
    title: '推倒灯灭',
    desc: '你推的偶像们一个接一个地倒下...你无能为力地看着她们的星光逐渐黯淡，而你也随之迷失在黑暗中。',
    isEarly: true,
  },
  early_special: {
    title: '意外终结',
    desc: '一个意想不到的事件改变了一切...',
    isEarly: true,
  },
  legend: {
    title: '传说之推',
    desc: '25个月的应援之路，你和偶像之间建立了超越粉丝与偶像的羁绊。她知道你的名字，记住你的脸，在人群中一眼就能找到你。这不只是应援，这是命中注定的相遇。',
    isEarly: false,
    condition: (s) => s.idols.some(i => i.bondLevel >= 5 && i.affection >= 70),
  },
  true_friend: {
    title: '真正的朋友',
    desc: '你们之间不再只是偶像与粉丝的关系。她把你当作真正可以信赖的朋友，这份羁绊比任何特典都珍贵。',
    isEarly: false,
    condition: (s) => s.idols.some(i => i.bondLevel >= 4 && i.affection >= 50),
  },
  dedicated_fan: {
    title: '忠实应援',
    desc: '25个月的风雨无阻，你是她最坚实的后盾。虽然没有过多的交集，但你的应援从未缺席。',
    isEarly: false,
    condition: (s) => s.idols.some(i => i.bondLevel >= 2),
  },
  casual_fan: {
    title: '佛系追星',
    desc: '虽然参与了不少活动，但总感觉差了点什么。也许下次可以更投入一些？',
    isEarly: false,
    condition: (s) => s.idols.some(i => i.bondLevel >= 1),
  },
  lost_soul: {
    title: '迷途之羊',
    desc: '25个月过去了，你既没有建立深厚的羁绊，也没有找到应援的意义。偶像的世界对你来说，仍然是遥不可及的星光。',
    isEarly: false,
    condition: () => true,
  },
};
