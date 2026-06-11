/* ============================
   events/monthly.js - 月结算事件
   触发: 每月末 triggerEvents()
   条件: s.character(身份) / s.actionLog(计数) / s.playerTags(标签) / s.turn(轮次)
   ============================ */
const EVENTS_MONTHLY = [
  // ── 通用 ──
  { id:'evt_lucky', name:'幸运抽奖', desc:'在活动现场抽中了稀有周边！', icon:'🍀', condition:()=>true, effect:{mood:15}, idolEffect:{affection:2}, grantTag:'lucky_star', priority:3 },
  { id:'evt_fan_friend', name:'结识同好', desc:'在现场认识了同推的伙伴。', icon:'🤝', condition:(s)=>s.mood>30, effect:{mood:10}, idolEffect:{awareness:1}, priority:3 },
  { id:'evt_flu', name:'感冒了', desc:'最近太拼结果病倒了。', icon:'🤒', condition:(s)=>s.mood<40&&s.turn>5, effect:{mood:-10}, priority:2 },
  { id:'evt_sale', name:'周边打折', desc:'官方周边打折！省了一笔钱。', icon:'🛒', condition:()=>true, effect:{economy:500}, priority:3 },
  { id:'evt_burnout', name:'倦怠期', desc:'最近对一切都提不起兴趣...', icon:'😔', condition:(s)=>s.mood<30, effect:{mood:-12}, idolEffect:{affection:-3}, priority:2 },
  { id:'evt_good_news', name:'偶像上电视', desc:'你的推上了综艺节目！', icon:'📺', condition:()=>true, effect:{mood:12}, idolEffect:{mental:2,awareness:2}, priority:3 },
  { id:'evt_miss_anniversary', name:'错过了出道纪念日', desc:'完全忘了今天是推的出道纪念日...', icon:'📅', condition:(s)=>s.mood<30&&s.turn>8, effect:{mood:-8}, idolEffect:{affection:-5,mental:-3,awareness:-2}, priority:2 },
  { id:'evt_well_rested', name:'状态绝佳', desc:'调整好了状态，感觉元气满满！', icon:'✨', condition:(s)=>s.mood>=80, effect:{mood:12}, grantTag:'motivated_fan', priority:3 },
  { id:'evt_economy_crisis', name:'物价上涨', desc:'最近什么都在涨价...', icon:'📈', condition:(s)=>s.turn>12, effect:{economy:-800}, priority:2 },
  { id:'evt_lost_item', name:'遗失物品', desc:'在活动现场不小心丢了东西。', icon:'😭', condition:()=>true, effect:{economy:-300,mood:-5}, priority:3 },

  // ── 计数触发 ──
  { id:'evt_veteran_ota', name:'老手OTA', desc:'参加了十几次偶活，已经是经验丰富的应援者了！', icon:'🏆', condition:(s)=>s.actionLog.participate>=10, effect:{mood:15}, idolEffect:{_all:{affection:3,awareness:1}}, grantTag:'stage_expert', priority:2 },
  { id:'evt_underground', name:'地下应援者', desc:'你的地藏行为引起了一些同好的注意...', icon:'📦', condition:(s)=>(s.actionLog.stash||0)>=5, effect:{mood:8}, idolEffect:{_all:{affection:5}}, priority:2 },
  { id:'evt_cheer_master', name:'应援达人', desc:'场场不落地来现场应援，热情感染了周围的人！', icon:'🔥', condition:(s)=>(s.actionLog.cheer||0)>=8, effect:{mood:10,economy:-200}, idolEffect:{_all:{mental:3,affection:2}}, grantTag:'motivated_fan', priority:2 },
  { id:'evt_lazy_week', name:'好久没活动了', desc:'连续几周没参加偶活，有些生疏了...', icon:'😴', condition:(s)=>(s.actionLog.rest||0)>=4&&s.actionLog.rest%4===0, effect:{mood:-5}, priority:3 },
  { id:'evt_early_phase', name:'新手期结束', desc:'逐渐适应了OTA生活，找到自己的应援风格。', icon:'🌱', condition:(s)=>s.actionLog.totalWeeks===8, effect:{mood:10}, priority:1 },
  { id:'evt_midgame_boost', name:'中期冲刺', desc:'游戏进入中期，决定更加努力地应援！', icon:'🚀', condition:(s)=>s.turn===12, effect:{mood:15,economy:1000}, idolEffect:{_all:{affection:2}}, priority:1 },

  // ── 偶像相关 ──
  { id:'evt_idol_sick', name:'偶像体调不良', desc:'你的推最近看起来身体不太好...', icon:'🤕', condition:(s)=>s.turn>6&&s.idols.some(i=>i.mental<50), effect:{mood:-8}, idolEffect:{_all:{mental:-5,awareness:-2}}, priority:1 },
  { id:'evt_idol_bloom', name:'偶像状态绝佳', desc:'你的推最近状态超好！', icon:'🌟', condition:(s)=>s.idols.some(i=>i.mental>70&&i.affection>40), effect:{mood:12}, idolEffect:{_all:{awareness:2}}, priority:3 },
  { id:'evt_scandal_rumor', name:'流言蜚语', desc:'网上出现了关于你推的不实传闻。', icon:'📰', condition:(s)=>s.turn>10, effect:{mood:-5}, idolEffect:{_all:{mental:-5}}, grantTag:'rumor_monger', priority:2 },
  { id:'evt_new_song', name:'新曲发布', desc:'你的推发布了新曲！', icon:'🎶', condition:()=>true, effect:{mood:15}, idolEffect:{_all:{mental:2,awareness:3}}, priority:3 },
  { id:'evt_charity', name:'慈善活动', desc:'偶像参加了慈善活动。', icon:'💝', condition:(s)=>s.turn>5, effect:{mood:10}, idolEffect:{_all:{mental:3,affection:2,awareness:1}}, grantTag:'deep_thinker', priority:3 },

  // ── 互动（含 choices）──
  { id:'evt_fan_meet', name:'粉丝见面会', desc:'和同好们度过了愉快的时光！', icon:'🎉', condition:(s)=>s.mood>=40, effect:{mood:12}, idolEffect:{_all:{affection:2}}, grantTag:'gentle_soul', priority:3 },
  { id:'evt_rival_fan', name:'粉丝争端', desc:'不同推的粉丝之间发生了争执。', icon:'⚡', condition:(s)=>s.knownIdols.length>=2&&s.turn>8, effect:{mood:-8}, idolEffect:{_all:{mental:-2}}, priority:2,
    choices:[
      { text:'站出来调解', desc:'你主动介入调解，缓和了双方的矛盾。', effect:{mood:-3}, idolEffect:{_all:{affection:3}}, grantTag:'gentle_soul' },
      { text:'默默离开', desc:'不想卷入争端，你悄悄离开了。', effect:{mood:-5}, idolEffect:{_all:{affection:-1}} },
      { text:'支持自家推', desc:'你加入讨论，维护自己推的名誉。', effect:{mood:-3}, idolEffect:{_all:{affection:1,mental:-3}}, grantTag:'bold_fan' },
    ],
  },
  { id:'evt_hanami', name:'赏樱偶遇', desc:'周末赏樱，意外遇到了相识的偶像！', icon:'🌸', condition:(s)=>s.knownIdols.length>0&&s.turn>=3&&s.turn<=20, priority:3,
    choices:[
      { text:'上前打招呼', desc:'鼓起勇气走上前，偶像似乎也认出了你。', effect:{mood:10}, idolEffect:{_all:{affection:5,awareness:3}}, grantTag:'stage_expert' },
      { text:'远远看着就好', desc:'不想打扰她，你选择远远观望。', effect:{mood:5}, idolEffect:{_all:{affection:1}} },
      { text:'偷偷拍照', desc:'你拿出手机偷拍了几张...希望没被发现。', effect:{mood:8}, idolEffect:{_all:{mental:-3,affection:-2}}, grantTag:'rumor_monger' },
    ],
  },

  // ── 身份相关 ──
  { id:'evt_bonus', name:'奖金到账', desc:'公司发了季度奖金！', icon:'💰', condition:(s)=>s.character==='worker', effect:{economy:1500}, priority:1 },
  { id:'evt_overtime', name:'加班地狱', desc:'这月疯狂加班，身心俱疲。', icon:'😰', condition:(s)=>s.character==='worker', effect:{mood:-12}, priority:2 },
  { id:'evt_time_master', name:'时间管理大师', desc:'工作再忙也坚持参加偶活！', icon:'⏰', condition:(s)=>s.character==='worker'&&s.actionLog.participate>=15, effect:{mood:12}, idolEffect:{_all:{affection:3}}, priority:2 },
  { id:'evt_parttime', name:'兼职收入', desc:'周末做了兼职，赚了些零花钱。', icon:'💵', condition:(s)=>s.character==='student', effect:{economy:800}, priority:1 },
  { id:'evt_exam', name:'考试周', desc:'期末考试来了，不得不放下应援专心复习。', icon:'📚', condition:(s)=>s.character==='student'&&s.turn>=3, effect:{mood:-10}, priority:2 },
  { id:'evt_scholarship', name:'奖学金到账', desc:'努力学习获得奖学金！', icon:'🎓', condition:(s)=>s.character==='student'&&(s.actionLog.stash||0)>=5, effect:{economy:1200}, priority:2 },

  // ── 标签触发: requiredTag 优先级 > condition ──
  { id:'evt_gachi_confession', name:'心意察觉', desc:'最近你对她特别上心...她似乎也察觉到了什么。这天她突然约你私下聊聊。', icon:'💝', requiredTag:(s)=>!!getGachiTag(s), condition:()=>Math.random()<0.3, priority:1,
    choices:[
      { text:'坦率面对', desc:'你说出了自己的真实想法。她沉默了一会，然后温柔地笑了。', effect:{mood:12}, idolEffect:{_all:{affection:8,awareness:5,mental:2}} },
      { text:'装作若无其事', desc:'你说"只是作为粉丝支持你"。她似乎有些失落，但很快恢复了笑容。', effect:{mood:3}, idolEffect:{_all:{affection:2}} },
    ],
  },
];
