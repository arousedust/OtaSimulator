/* ============================
   events-pool.js - 事件池（按类别分）
   ============================ */

// ==================== 事件扩展接口说明 ====================
// 每个事件可包含：
//   choices: [{text, desc, effect, idolEffect, specialUnlock}]
//     - 有choices时，事件触发后弹出选项而非直接结算
//   specialUnlock: 'action_id'
//     - 事件触发后解锁对应特殊行动

// ==================== A. 玩家通用事件 ====================
const EVENTS_COMMON = [
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

// ==================== B. 社畜事件 ====================
const EVENTS_WORKER = [
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
    id: 'evt_overtime',
    name: '加班地狱',
    desc: '这月疯狂加班，身心俱疲。',
    icon: '😰',
    condition: (s) => s.character === 'worker',
    effect: { energy: -15, mood: -10 },
    idolEffect: {},
    priority: 2,
  },
];

// ==================== C. 学生事件 ====================
const EVENTS_STUDENT = [
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
    id: 'evt_exam',
    name: '考试周',
    desc: '期末考试来了，不得不放下应援专心复习。',
    icon: '📚',
    condition: (s) => s.character === 'student' && s.turn >= 3,
    effect: { energy: -20, mood: -8 },
    idolEffect: {},
    priority: 2,
  },
];

// ==================== D. 小偶像事件 ====================
const EVENTS_IDOL = [
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
    id: 'evt_charity',
    name: '慈善活动',
    desc: '偶像参加了慈善活动，你在现场为她加油。',
    icon: '💝',
    condition: (s) => s.turn > 5,
    effect: { mood: 10 },
    idolEffect: { _all: { mental: 3, affection: 2, attention: 2 } },
    priority: 3,
  },
];

// ==================== E. 互动事件（含选择） ====================
const EVENTS_INTERACT = [
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
    condition: (s) => s.knownIdols.length >= 2 && s.turn > 8,
    effect: { mood: -8 },
    idolEffect: { _all: { mental: -2 } },
    priority: 2,
    // ★ 选择事件示例 ★
    choices: [
      {
        text: '站出来调解',
        desc: '你主动介入调解，缓和了双方的矛盾。',
        effect: { mood: -3, economy: 0 },
        idolEffect: { _all: { affection: 3, attention: 2 } },
      },
      {
        text: '默默离开',
        desc: '不想卷入争端，你悄悄离开了现场。',
        effect: { mood: -5 },
        idolEffect: { _all: { affection: -1 } },
      },
      {
        text: '支持自家推',
        desc: '你加入了讨论，维护自己推的名誉。',
        effect: { mood: -2, energy: -5 },
        idolEffect: { _all: { affection: 1, mental: -3 } },
      },
    ],
  },
  {
    id: 'evt_hanami',
    name: '赏樱偶遇',
    desc: '周末去公园赏樱，意外遇到了相识的偶像！要不要上前打招呼？',
    icon: '🌸',
    condition: (s) => s.knownIdols.length > 0 && s.turn >= 3 && s.turn <= 20,
    priority: 3,
    choices: [
      {
        text: '上前打招呼',
        desc: '鼓起勇气走上前，偶像似乎也认出了你。',
        effect: { mood: 10 },
        idolEffect: { _all: { affection: 5, attention: 3 } },
      },
      {
        text: '远远看着就好',
        desc: '不想打扰她的私人时间，你选择远远观望。',
        effect: { mood: 5 },
        idolEffect: { _all: { affection: 1 } },
      },
      {
        text: '偷偷拍照',
        desc: '你拿出手机偷拍了几张...希望没被发现。',
        effect: { mood: 8 },
        idolEffect: { _all: { attention: 2, mental: -3, affection: -2 } },
      },
    ],
  },
];

// ==================== 合并事件池 ====================
const EVENT_POOL = [
  ...EVENTS_COMMON.map(e => ({ ...e, category: 'common' })),
  ...EVENTS_WORKER.map(e => ({ ...e, category: 'worker' })),
  ...EVENTS_STUDENT.map(e => ({ ...e, category: 'student' })),
  ...EVENTS_IDOL.map(e => ({ ...e, category: 'idol' })),
  ...EVENTS_INTERACT.map(e => ({ ...e, category: 'interact' })),
];

// ==================== 特殊行动解锁注册表 ====================
// key: action_id, value: 完整特殊行动定义
const UNLOCKABLE_ACTIONS = {
  // 示例：制作应援横幅（由后续事件解锁）
  // action_make_banner: {
  //   id: 'make_banner',
  //   name: '制作应援横幅',
  //   desc: '花费精力为偶像制作应援横幅',
  //   emoji: '🎨',
  //   cost: { economy: 200, energy: 10 },
  //   effect: { mood: 8, bond: 5 },
  //   idolEffect: { affection: 3, attention: 5 },
  //   condition: (s) => s.energy >= 10 && s.economy >= 200,
  // },
};

// ==================== 提前结束触发器（扩展位） ====================
const EARLY_END_TRIGGERS = [
  // 预留扩展位
];
