/* ============================
   status/player.js - 玩家状态系统
   ============================ */

// ==================== 状态定义 ====================
// 每个状态：{ id, name, desc, icon, duration(月), onTick:{economy?,energy?,mood?}, onExpire:{} }
const PLAYER_STATUS_DEFS = {
  fatigue: {
    id: 'fatigue', name: '疲劳',
    desc: '身体透支中，各项数值受到负面影响。',
    icon: '😫',
    duration: 3,
    onTick: { economy: -200, energy: -8, mood: -5 },
  },
  motivated: {
    id: 'motivated', name: '干劲十足',
    desc: '状态正佳，做什么都充满动力！',
    icon: '🔥',
    duration: 2,
    onTick: { mood: 8, economy: 300 },
  },
  injured: {
    id: 'injured', name: '受伤',
    desc: '不小心受了伤，行动不便。',
    icon: '🤕',
    duration: 2,
    onTick: { energy: -12, mood: -3 },
  },
  lucky: {
    id: 'lucky', name: '好运连连',
    desc: '最近运气特别好，一切都很顺。',
    icon: '🍀',
    duration: 2,
    onTick: { economy: 500, mood: 5 },
  },
};

// ==================== 状态操作 ====================

// 为玩家添加状态（不重复）
function addPlayerStatus(state, statusId) {
  if (!state.playerStatuses) state.playerStatuses = [];
  const def = PLAYER_STATUS_DEFS[statusId];
  if (!def) return null;
  // 已有同id状态则刷新时长
  const existing = state.playerStatuses.find(s => s.id === statusId);
  if (existing) {
    existing.remaining = def.duration;
    return existing;
  }
  const instance = { ...def, remaining: def.duration };
  state.playerStatuses.push(instance);
  return instance;
}

// 每回合结算玩家状态（在startMonth中调用）
function tickPlayerStatuses(state) {
  if (!state.playerStatuses) return;
  // 应用效果
  state.playerStatuses.forEach(st => {
    if (st.onTick) {
      if (st.onTick.economy) state.economy += st.onTick.economy;
      if (st.onTick.energy) state.energy += st.onTick.energy;
      if (st.onTick.mood) state.mood += st.onTick.mood;
    }
    st.remaining--;
  });
  // 移除过期状态
  state.playerStatuses = state.playerStatuses.filter(s => s.remaining > 0);
}

// 获取玩家当前状态列表
function getPlayerStatuses(state) {
  return state.playerStatuses || [];
}
