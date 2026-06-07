/* ============================
   events/interact.js - 互动事件（含选择）
   ============================ */
const EVENTS_INTERACT = [
  { id:'evt_fan_meet', name:'粉丝见面会', desc:'参加了粉丝见面会，和同好们度过了愉快的时光！', icon:'🎉', condition:(s)=>s.energy>=40, effect:{mood:15,energy:-5}, idolEffect:{_all:{affection:2}}, priority:3 },
  { id:'evt_rival_fan', name:'粉丝争端', desc:'不同推的粉丝之间发生了争执，气氛有些紧张。', icon:'⚡', condition:(s)=>s.knownIdols.length>=2&&s.turn>8, effect:{mood:-8}, idolEffect:{_all:{mental:-2}}, priority:2,
    choices:[
      { text:'站出来调解', desc:'你主动介入调解，缓和了双方的矛盾。', effect:{mood:-3}, idolEffect:{_all:{affection:3,attention:2}} },
      { text:'默默离开', desc:'不想卷入争端，你悄悄离开了现场。', effect:{mood:-5}, idolEffect:{_all:{affection:-1}} },
      { text:'支持自家推', desc:'你加入了讨论，维护自己推的名誉。', effect:{mood:-2,energy:-5}, idolEffect:{_all:{affection:1,mental:-3}} },
    ],
  },
  { id:'evt_hanami', name:'赏樱偶遇', desc:'周末去公园赏樱，意外遇到了相识的偶像！要不要上前打招呼？', icon:'🌸', condition:(s)=>s.knownIdols.length>0&&s.turn>=3&&s.turn<=20, priority:3,
    choices:[
      { text:'上前打招呼', desc:'鼓起勇气走上前，偶像似乎也认出了你。', effect:{mood:10}, idolEffect:{_all:{affection:5,attention:3}} },
      { text:'远远看着就好', desc:'不想打扰她的私人时间，你选择远远观望。', effect:{mood:5}, idolEffect:{_all:{affection:1}} },
      { text:'偷偷拍照', desc:'你拿出手机偷拍了几张...希望没被发现。', effect:{mood:8}, idolEffect:{_all:{attention:2,mental:-3,affection:-2}} },
    ],
  },
];
