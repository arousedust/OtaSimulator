/* ============================
   tags/idol.js - 偶像标签系统（以周为单位）
   ============================ */

const IDOL_TAG_DEFS = {
  blooming: {
    id: 'blooming', name: '人气上升中',
    desc: '状态向好，和她互动心情更愉快。',
    icon: '📈', turn: 16,
    onTick: { mental: 1, affection: 1 },
    modifiers: { affectionGainMult: 1.2 },
    playerModifiers: { tokutenMoodMult: 1.1 },
  },
  stressed: {
    id: 'stressed', name: '压力过大',
    desc: '最近行程太满，和她聊天时气氛有些紧张。',
    icon: '😰', turn: 2,
    onTick: { mental: -1, affection: -1 },
    modifiers: { mentalGainMult: 0.7 },
    playerModifiers: { tokutenMoodMult: 0.7 },
  },
  scandal: {
    id: 'scandal', name: '负面新闻',
    desc: '被挂板子说营业太过，她对粉丝的态度也变得敏感。',
    icon: '📰', turn: 4,
    onTick: { mental: -2 },
    modifiers: { affectionGainMult: 0.6, mentalGainMult: 0.5 },
    playerModifiers: { tokutenMoodMult: 0.6 },
  },
  idol_gloomy: {
    id: 'idol_gloomy', name: '情绪低落',
    desc: '偶像最近心情不好，虽然需要更多支持但玩家心情回复大幅降低。',
    icon: '😞', turn: 8,
    onTick: { mental: -2, affection: -1 },
    modifiers: { affectionGainMult: 1.5 },
    playerModifiers: { tokutenMoodMult: 0.45 },
  },
  popular_wave: {
    id: 'popular_wave', name: '人气爆发',
    desc: '突然爆火！和她有关的活动体验更好了。',
    icon: '🚀', turn: 8,
    onTick: { mental: 1 },
    playerModifiers: { tokutenMoodMult: 1.3 },
  },
  jealous: {
    id: 'jealous', name: '吃醋了',
    desc: '她发了一条微博“熟悉的人没有来有点难过”，下次特典会去找她吧。',
    icon: '😤', turn: 4,
    onTick: { mental: -1, affection: -1 },
    modifiers: { affectionGainMult: 0.7 },
    playerModifiers: { tokutenMoodMult: 0.8 },
  },

  // ── 初始/被动标签（hidden:true, turn:-1 永久）──
  eloquent: {
    id: 'eloquent', name: '能说会道',
    desc: '和她聊天时心情恢复更高。', icon: '💬',
    hidden: true, turn: -1,
    playerModifiers: { tokutenMoodMult: 1.15 },
  },
  gravity: {
    id: 'gravity', name: '重力系',
    desc: '每次和她接触都会触发独特事件。', icon: '🌑',
    hidden: true, turn: -1,
  },
  sick: {
    id: 'sick', name: '病気中', icon: '🤒',
    desc: '身体不适，暂时无法参加特典会。', turn: 3,
    blockTokuten: true,
    onTick: { mental: -2 },
  },
  depressed: {
    id: 'depressed', name: '地雷女',
    desc: '每次和她接触都会触发独特事件。', icon: '💣',
    hidden: true, turn: -1,
  },
  ojousama: {
    id: 'ojousama', name: '大小姐',
    desc: '和她的对话效果不会因券数多少而改变。', icon: '👑',
    hidden: true, turn: -1,
  },
  natural_idol: {
    id: 'natural_idol', name: '天生偶像',
    desc: 'awareness 每回合自然增长。', icon: '🌟',
    hidden: true, turn: -1,
    onTick: { awareness: 1 },
  },
};

// ==================== 偶像标签操作 ====================

function addIdolTag(idol, tagId) {
  if (!idol.tags) idol.tags = [];
  const def = IDOL_TAG_DEFS[tagId];
  if (!def) return null;
  const existing = idol.tags.find(t => t.id === tagId);
  if (existing) { existing.turn = def.turn; return existing; }
  const tag = { id: def.id, name: def.name, icon: def.icon, desc: def.desc, turn: def.turn, hidden: !!def.hidden };
  idol.tags.push(tag);
  return tag;
}

function addAllIdolsTag(state, tagId) { state.idols.forEach(idol => addIdolTag(idol, tagId)); }
function removeIdolTag(idol, tagId) { if (idol.tags) idol.tags = idol.tags.filter(t => t.id !== tagId); }
function hasIdolTag(idol, tagId) { return (idol.tags || []).some(t => t.id === tagId); }

// ★ 检查偶像是否被标签阻止参与特典
function isIdolBlocked(idol) {
  return (idol.tags || []).some(t => {
    const def = IDOL_TAG_DEFS[t.id];
    return def && def.blockTokuten;
  });
}

function tickIdolTags(state) {
  state.idols.forEach(idol => {
    if (!idol.tags || idol.tags.length === 0) return;
    idol.tags.forEach(tag => {
      const def = IDOL_TAG_DEFS[tag.id];
      if (def && def.onTick) {
        if (def.onTick.mental) idol.mental += def.onTick.mental;
        if (def.onTick.affection) idol.affection += def.onTick.affection;
        if (def.onTick.awareness) idol.awareness = (idol.awareness ?? 50) + def.onTick.awareness;
      }
      if (tag.turn > 0) tag.turn--;
    });
    idol.tags = idol.tags.filter(t => t.turn > 0 || t.turn === -1);
  });
}
