/* ============================
   events-data.js - 游戏数据定义
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
  },
  tokuten: {
    name: '只参与特典',
    emoji: '🎫',
    cost: { economy: 100, energy: 3 },
    effect: { mood: 3, bond: 2 },
    idolEffect: { mental: 0, affection: 4, attention: 0 },
  },
};

// ==================== 特典方式消耗表 ====================
const TOKUTEN_METHODS = {
  none: {
    name: '不参与特典',
    emoji: '🚫',
    cost: { economy: 0 },
    effect: { mood: 0, bond: 0 },
    idolEffect: { mental: 0, affection: 0, attention: 0 },
  },
  small: {
    name: '小券',
    emoji: '🎫',
    cost: { economy: 200 },
    effect: { mood: 5, bond: 3 },
    idolEffect: { mental: 1, affection: 3, attention: 1 },
  },
  multi: {
    name: '多券',
    emoji: '🎫🎫',
    cost: { economy: 800 },
    effect: { mood: 10, bond: 8 },
    idolEffect: { mental: 2, affection: 6, attention: 2 },
  },
  close: {
    name: '关门',
    emoji: '🌟',
    cost: { economy: 2000 },
    effect: { mood: 25, bond: 15 },
    idolEffect: { mental: 3, affection: 10, attention: 3 },
  },
};

// ==================== 特典券价格 ====================
const TICKET_PRICE = 800;

// ==================== 羁绊等级定义 ====================
const BOND_LEVELS = [
  { level: 0, name: '路人',   minBond: 0 },
  { level: 1, name: '认识',   minBond: 10 },
  { level: 2, name: '熟悉',   minBond: 30 },
  { level: 3, name: '亲友',   minBond: 60 },
  { level: 4, name: '挚友',   minBond: 100 },
  { level: 5, name: '灵魂伴侣', minBond: 150 },
];

// ==================== 事件池 ====================
const EVENT_POOL = [
  // ---- 通用事件 ----
  {
    id: 'evt_bonus',
    name: '奖金到账',
    desc: '公司发了季度奖金，你的钱包鼓了起来。',
    icon: '💰',
    condition: (s) => s.character === 'worker',
    effect: { economy: 1500 },
    idolEffect: {},
    priority: 1,
  },
  {
    id: 'evt_parttime',
    name: '兼职收入',
    desc: '周末做了兼职，赚了些零花钱。',
    icon: '💵',
    condition: (s) => s.character === 'student',
    effect: { economy: 800 },
    idolEffect: {},
    priority: 1,
  },
  {
    id: 'evt_overtime',
    name: '加班地狱',
    desc: '这月疯狂加班，身心俱疲。',
    icon: '😰',
    condition: (s) => s.character === 'worker',
    effect: { energy: -15, mood: -10 },
    idolEffect: {},
    priority: 2,
  },
  {
    id: 'evt_exam',
    name: '考试周',
    desc: '期末考试来了，不得不放下应援专心复习。',
    icon: '📚',
    condition: (s) => s.character === 'student' && s.turn >= 3,
    effect: { energy: -20, mood: -8 },
    idolEffect: {},
    priority: 2,
  },
  {
    id: 'evt_lucky',
    name: '幸运抽奖',
    desc: '在活动现场抽中了稀有周边！心情大好！',
    icon: '🍀',
    condition: () => true,
    effect: { mood: 15 },
    idolEffect: { affection: 2 },
    priority: 3,
  },
  {
    id: 'evt_fan_friend',
    name: '结识同好',
    desc: '在现场认识了同推的伙伴，一起应援更开心了。',
    icon: '🤝',
    condition: (s) => s.energy > 30,
    effect: { mood: 10 },
    idolEffect: { attention: 1 },
    priority: 3,
  },
  {
    id: 'evt_flu',
    name: '感冒了',
    desc: '应援太累导致感冒，本月精力大打折扣。',
    icon: '🤒',
    condition: (s) => s.energy < 40 && s.turn > 5,
    effect: { energy: -20, mood: -5 },
    idolEffect: {},
    priority: 2,
  },
  {
    id: 'evt_sale',
    name: '周边打折',
    desc: '官方周边打折！省了一笔钱。',
    icon: '🛒',
    condition: () => true,
    effect: { economy: 500 },
    idolEffect: {},
    priority: 3,
  },
  {
    id: 'evt_burnout',
    name: '倦怠期',
    desc: '最近对一切都提不起兴趣，是不是该休息一下？',
    icon: '😔',
    condition: (s) => s.mood < 30,
    effect: { mood: -10, energy: -10 },
    idolEffect: { affection: -3 },
    priority: 2,
  },
  {
    id: 'evt_good_news',
    name: '偶像上电视',
    desc: '你的推上了综艺节目！看到她活跃的样子，心里暖暖的。',
    icon: '📺',
    condition: () => true,
    effect: { mood: 12 },
    idolEffect: { attention: 5, mental: 2 },
    priority: 3,
  },
  // ---- 精力相关事件 ----
  {
    id: 'evt_miss_anniversary',
    name: '错过了出道纪念日',
    desc: '因为太累完全忘了今天是推的出道纪念日...她好像有点失落。',
    icon: '📅',
    condition: (s) => s.energy < 30 && s.turn > 8,
    effect: { mood: -8 },
    idolEffect: { affection: -5, mental: -3 },
    priority: 2,
  },
  {
    id: 'evt_well_rested',
    name: '精力充沛',
    desc: '休息得很好，感觉元气满满！本月状态极佳。',
    icon: '✨',
    condition: (s) => s.energy >= 80,
    effect: { mood: 8, energy: 10 },
    idolEffect: {},
    priority: 3,
  },
  // ---- 偶像相关事件 ----
  {
    id: 'evt_idol_sick',
    name: '偶像体调不良',
    desc: '你的推最近看起来身体不太好，活动上也有些勉强...',
    icon: '🤕',
    condition: (s) => s.turn > 6 && s.idols.some(i => i.mental < 50),
    effect: { mood: -8 },
    idolEffect: { _all: { mental: -5 } },
    priority: 1,
  },
  {
    id: 'evt_idol_bloom',
    name: '偶像状态绝佳',
    desc: '你的推最近状态超好！舞台表现力炸裂！',
    icon: '🌟',
    condition: (s) => s.idols.some(i => i.mental > 70 && i.affection > 40),
    effect: { mood: 12 },
    idolEffect: { _all: { attention: 3 } },
    priority: 3,
  },
  {
    id: 'evt_scandal_rumor',
    name: '流言蜚语',
    desc: '网上出现了一些关于你推的不实传闻，粉丝们议论纷纷。',
    icon: '📰',
    condition: (s) => s.turn > 10,
    effect: { mood: -5 },
    idolEffect: { _all: { mental: -5, attention: 3 } },
    priority: 2,
  },
  {
    id: 'evt_fan_meet',
    name: '粉丝见面会',
    desc: '参加了粉丝见面会，和同好们度过了愉快的时光！',
    icon: '🎉',
    condition: (s) => s.energy >= 40,
    effect: { mood: 15, energy: -5 },
    idolEffect: { _all: { affection: 2 } },
    priority: 3,
  },
  {
    id: 'evt_rival_fan',
    name: '粉丝争端',
    desc: '不同推的粉丝之间发生了争执，气氛有些紧张。',
    icon: '⚡',
    condition: (s) => s.idols.length >= 2 && s.turn > 8,
    effect: { mood: -8 },
    idolEffect: { _all: { mental: -2 } },
    priority: 2,
  },
  {
    id: 'evt_charity',
    name: '慈善活动',
    desc: '偶像参加了慈善活动，你在现场为她加油。',
    icon: '💝',
    condition: (s) => s.turn > 5,
    effect: { mood: 10 },
    idolEffect: { _all: { mental: 3, affection: 2, attention: 2 } },
    priority: 3,
  },
  {
    id: 'evt_new_song',
    name: '新曲发布',
    desc: '你的推发布了新曲！单曲循环一整天！',
    icon: '🎶',
    condition: () => true,
    effect: { mood: 15 },
    idolEffect: { _all: { attention: 4, mental: 2 } },
    priority: 3,
  },
  {
    id: 'evt_economy_crisis',
    name: '物价上涨',
    desc: '最近什么都在涨价，生活成本增加了不少。',
    icon: '📈',
    condition: (s) => s.turn > 12,
    effect: { economy: -800 },
    idolEffect: {},
    priority: 2,
  },
  {
    id: 'evt_lost_item',
    name: '遗失物品',
    desc: '在活动现场不小心丢了东西，心情有些低落。',
    icon: '😭',
    condition: () => true,
    effect: { economy: -300, mood: -5 },
    idolEffect: {},
    priority: 3,
  },
];

// ==================== 特殊行动定义（扩展位） ====================
const SPECIAL_ACTIONS = [
  // 预留扩展位，后续可添加：
  // { id: 'buy_merch', name: '购买周边', desc: '花费经济购买偶像周边',
  //   cost: { economy: 500, energy: 5 }, effect: { mood: 10, bond: 3 },
  //   idolEffect: { affection: 2 },
  //   condition: (state) => state.economy >= 500 },
];

// ==================== 提前结束触发器（扩展位） ====================
const EARLY_END_TRIGGERS = [
  // 预留扩展位
  // { id: 'idol_retire', name: '偶像引退',
  //   condition: (state) => state.idols.filter(i => i.mental <= 0 || i.affection <= 0).length >= 2,
  //   reason: '太多偶像倒下了，你的应援之路就此终结...' },
];

// ==================== 结局定义 ====================
const ENDINGS = {
  // 提前结束结局
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

  // 正常结局
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
    condition: () => true, // 默认结局
  },
};
