/* ============================
   events/common.js - 玩家通用事件
   ============================ */
const EVENTS_COMMON = [
  { id:'evt_lucky', name:'幸运抽奖', desc:'在活动现场抽中了稀有周边！心情大好！', icon:'🍀', condition:()=>true, effect:{mood:15}, idolEffect:{affection:2}, priority:3 },
  { id:'evt_fan_friend', name:'结识同好', desc:'在现场认识了同推的伙伴，一起应援更开心了。', icon:'🤝', condition:(s)=>s.energy>30, effect:{mood:10}, idolEffect:{attention:1}, priority:3 },
  { id:'evt_flu', name:'感冒了', desc:'应援太累导致感冒，本月精力大打折扣。', icon:'🤒', condition:(s)=>s.energy<40&&s.turn>5, effect:{energy:-20,mood:-5}, idolEffect:{}, priority:2 },
  { id:'evt_sale', name:'周边打折', desc:'官方周边打折！省了一笔钱。', icon:'🛒', condition:()=>true, effect:{economy:500}, idolEffect:{}, priority:3 },
  { id:'evt_burnout', name:'倦怠期', desc:'最近对一切都提不起兴趣，是不是该休息一下？', icon:'😔', condition:(s)=>s.mood<30, effect:{mood:-10,energy:-10}, idolEffect:{affection:-3}, priority:2 },
  { id:'evt_good_news', name:'偶像上电视', desc:'你的推上了综艺节目！看到她活跃的样子，心里暖暖的。', icon:'📺', condition:()=>true, effect:{mood:12}, idolEffect:{attention:5,mental:2}, priority:3 },
  { id:'evt_miss_anniversary', name:'错过了出道纪念日', desc:'因为太累完全忘了今天是推的出道纪念日...她好像有点失落。', icon:'📅', condition:(s)=>s.energy<30&&s.turn>8, effect:{mood:-8}, idolEffect:{affection:-5,mental:-3}, priority:2 },
  { id:'evt_well_rested', name:'精力充沛', desc:'休息得很好，感觉元气满满！本月状态极佳。', icon:'✨', condition:(s)=>s.energy>=80, effect:{mood:8,energy:10}, idolEffect:{}, priority:3 },
  { id:'evt_economy_crisis', name:'物价上涨', desc:'最近什么都在涨价，生活成本增加了不少。', icon:'📈', condition:(s)=>s.turn>12, effect:{economy:-800}, idolEffect:{}, priority:2 },
  { id:'evt_lost_item', name:'遗失物品', desc:'在活动现场不小心丢了东西，心情有些低落。', icon:'😭', condition:()=>true, effect:{economy:-300,mood:-5}, idolEffect:{}, priority:3 },
];
