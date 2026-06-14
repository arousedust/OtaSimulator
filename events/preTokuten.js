/* ============================
   events/preTokuten.js - 特典前节点事件
   triggerNode:'preTokuten'  endRound 控制是否跳过特典
   ============================ */
const EVENTS_PRE_TOKUTEN = [
  { id:'int_staff_emergency', triggerNode:'preTokuten', endRound:true,
    name:'Staff紧急通知', desc:'工作人员突然宣布：「非常抱歉，今天偶像身体不适，特典会将提前结束...」',
    icon:'🚨', condition:(s)=>s.idols.some(i=>i.mental<40)&&Math.random()<0.4, effect:{mood:-5,economy:150}, priority:2 },
  { id:'int_meet_rival', triggerNode:'preTokuten', endRound:false,
    name:'偶遇竞争对手', desc:'排队时遇到了一个自称"头号粉丝"的人，对方挑衅地看着你。',
    icon:'⚔️', condition:(s)=>(s.actionLog.cheer||0)>=5&&Math.random()<0.3, priority:2,
    choices:[
      { text:'冷静回应', desc:'你用理性和风度赢得了周围人的尊重。', effect:{mood:3}, idolEffect:{_all:{affection:2,awareness:1}}, grantTag:'gentle_soul' },
      { text:'反驳回去', desc:'你们争执了起来...但偶像似乎注意到了你的存在。', effect:{mood:-2}, idolEffect:{_all:{affection:3,mental:-1}}, grantTag:'bold_fan' },
    ],
  },
];
