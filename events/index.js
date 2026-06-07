/* ============================
   events/index.js - 事件合并 & 扩展位
   ============================ */

// ==================== 合并事件池（按类型标记category） ====================
const EVENT_POOL = [
  ...EVENTS_COMMON.map(e => ({ ...e, category: 'common' })),
  ...EVENTS_WORKER.map(e => ({ ...e, category: 'worker' })),
  ...EVENTS_STUDENT.map(e => ({ ...e, category: 'student' })),
  ...EVENTS_IDOL.map(e => ({ ...e, category: 'idol' })),
  ...EVENTS_INTERACT.map(e => ({ ...e, category: 'interact' })),
];

// ==================== 特殊行动解锁注册表 ====================
const UNLOCKABLE_ACTIONS = {
  // 示例：{ id, name, desc, emoji, cost, effect, idolEffect, condition }
};

// ==================== 提前结束触发器（扩展位） ====================
const EARLY_END_TRIGGERS = [];
