/* ============================
   events/index.js - 统一事件引擎
   requiredTag: 字符串/函数/数组 / consumeTag: 触发后移除
   ============================ */

const EVENT_POOL = [
  ...EVENTS_MONTHLY,
  ...EVENTS_WEEK_START,
  ...EVENTS_PRE_TOKUTEN,
  ...EVENTS_POST_TICKET,
];

// ★ 检查是否满足 requiredTag (优先级 > condition) —— 节点事件用
function matchRequiredTag(state, evt) {
  if (!evt.requiredTag) return true;
  const playerTags = (state.playerTags || []).map(t => t.id);
  // 函数参数化: (s) => s.playerTags.some(t=>t.id.startsWith('gachi_'))
  if (typeof evt.requiredTag === 'function') return evt.requiredTag(state);
  // 数组: 全部满足
  if (Array.isArray(evt.requiredTag)) return evt.requiredTag.every(t => playerTags.includes(t));
  // 字符串: 精确匹配
  return playerTags.includes(evt.requiredTag);
}

// ★ 检查 requiredPlayerTag（通用，特典事件/节点事件均可使用）
function matchRequiredPlayerTag(state, tag) {
  if (!tag) return true;
  const playerTags = (state.playerTags || []).map(t => t.id);
  if (typeof tag === 'function') return tag(state);
  if (Array.isArray(tag)) return tag.every(t => playerTags.includes(t));
  return playerTags.includes(tag);
}

// ★ 检查 requiredIdolTag（特典事件用，传当前偶像）
function matchRequiredIdolTag(idol, tag) {
  if (!idol || !tag) return true;
  const idolTags = (idol.tags || []).map(t => t.id);
  if (Array.isArray(tag)) return tag.every(t => idolTags.includes(t));
  return idolTags.includes(tag);
}

// ★ 消费标签 (一次性标签 / 事件触发后移除)
function consumeEventTags(state, evt) {
  if (!evt.consumeTag) return;
  const tags = Array.isArray(evt.consumeTag) ? evt.consumeTag : [evt.consumeTag];
  tags.forEach(tagId => {
    // 支持函数: (s) => 返回要移除的 tagId
    const id = typeof tagId === 'function' ? tagId(state) : tagId;
    if (id) removePlayerTag(state, id);
  });
}

// ★ 事件结算 (含标签授予 + 标签消费)
function resolveEvent(state, evt, choice) {
  const eff = choice ? choice.effect : evt.effect;
  const iEff = choice ? choice.idolEffect : evt.idolEffect;
  if (eff) {
    if (eff.economy) state.economy += eff.economy;
    if (eff.mood) state.mood += eff.mood;
  }
  if (iEff) {
    if (iEff._all) {
      state.idols.forEach(idol => {
        if (iEff._all.mental) idol.mental += iEff._all.mental;
        if (iEff._all.affection) idol.affection += iEff._all.affection;
        if (iEff._all.awareness) idol.awareness = (idol.awareness ?? 50) + iEff._all.awareness;
      });
    } else {
      const t = state.idols.find(i => i.id === (state.choices.tokutenSelections[0]?.idolId || state.idols[0]?.id));
      if (t) {
        if (iEff.mental) t.mental += iEff.mental;
        if (iEff.affection) t.affection += iEff.affection;
        if (iEff.awareness) t.awareness = (t.awareness ?? 50) + iEff.awareness;
      }
    }
  }
  // 授予标签
  const grantTags = choice?.grantTag ? [choice.grantTag] : (evt.grantTag ? [evt.grantTag] : (evt.grantTags || []));
  grantTags.forEach(tg => { if (tg) addPlayerTag(state, tg); });
  // 消费标签
  consumeEventTags(state, evt);
  if (choice && choice.consumeTag) consumeEventTags(state, { consumeTag: choice.consumeTag });
}

// ★ 节点事件筛选
function checkNodeEvents(state, node) {
  const eligible = EVENT_POOL.filter(evt => {
    if (evt.triggerNode !== node) return false;
    if (state.turnEvents.some(t => t.id === evt.id)) return false;
    if (!matchRequiredTag(state, evt)) return false;
    return evt.condition(state);
  });
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => (b.priority || 5) - (a.priority || 5));
  return eligible[0];
}

const UNLOCKABLE_ACTIONS = {};
