/* ============================
   data/conversations.js - 偶像会话池
   偶像发起会话 → 玩家聊天选择 → 结果描述 → 数值结算
   支持 {playerName} 占位符，在 showConversation 时替换
   ============================ */

// ★ 替换会话文本中的占位符
function resolveText(text, state) {
  if (!text || !state) return text || '';
  const name = state.playerName || '你';
  return text.replace(/\{playerName\}/g, name);
}

// 全局玩家聊天选项池（供普通/特殊会话使用，按标签过滤）
// grantTag: { tagId, chance } — chance 为获得概率 (0~1)，不填默认 1.0
const PLAYER_CHATS = {
  casual:     { text:'随便聊聊近况', desc:'你们轻松地聊了会天。', effect:{mood:3}, idolEffect:{mental:1,affection:2,awareness:1} },
  support:    { text:'表达今天的支持', desc:'「今天也来为你加油了！」偶像开心地笑了。', effect:{mood:4}, idolEffect:{affection:3,mental:2} },
  hobby:      { text:'聊聊兴趣', desc:'你们找到了共同话题，聊得很投入。', effect:{mood:3}, idolEffect:{mental:2,affection:2,awareness:1}, grantTag:{tagId:'motivated_fan',chance:0.4} },
  stage_talk: { text:'聊聊舞台', desc:'她对舞台话题很感兴趣，热情地分享了很多。', effect:{mood:5}, idolEffect:{mental:3,affection:2,awareness:2}, requiredTag:'stage_expert', grantTag:{tagId:'stage_expert',chance:0.5} },
  deep_talk:  { text:'深入交流', desc:'你们的对话触及了更深的话题，彼此都有所感悟。', effect:{mood:2}, idolEffect:{mental:2,affection:4,awareness:3}, requiredTag:'deep_thinker', grantTag:{tagId:'deep_thinker',chance:0.5} },
  bold_say:   { text:'直率表达', desc:'你鼓起勇气说了心里话，她有些惊讶但似乎不讨厌。', effect:{mood:4}, idolEffect:{affection:4,mental:-1,awareness:2}, requiredTag:'bold_fan', grantTag:{tagId:'bold_fan',chance:0.6} },
  comfort:    { text:'温柔安慰', desc:'你轻声安慰她，她的表情柔和了许多。', effect:{mood:3}, idolEffect:{mental:3,affection:3}, requiredTag:'gentle_soul', grantTag:{tagId:'gentle_soul',chance:0.5} },
  secret:     { text:'分享秘密', desc:'你们交换了一些只有彼此知道的小事。', effect:{mood:5}, idolEffect:{affection:5,awareness:4}, requiredTag:'trusted_ota', grantTag:{tagId:'trusted_ota',chance:0.5} },
};

// 获取当前可用的聊天选项
function getAvailableChats(playerTags) {
  const tagIds = (playerTags || []).map(t => t.id);
  const chats = [];
  for (const [key, chat] of Object.entries(PLAYER_CHATS)) {
    if (!chat.requiredTag || tagIds.includes(chat.requiredTag)) {
      chats.push({ key, ...chat });
    }
  }
  return chats;
}

