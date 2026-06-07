/* ============================
   events/tokuten.js - 特典事件（特典结束后概率触发）
   ============================ */
const TOKUTEN_EVENT_POOL = [
  { id:'tokuten_memory', name:'美好的回忆', desc:'和偶像的对话成为了珍贵的回忆，今天真是太棒了。', icon:'💫', condition:()=>true, effect:{mood:8}, idolEffect:{affection:3,mental:2}, priority:3 },
  { id:'tokuten_lucky', name:'签运爆棚', desc:'买券抽到了亲笔签名！其他在场的ota都投来羡慕的目光。', icon:'🍀', condition:()=>true, effect:{mood:12}, idolEffect:{attention:5,affection:3}, priority:3 },
  { id:'tokuten_gossip', name:'听到了小道消息', desc:'特典会上从staff那里听到：偶像最近在筹备惊喜企划。', icon:'👂', condition:()=>true, effect:{mood:5}, idolEffect:{attention:3}, priority:3 },
  { id:'tokuten_nervous', name:'紧张得说错话', desc:'面对偶像太紧张，说话结结巴巴的...偶像温柔地鼓励了你。', icon:'😳', condition:()=>true, effect:{mood:3}, idolEffect:{affection:2,mental:1}, priority:3 },
  { id:'tokuten_tired', name:'漫长的排队', desc:'特典会排队时间比预想的长，但和偶像聊天的瞬间一切值得。', icon:'😮‍💨', condition:()=>true, effect:{energy:-3,mood:5}, idolEffect:{affection:2}, priority:3 },
];
