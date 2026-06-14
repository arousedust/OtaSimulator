/* ============================
   data/idols.js - 偶像定义池
   数值: mental(精神状态) / affection(好感度) / awareness(偶像意愿)
   initialTags: 初始被动标签，隐藏但影响特典/对话结算
   ============================ */
const IDOL_POOL = [
  { id:'idol_1', name:'星宫莓', desc:'元気いっぱい的偶像新人', emoji:'🍓', mental:80, affection:50, awareness:40,
    initialTags: ['eloquent', 'natural_idol'] },
  { id:'idol_2', name:'月城雪', desc:'冷淡但有故事的偶像', emoji:'❄️', mental:65, affection:40, awareness:70,
    initialTags: ['gravity', 'cool_beauty'] },
  { id:'idol_3', name:'日向葵', desc:'太阳般温暖的治愈系偶像', emoji:'🌻', mental:85, affection:60, awareness:55,
    initialTags: ['eloquent'] },
  { id:'idol_4', name:'天羽凛', desc:'实力派偶像，舞台气场两米八', emoji:'🦅', mental:70, affection:35, awareness:60,
    initialTags: ['gravity'] },
  { id:'idol_5', name:'花咲音', desc:'天才创作型偶像，微博营业王者', emoji:'🎵', mental:55, affection:55, awareness:80,
    initialTags: ['eloquent'] },
  { id:'idol_6', name:'翡翠琉璃', desc:'口嫌体正直的傲娇大人气偶像', emoji:'💎', mental:75, affection:30, awareness:50,
    initialTags: ['tsundere'] },
];
