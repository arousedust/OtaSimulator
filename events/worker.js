/* ============================
   events/worker.js - 社畜专属事件
   ============================ */
const EVENTS_WORKER = [
  { id:'evt_bonus', name:'奖金到账', desc:'公司发了季度奖金，你的钱包鼓了起来。', icon:'💰', condition:(s)=>s.character==='worker', effect:{economy:1500}, idolEffect:{}, priority:1 },
  { id:'evt_overtime', name:'加班地狱', desc:'这月疯狂加班，身心俱疲。', icon:'😰', condition:(s)=>s.character==='worker', effect:{energy:-15,mood:-10}, idolEffect:{}, priority:2 },
];
