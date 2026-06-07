/* ============================
   events/idol.js - 小偶像事件
   ============================ */
const EVENTS_IDOL = [
  { id:'evt_idol_sick', name:'偶像体调不良', desc:'你的推最近看起来身体不太好，活动上也有些勉强...', icon:'🤕', condition:(s)=>s.turn>6&&s.idols.some(i=>i.mental<50), effect:{mood:-8}, idolEffect:{_all:{mental:-5}}, priority:1 },
  { id:'evt_idol_bloom', name:'偶像状态绝佳', desc:'你的推最近状态超好！舞台表现力炸裂！', icon:'🌟', condition:(s)=>s.idols.some(i=>i.mental>70&&i.affection>40), effect:{mood:12}, idolEffect:{_all:{attention:3}}, priority:3 },
  { id:'evt_scandal_rumor', name:'流言蜚语', desc:'网上出现了一些关于你推的不实传闻，粉丝们议论纷纷。', icon:'📰', condition:(s)=>s.turn>10, effect:{mood:-5}, idolEffect:{_all:{mental:-5,attention:3}}, priority:2 },
  { id:'evt_new_song', name:'新曲发布', desc:'你的推发布了新曲！单曲循环一整天！', icon:'🎶', condition:()=>true, effect:{mood:15}, idolEffect:{_all:{attention:4,mental:2}}, priority:3 },
  { id:'evt_charity', name:'慈善活动', desc:'偶像参加了慈善活动，你在现场为她加油。', icon:'💝', condition:(s)=>s.turn>5, effect:{mood:10}, idolEffect:{_all:{mental:3,affection:2,attention:2}}, priority:3 },
];
