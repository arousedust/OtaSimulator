/* ============================
   tags/player.js - 玩家标签系统（以周为单位）
   ============================ */

const PLAYER_TAG_DEFS = {
  lucky_star:   { id:'lucky_star', name:'幸运之星', icon:'⭐', desc:'今天的运气似乎特别好', turn:-1,
                  modifiers:{ tokutenEventChanceAdd:0.15 } },
  fan_letter:   { id:'fan_letter', name:'粉丝信的勇气', icon:'✉️', desc:'你鼓起勇气写了封粉丝信', turn:-1,
                  modifiers:{ tokutenMoodMult:1.3 } },

  deep_thinker:  { id:'deep_thinker', name:'深度思考者', icon:'🤔', desc:'你开始思考偶像与粉丝关系的本质', turn:12,
                    modifiers:{ tokutenMoodMult:0.85, idolMentalMult:1.2 } },
  stage_expert:  { id:'stage_expert', name:'舞台专家', icon:'🎭', desc:'你对舞台表演有了更深的见解', turn:12,
                    modifiers:{ idolAffectionMult:1.15 } },
  bold_fan:      { id:'bold_fan', name:'大胆粉丝', icon:'🔥', desc:'你变得更敢于表达自己', turn:8,
                    modifiers:{ tokutenMoodMult:1.2, idolMentalMult:0.85 } },
  trusted_ota:   { id:'trusted_ota', name:'受信赖的OTA', icon:'💎', desc:'偶像开始对你产生信任感', turn:16,
                    modifiers:{ idolAffectionMult:1.3, idolMentalMult:1.2 } },
  rumor_monger:  { id:'rumor_monger', name:'八卦达人', icon:'👂', desc:'你知道了一些圈内传闻', turn:8,
                    modifiers:{ tokutenEventChanceAdd:0.08, tokutenMoodMult:0.9 } },
  motivated_fan: { id:'motivated_fan', name:'干劲满满', icon:'🚀', desc:'应援热情高涨，做什么都充满动力', turn:12,
                    modifiers:{ tokutenMoodMult:1.15, participateMoodMult:1.2 }, onTick:{ economy:-30, mood:1 } },
  gentle_soul:   { id:'gentle_soul', name:'温柔灵魂', icon:'🌸', desc:'你以温和的方式与人相处，偶像似乎注意到了', turn:12,
                    modifiers:{ idolMentalMult:1.25, tokutenMoodMult:0.9 } },

  fatigue:   { id:'fatigue', name:'疲劳', icon:'😫', desc:'身体透支中，参加活动心情回复降低', turn:3,
                onTick:{ economy:-120, mood:-1 }, modifiers:{ tokutenMoodMult:0.6, participateMoodMult:0.65 },
                actionPenalty:{ cheer:{ mood:-3, economy:50 } } },
  motivated: { id:'motivated', name:'干劲十足', icon:'⚡', desc:'状态正佳，做什么都充满动力', turn:1,
                onTick:{ mood:2, economy:75 }, modifiers:{ tokutenMoodMult:1.2, participateMoodMult:1.15 } },
  injured:   { id:'injured', name:'受伤', icon:'🤕', desc:'不小心受了伤，活动花费增加且无法现场应援', turn:8,
                onTick:{ mood:-10, economy:-300}, modifiers:{ tokutenEconomyMult:1.3, participateEconomyMult:1.25 },
                blockMethods: ['cheer'] },
  lucky:     { id:'lucky', name:'好运连连', icon:'🍀', desc:'最近运气特别好，一切都很顺', turn:8,
                onTick:{ economy:125, mood:1 }, modifiers:{ tokutenEventChanceAdd:0.1, tokutenMoodMult:1.1 } },

  debt_mode:  { id:'debt_mode', name:'借贷度日', icon:'💳', desc:'借了花呗，每月到手经济变多但心情大幅下降', turn:16,
                onTick:{ economy:200, mood:-4 }, modifiers:{ monthlyEconomyMult:1.3, monthlyMoodDrainMult:2, tokutenMoodMult:0.75 } },
  low_spirit: { id:'low_spirit', name:'心灰意冷', icon:'💔', desc:'近期状态低迷，参与活动的心情回复大打折扣', turn:8,
                onTick:{ mood:-2 }, modifiers:{ tokutenMoodMult:0.5, participateMoodMult:0.6 } },
  super_fan:  { id:'super_fan', name:'超级粉丝', icon:'🌟', desc:'热情高涨的应援让好感获取倍增', turn:8,
                modifiers:{ idolAffectionMult:1.3, tokutenEconomyMult:1.2 } },

  // ── 参数化标签 (idolId 动态) ──
  // 使用时: 'gachi_' + idolId, 如 'gachi_idol_1'
  gachi_idol_1: { id:'gachi_idol_1', name:'星宫莓的ガチ恋', icon:'🍓💘', desc:'你对她产生了超越推し的感情', turn:16, modifiers:{ idolAffectionMult:1.3, tokutenMoodMult:1.2 } },
  gachi_idol_2: { id:'gachi_idol_2', name:'月城雪的ガチ恋', icon:'❄️💘', desc:'你对她产生了超越推し的感情', turn:16, modifiers:{ idolAffectionMult:1.3, tokutenMoodMult:1.2 } },
  gachi_idol_3: { id:'gachi_idol_3', name:'日向葵的ガチ恋', icon:'🌻💘', desc:'你对她产生了超越推し的感情', turn:16, modifiers:{ idolAffectionMult:1.3, tokutenMoodMult:1.2 } },
  gachi_idol_4: { id:'gachi_idol_4', name:'天羽凛的ガチ恋', icon:'🦅💘', desc:'你对她产生了超越推し的感情', turn:16, modifiers:{ idolAffectionMult:1.3, tokutenMoodMult:1.2 } },
  gachi_idol_5: { id:'gachi_idol_5', name:'花咲音的ガチ恋', icon:'🎵💘', desc:'你对她产生了超越推し的感情', turn:16, modifiers:{ idolAffectionMult:1.3, tokutenMoodMult:1.2 } },
  gachi_idol_5: { id:'gachi_idol_5', name:'花咲音的ガチ恋', icon:'🎵💘', desc:'你对她产生了超越推し的感情', turn:16, modifiers:{ idolAffectionMult:1.3, tokutenMoodMult:1.2 } },
  gachi_idol_6: { id:'gachi_idol_6', name:'翡翠琉璃的ガチ恋', icon:'💎💘', desc:'你对她产生了超越推し的感情', turn:16, modifiers:{ idolAffectionMult:1.3, tokutenMoodMult:1.2 } },

  // ── 玩家特殊状态标签 ──
  focusing_life: { id:'focusing_life', name:'专注现实', icon:'🏠', desc:'你开始平衡应援与现实生活，经济改善但特典投入感降低。', turn:16,
                   modifiers:{ monthlyEconomyMult:1.3, monthlyMoodDrainMult:0.5, tokutenMoodMult:0.8 } },

  // ── 特殊结局标签（turn:-1 一次性，用于触发特定结局）──
  graduated_ota:    { id:'graduated_ota', name:'毕业', icon:'🎓', desc:'你从学校毕业，即将面对新生活。', turn:-1 },
  transferred:      { id:'transferred', name:'工作调动', icon:'📦', desc:'一纸调令改变了你的人生轨迹。', turn:-1 },
  injured_hospital: { id:'injured_hospital', name:'现场受伤住院', icon:'🏥', desc:'偶活现场出了意外，你受伤住院了。', turn:-1 },
  arrested_incident:{ id:'arrested_incident', name:'警察出动', icon:'🚔', desc:'偶活现场有人报警，你被带走了...', turn:-1 },

  // ── 初始/被动玩家标签（hidden:true, turn:-1 永久）──
  it_ota:       { id:'it_ota', name:'IT社畜', icon:'💻', desc:'你有稳定的IT工作，每月收入更高。', hidden:true, turn:-1,
                   modifiers:{ monthlyEconomyMult:1.2 } },
  handsome: { id:'handsome', name:'池面', icon:'🌸', desc:'从各种意义上来说，你都很好看。', hidden:true, turn:-1,
                   modifiers:{ idolAffectionMult:1.1 } },

  // ── 玩家游戏内标签 ──
  photographer: { id:'photographer', name:'炮哥', icon:'📸', desc:'你拿着相机在杆位拍了不少好图，偶像们对你的镜头记忆深刻。', turn:8,
                  modifiers:{ idolAffectionMult:1.1, tokutenMoodMult:1.1 } },
  newbie:       { id:'newbie', name:'初见さん', icon:'🌱', desc:'第一次来偶活，偶像们对新人特别温柔。', turn:2,
                  modifiers:{ tokutenMoodMult:1.2, idolAffectionMult:1.15 } },
  broke:        { id:'broke', name:'破产边缘', icon:'💸', desc:'钱包见底，必须精打细算。', turn:4,
                  onTick:{ mood:-1 }, modifiers:{ tokutenEconomyMult:0.7, participateEconomyMult:0.8 } },
  closing_ota:  { id:'closing_ota', name:'关门OTA', icon:'🔑', desc:'每次都是你切到最后一张券，偶像早已记住这个倔强的背影。', turn:-1,
                  modifiers:{ idolAffectionMult:1.25, tokutenMoodMult:1.3 } },
};

