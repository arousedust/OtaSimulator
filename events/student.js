/* ============================
   events/student.js - 学生专属事件
   ============================ */
const EVENTS_STUDENT = [
  { id:'evt_parttime', name:'兼职收入', desc:'周末做了兼职，赚了些零花钱。', icon:'💵', condition:(s)=>s.character==='student', effect:{economy:800}, idolEffect:{}, priority:1 },
  { id:'evt_exam', name:'考试周', desc:'期末考试来了，不得不放下应援专心复习。', icon:'📚', condition:(s)=>s.character==='student'&&s.turn>=3, effect:{energy:-20,mood:-8}, idolEffect:{}, priority:2 },
];