// ==================== 会话池 ====================
const CONVERSATION_POOL = [
  // ===== 标签触发特殊事件（有专属选择，不走普通聊天）=====
  {
    id: 'spev_deep_question', type: 'special_event',
    trigger: { playerTag: 'deep_thinker' },
    name: '深层问答', desc: '偶像突然认真地看着你',
    text: '「我一直在想一个问题...你觉得偶像应该是什么样的人呢？」',
    choices: [
      { text:'「做真实的自己就好」', desc:'偶像眼中闪过一丝光芒。', effect:{mood:8}, idolEffect:{mental:3,affection:5,awareness:4} },
      { text:'「迎合粉丝的期待吧」', desc:'偶像若有所思地低下了头。', effect:{mood:3}, idolEffect:{mental:-2,affection:2,awareness:-3} },
      { text:'「我也不知道...」', desc:'你们一同陷入了沉思。', effect:{mood:2}, idolEffect:{mental:0,affection:1,awareness:-1} },
    ],
  },
  {
    id: 'spev_bold_request', type: 'special_event',
    trigger: { playerTag: 'bold_fan' },
    name: '大胆请求', desc: '你鼓起勇气做出了一个大胆的举动',
    text: '「可以...可以直接叫你的名字吗？」偶像愣了一下，脸微微红了。',
    choices: [
      { text:'期待地看着她', desc:'她害羞地点了点头。', effect:{mood:10}, idolEffect:{affection:6,mental:2,awareness:3} },
      { text:'「开玩笑的啦」', desc:'你赶紧打了圆场，她松了口气但似乎有点失落。', effect:{mood:3}, idolEffect:{affection:1,mental:-1} },
    ],
  },
  {
    id: 'spev_trusted_talk', type: 'special_event',
    trigger: { playerTag: 'trusted_ota' },
    name: '私下谈心', desc: '偶像悄悄把你拉到一边',
    text: '「{playerName}...有些话只能跟你说。最近其实压力挺大的，但不想让其他粉丝担心。」',
    choices: [
      { text:'认真倾听', desc:'她说了很多心里话，最后露出了轻松的笑容。', effect:{mood:6}, idolEffect:{mental:5,affection:6,awareness:4} },
      { text:'分享自己的经历', desc:'你们的距离拉近了不少。', effect:{mood:8}, idolEffect:{mental:3,affection:4,awareness:2} },
    ],
  },
  {
    id: 'spev_stage_advice', type: 'special_event',
    trigger: { playerTag: 'stage_expert' },
    name: '舞台建议', desc: '偶像向你请教舞台相关的问题',
    text: '「听说你对舞台很有见解？我最近在排练新节目，你觉得怎么样比较好？」',
    choices: [
      { text:'给出专业建议', desc:'她认真地记了下来，眼中充满感激。', effect:{mood:7}, idolEffect:{mental:4,affection:5,awareness:3} },
      { text:'谦虚地说不太懂', desc:'「没关系，和你聊聊我也很开心~」', effect:{mood:4}, idolEffect:{affection:3} },
    ],
  },
  {
    id: 'spev_gentle_comfort', type: 'special_event',
    trigger: { playerTag: 'gentle_soul' },
    name: '温柔安慰', desc: '偶像似乎情绪有些低落',
    text: '你注意到她的表情有些勉强，轻声问道：「你还好吗？」她的眼眶微微泛红。',
    choices: [
      { text:'递上纸巾陪着她', desc:'你们在安静中感受到了彼此的温暖。', effect:{mood:5}, idolEffect:{mental:5,affection:6,awareness:3} },
      { text:'说个笑话逗她', desc:'她破涕为笑，气氛轻松了不少。', effect:{mood:7}, idolEffect:{mental:2,affection:3} },
    ],
  },

  // ===== 标签依赖特殊会话（偶像发言后，玩家选择聊天方式）=====
  {
    id: 'schat_rumor', type: 'special_chat',
    trigger: { playerTag: 'rumor_monger' },
    text: '偶像凑近低声说：「听说你消息很灵通？最近有什么有趣的事吗？」',
  },
  {
    id: 'schat_motivated', type: 'special_chat',
    trigger: { playerTag: 'motivated_fan' },
    text: '偶像看到你元气满满的样子：「每次看到你那么有精神，我也觉得充满了力量呢！」',
  },
  {
    id: 'schat_fan_letter', type: 'special_chat',
    trigger: { playerTag: 'fan_letter' },
    text: '偶像接过你写的信，认真地看着：「谢谢你，我会好好珍藏的。」',
  },
  {
    id: 'schat_idol_gloomy', type: 'special_chat',
    trigger: { idolTag: 'idol_gloomy' },
    text: '偶像看起来心情不太好，但看到你来还是努力挤出了笑容：「今天...谢谢你能来。」',
  },
  {
    id: 'schat_idol_popular', type: 'special_chat',
    trigger: { idolTag: 'popular_wave' },
    text: '她神采飞扬：「最近好多新粉丝！不过像{playerName}这样一直支持我的人，我最珍惜了~」',
  },
  {
    id: 'schat_idol_jealous', type: 'special_chat',
    trigger: { idolTag: 'jealous' },
    text: '她看到你，眼神有些躲闪，半晌才开口：「{playerName}...上次你没来，我还以为你已经不喜欢我了。发了一条微博，你看到了吗？」',
  },
  {
    id: 'schat_personal_cheered', type: 'special_chat',
    trigger: { idolTag: 'personal_cheered' },
    text: '她看到你，眼睛亮了一下：「{playerName}！谢谢你专门为我应援...真的很开心，像是有了特别的力量。」',
  },

  // ===== 普通会话（按偶像状态 + 切数筛选）=====
  // 初见（切数=0）
  { id:'conv_first_1', type:'normal', conditions:{playerCutMax:0},
    text:'「初次见面！我是○○，请多关照~」偶像有些紧张但很认真地做了自我介绍。' },
  { id:'conv_first_2', type:'normal', conditions:{playerCutMax:0},
    text:'「你是第一次来特典会吗？不用紧张，随便聊聊就好~」偶像友善地笑了笑。' },
  // 熟悉后（切数>=10）
  { id:'conv_familiar_1', type:'normal', conditions:{playerCutMin:10},
    text:'「啊，又见面了！」她一看到你就露出了熟悉的笑脸，「今天过得怎么样？」' },
  { id:'conv_familiar_2', type:'normal', conditions:{playerCutMin:30},
    text:'「{playerName}，你几乎每次都来呢~」她似乎记住了你的样子，「说真的，很感谢你一直以来的支持。」' },
  // 通用
  { id:'conv_1', type:'normal', conditions:{},
    text:'偶像微笑着招手：「你好呀~今天也来了呢！」' },
  { id:'conv_2', type:'normal', conditions:{},
    text:'偶像聊起了天气：「最近忽冷忽热的，要注意身体哦~」' },
  { id:'conv_3', type:'normal', conditions:{},
    text:'「今天想聊什么呢？」偶像歪着头看你，眼睛里闪着期待的光。' },
  { id:'conv_4', type:'normal', conditions:{},
    text:'偶像分享了一个最近的趣事，讲得眉飞色舞的。' },
  { id:'conv_5', type:'normal', conditions:{idolMentalMin:60},
    text:'偶像今天心情很好：「最近找到了新的努力方向，每天都很充实！」' },
  { id:'conv_6', type:'normal', conditions:{idolMentalMax:40},
    text:'偶像看起来有些疲惫，但还是努力挤出笑容：「抱歉...今天状态不太好。」' },
  { id:'conv_7', type:'normal', conditions:{idolAffectionMin:60},
    text:'一见面她就热情地打招呼：「好久不见！最近怎么样？」' },
  { id:'conv_8', type:'normal', conditions:{idolAffectionMax:20},
    text:'偶像礼貌性地点了点头：「你好。」虽然态度礼貌，但感觉还有距离。' },
  { id:'conv_9', type:'normal', conditions:{idolAwarenessMin:60},
    text:'「你知道吗，我开始更清楚自己想要什么了。」偶像认真地看着你。' },
];