// ★ 辅助：获取玩家的 gachi 标签 (返回 tagId 或 null)
function getGachiTag(state) {
  const gachi = (state.playerTags || []).find(t => t.id.startsWith('gachi_'));
  return gachi ? gachi.id : null;
}

// ★ 辅助：尝试授予 gachi 标签 (累计切数≥20时)
function tryGrantGachi(state, idolId) {
  if ((state.cutCounts[idolId] || 0) >= 20) {
    const tagId = 'gachi_' + idolId;
    if (PLAYER_TAG_DEFS[tagId]) addPlayerTag(state, tagId);
  }
}

// ==================== 操作函数 ====================

function addPlayerTag(state, tagId) {
  if (!state.playerTags) state.playerTags = [];
  const def = PLAYER_TAG_DEFS[tagId];
  if (!def) return null;
  const existing = state.playerTags.find(t => t.id === tagId);
  if (existing) { existing.turn = def.turn; return existing; }
  const tag = { id:def.id, name:def.name, icon:def.icon, desc:def.desc, turn:def.turn, hidden:!!def.hidden };
  state.playerTags.push(tag);
  if (def.onApply) def.onApply(state);
  return tag;
}
function removePlayerTag(state, tagId) { if (state.playerTags) state.playerTags = state.playerTags.filter(t => t.id !== tagId); }
function hasPlayerTag(state, tagId) { return (state.playerTags || []).some(t => t.id === tagId); }

