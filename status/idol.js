/* ============================
   status/idol.js - 偶像状态系统
   ============================ */

// ==================== 状态定义 ====================
const IDOL_STATUS_DEFS = {
  blooming: {
    id: 'blooming', name: '人气上升中',
    desc: '关注度和好感度都在稳步攀升。',
    icon: '📈',
    duration: 4,
    onTick: { mental: 2, affection: 2, attention: 5 },
  },
  stressed: {
    id: 'stressed', name: '压力过大',
    desc: '最近行程太满，偶像有些疲于应对。',
    icon: '😰',
    duration: 3,
    onTick: { mental: -5, affection: -1 },
  },
  scandal: {
    id: 'scandal', name: '负面新闻',
    desc: '被不实报道困扰，心理状态受影响。',
    icon: '📰',
    duration: 2,
    onTick: { mental: -8, attention: 3 },
  },
};

// ==================== 状态操作 ====================

// 为指定偶像添加状态
function addIdolStatus(idol, statusId) {
  if (!idol.statuses) idol.statuses = [];
  const def = IDOL_STATUS_DEFS[statusId];
  if (!def) return null;
  const existing = idol.statuses.find(s => s.id === statusId);
  if (existing) {
    existing.remaining = def.duration;
    return existing;
  }
  const instance = { ...def, remaining: def.duration };
  idol.statuses.push(instance);
  return instance;
}

// 为所有偶像添加状态
function addAllIdolsStatus(state, statusId) {
  state.idols.forEach(idol => addIdolStatus(idol, statusId));
}

// 每回合结算所有偶像状态（在settleMonth中调用）
function tickIdolStatuses(state) {
  state.idols.forEach(idol => {
    if (!idol.statuses) return;
    // 应用效果
    idol.statuses.forEach(st => {
      if (st.onTick) {
        if (st.onTick.mental) idol.mental += st.onTick.mental;
        if (st.onTick.affection) idol.affection += st.onTick.affection;
        if (st.onTick.attention) idol.attention += st.onTick.attention;
      }
      st.remaining--;
    });
    // 移除过期
    idol.statuses = idol.statuses.filter(s => s.remaining > 0);
  });
}
