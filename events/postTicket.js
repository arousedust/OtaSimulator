/* ============================
   events/postTicket.js - 购券后节点事件
   triggerNode:'postTicket'  endRound 控制是否跳过会话
   ============================ */
const EVENTS_POST_TICKET = [
  { id:'int_lucky_draw', triggerNode:'postTicket', endRound:true,
    name:'意外的抽奖', desc:'Staff说你今天的购买量进入了特别抽奖名单！要试试运气吗？',
    icon:'🎰', condition:(s)=>{const sel=s.choices.tokutenSelections;return sel.length&&sel.some(x=>(x.ticketCount||0)>=5)&&Math.random()<0.35;}, priority:2,
    choices:[
      { text:'抽！', desc:'你抽中了限定周边！', effect:{mood:12}, idolEffect:{_all:{affection:3,awareness:1}}, grantTag:'lucky_star' },
      { text:'不抽了', desc:'你决定把运气留到下次。', effect:{mood:2} },
    ],
  },
  { id:'int_idol_recognize', triggerNode:'postTicket', endRound:true,
    name:'偶像认出你了', desc:'偶像突然抬头看了你一眼：「啊，我记得你！」',
    icon:'💖', condition:(s)=>{const id=s.choices.tokutenSelections[0]?.idolId;return id&&(s.cutCounts[id]||0)>=15&&Math.random()<0.25;}, priority:2,
    effect:{mood:20}, idolEffect:{affection:8,awareness:5,mental:3},
  },
];