function collectPlayerModifiers(state) {
  const result = {};
  (state.idols || []).forEach(idol => {
    (idol.tags || []).forEach(tag => {
      const def = IDOL_TAG_DEFS[tag.id];
      if (def && def.playerModifiers) {
        for (const [k, v] of Object.entries(def.playerModifiers)) {
          if (k.endsWith('Mult')) result[k] = (result[k] || 1) * v;
          else if (k.endsWith('Add')) result[k] = (result[k] || 0) + v;
        }
      }
    });
  });
  (state.playerTags || []).forEach(tag => {
    const def = PLAYER_TAG_DEFS[tag.id];
    if (def && def.modifiers) {
      for (const [k, v] of Object.entries(def.modifiers)) {
        if (k.endsWith('Mult')) result[k] = (result[k] || 1) * v;
        else if (k.endsWith('Add')) result[k] = (result[k] || 0) + v;
      }
    }
  });
  return result;
}

function collectIdolModifiers(idol) {
  const result = {};
  (idol.tags || []).forEach(tag => {
    const def = IDOL_TAG_DEFS[tag.id];
    if (def && def.modifiers) {
      for (const [k, v] of Object.entries(def.modifiers)) {
        if (k.endsWith('Mult')) result[k] = (result[k] || 1) * v;
        else if (k.endsWith('Add')) result[k] = (result[k] || 0) + v;
      }
    }
  });
  return result;
}

// ★ 收集玩家标签阻止的参与方式
function getBlockedMethods(state) {
  const blocked = [];
  (state.playerTags || []).forEach(t => {
    const def = PLAYER_TAG_DEFS[t.id];
    if (def && def.blockMethods) blocked.push(...def.blockMethods);
  });
  return blocked;
}

function getUnlockedActions(state) {
  const keys = [];
  (state.playerTags || []).forEach(tag => {
    const def = PLAYER_TAG_DEFS[tag.id];
    if (def && def.unlocks) keys.push(...def.unlocks);
  });
  return keys;
}

function tickPlayerTags(state) {
  if (!state.playerTags || state.playerTags.length === 0) return;
  state.playerTags.forEach(tag => {
    const def = PLAYER_TAG_DEFS[tag.id];
    if (def && def.onTick) {
      if (def.onTick.economy) state.economy += def.onTick.economy;
      if (def.onTick.mood) state.mood += def.onTick.mood;
    }
  });
  state.playerTags.forEach(tag => { if (tag.turn > 0) tag.turn--; });
  state.playerTags = state.playerTags.filter(t => t.turn > 0 || t.turn === -1);
}

function consumeOneTimeTag(state, tagId) {
  if (!state.playerTags) return false;
  const idx = state.playerTags.findIndex(t => t.id === tagId && t.turn === -1);
  if (idx >= 0) { state.playerTags.splice(idx, 1); return true; }
  return false;
}