// ★ 为指定偶像选择会话
function selectConversation(state, idol, cutCount) {
  const playerTags = (state.playerTags || []).map(t => t.id);
  const idolTags = (idol.tags || []).map(t => t.id);
  const cc = cutCount || 0;

  // 1. 标签触发特殊事件
  for (const conv of CONVERSATION_POOL) {
    if (conv.type !== 'special_event') continue;
    const t = conv.trigger || {};
    if ((!t.playerTag || playerTags.includes(t.playerTag)) && (!t.idolTag || idolTags.includes(t.idolTag))) {
      if (t.playerTag) consumeOneTimeTag(state, t.playerTag);
      if (t.idolTag) removeIdolTag(idol, t.idolTag);
      return { type: 'special_event', data: conv };
    }
  }

  // 2. 标签依赖特殊会话
  const specialChats = CONVERSATION_POOL.filter(conv => {
    if (conv.type !== 'special_chat') return false;
    const t = conv.trigger || {};
    return (!t.playerTag || playerTags.includes(t.playerTag)) && (!t.idolTag || idolTags.includes(t.idolTag));
  });
  if (specialChats.length > 0) {
    const selected = specialChats[Math.floor(Math.random() * specialChats.length)];
    const t = selected.trigger || {};
    if (t.playerTag) consumeOneTimeTag(state, t.playerTag);
    if (t.idolTag) removeIdolTag(idol, t.idolTag);
    return { type: 'special_chat', data: selected };
  }

  // 3. 按偶像状态 + 切数筛选普通会话
  const normals = CONVERSATION_POOL.filter(conv => {
    if (conv.type !== 'normal') return false;
    const c = conv.conditions || {};
    if (c.playerCutMin != null && cc < c.playerCutMin) return false;
    if (c.playerCutMax != null && cc > c.playerCutMax) return false;
    if (c.idolMentalMin != null && idol.mental < c.idolMentalMin) return false;
    if (c.idolMentalMax != null && idol.mental > c.idolMentalMax) return false;
    if (c.idolAffectionMin != null && idol.affection < c.idolAffectionMin) return false;
    if (c.idolAffectionMax != null && idol.affection > c.idolAffectionMax) return false;
    if (c.idolAwarenessMin != null && (idol.awareness ?? 50) < c.idolAwarenessMin) return false;
    if (c.idolAwarenessMax != null && (idol.awareness ?? 50) > c.idolAwarenessMax) return false;
    return true;
  });
  if (normals.length === 0) {
    const fallbacks = CONVERSATION_POOL.filter(c => c.type === 'normal' && (!c.conditions || Object.keys(c.conditions).length === 0));
    return { type: 'normal', data: fallbacks.length ? fallbacks[Math.floor(Math.random() * fallbacks.length)] : { id:'fallback', type:'normal', text:'偶像微笑着向你点了点头。' } };
  }
  return { type: 'normal', data: normals[Math.floor(Math.random() * normals.length)] };
}
