/* ============================
   events/tokuten.js - 特典概率事件
   支持 effect 直接效果 / choices 选择分支
   chance 统一从 condition 中抽出，chance 不填=必定触发
   ============================ */
const TOKUTEN_EVENT_POOL = [
  // ── 直接效果 ──
  { id:'tokuten_memory', name:'美好的回忆', desc:'和偶像的对话成为了珍贵的回忆，今天真是太棒了。', icon:'💫', condition:()=>true, effect:{mood:8}, idolEffect:{affection:3,mental:2,awareness:2}, priority:3 },
  { id:'tokuten_lucky', name:'签运爆棚', desc:'买券抽到了亲笔签名！', icon:'🍀', condition:()=>true, effect:{mood:12}, idolEffect:{affection:3,awareness:1}, grantTag:'lucky_star', priority:3 },
  { id:'tokuten_gossip', name:'听到了小道消息', desc:'从staff那里听到偶像在筹备惊喜企划。', icon:'👂', condition:()=>true, effect:{mood:5}, idolEffect:{awareness:2}, grantTag:'rumor_monger', priority:3 },
  { id:'tokuten_nervous', name:'紧张得说错话', desc:'面对偶像太紧张，说话结结巴巴的...偶像温柔地鼓励了你。', icon:'😳', condition:()=>true, effect:{mood:3}, idolEffect:{affection:2,mental:1,awareness:1}, priority:3 },
  { id:'tokuten_tired', name:'漫长的排队', desc:'排队时间比预想的长，但见到她的瞬间一切值得。', icon:'😮‍💨', condition:()=>true, effect:{mood:3}, idolEffect:{affection:2}, priority:3 },
  { id:'tokuten_deep_convo', name:'深层交流', desc:'这次聊天意外地深入，双方都敞开了心扉。', icon:'💭', condition:()=>true, effect:{mood:10}, idolEffect:{affection:4,awareness:5}, grantTag:'deep_thinker', priority:3 },

  // ── 选择分支 ──
  { id:'tokuten_fan_letter', name:'递出粉丝信', desc:'鼓起勇气递出了写好的粉丝信...', icon:'✉️', condition:()=>true, priority:3,
    choices:[
      { text:'亲手递给她', desc:'她接过信时手指轻轻碰触，脸微微红了。', effect:{mood:10}, idolEffect:{affection:5,awareness:4,mental:2}, grantTag:'fan_letter' },
      { text:'交给Staff转交', desc:'虽然没亲手递出，但想到她会看到，心里暖暖的。', effect:{mood:6}, idolEffect:{affection:3,awareness:1} },
    ],
  },
  { id:'tokuten_gift_choice', name:'收到回礼', desc:'临走时，偶像突然叫住你：「{playerName}，这个给你...」她递过来一个小礼物。', icon:'🎁',
    minTurn:3, condition:(s)=>(s.actionLog.participate||0)>=5&&Math.random()<0.4, priority:3,
    choices:[
      { text:'开心地收下', desc:'你小心翼翼地收好，这将成为你最珍贵的宝物。', effect:{mood:15}, idolEffect:{affection:5,mental:2,awareness:2} },
      { text:'「这太贵重了...」', desc:'你推辞了一下，但她坚持要给你。', effect:{mood:8}, idolEffect:{affection:4,awareness:1} },
    ],
  },

  // ── 偶像 tag 驱动：人气爆发时额外互动 ──
  { id:'tokuten_popular_shine', name:'人气偶像的光芒', desc:'她今天格外耀眼，排队的人比平时多了不少。轮到你时，她还是热情地招呼了。', icon:'✨',
    requiredIdolTag:'popular_wave', condition:()=>Math.random()<0.4, priority:2,
    effect:{mood:8}, idolEffect:{affection:3,awareness:2}, grantTag:'motivated_fan' },

  // ── 玩家 tag 驱动：大胆粉丝的特殊互动 ──
  { id:'tokuten_bold_move', name:'大胆发言', desc:'你鼓起勇气说出了一直想说的话，周围的人都惊呆了。', icon:'🔥',
    requiredPlayerTag:'bold_fan', condition:()=>Math.random()<0.35, priority:2,
    choices:[
      { text:'表达真心', desc:'偶像怔住了，随即露出了温柔的笑容。', effect:{mood:12}, idolEffect:{affection:6,awareness:4,mental:2} },
      { text:'及时收住', desc:'你赶紧打了个圆场：「开个玩笑啦~」气氛虽然有点微妙但不算太糟。', effect:{mood:3}, idolEffect:{affection:1,mental:-1} },
    ],
  },

  // ── 偶像 tag + 玩家 tag 双重驱动：偶像吃醋 + 你察觉到了 ──
  { id:'tokuten_jealous_notice', name:'察觉到她的情绪', desc:'你注意到她眼神有些躲闪，说话时语气里藏着一点委屈。你想起那条微博...「{playerName}...」她轻声叫了你的名字。', icon:'😤',
    minTurn:2, requiredIdolTag:'jealous', requiredPlayerTag:'deep_thinker', condition:()=>Math.random()<0.5, priority:2,
    choices:[
      { text:'温柔解释', desc:'「上次工作太忙了...但我一直在想你。」她的眼眶微微泛红，但嘴角扬起了笑容。', effect:{mood:10}, idolEffect:{affection:8,mental:3,awareness:3} },
      { text:'直接道歉', desc:'「对不起，上次没来。」她愣了一下，然后轻轻摇了摇头：「...你能来就好。」', effect:{mood:6}, idolEffect:{affection:5,mental:1} },
    ],
  },

  // ── 偶像初始 tag 驱动：重力系（repeatable，每次触发）──
  { id:'tokuten_gravity_pull', name:'无法抗拒的引力', desc:'她的眼神仿佛有一种引力，让你不由自主地想要了解她更多。和她在一起的每一秒都让人心跳加速。', icon:'🌑',
    requiredIdolTag:'gravity', repeatable:true, condition:()=>true, priority:1,
    effect:{mood:4}, idolEffect:{affection:2,mental:-1,awareness:3} },
];
