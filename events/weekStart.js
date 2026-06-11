/* ============================
   events/weekStart.js - 周开始节点事件
   triggerNode:'weekStart'  endRound 控制是否结束回合
   ============================ */
const EVENTS_WEEK_START = [
  { id:'int_wake_up_late', triggerNode:'weekStart', endRound:true,
    name:'睡过头了！', desc:'闹钟没响，醒来已经中午了...本周计划全被打乱了。',
    icon:'😴', condition:(s)=>s.mood<30&&Math.random()<0.3, effect:{mood:-8}, priority:2 },
  { id:'int_special_invite', triggerNode:'weekStart', endRound:false,
    name:'偶像的特别邀请', desc:'你收到了一条评论：「这周的特典会，我有特别的话想跟你说...能来吗？」',
    icon:'💌', condition:(s)=>(s.actionLog.participate||0)>=8&&Math.random()<0.25, priority:2,
    choices:[
      { text:'当然要去！', desc:'你激动得一夜没睡好。', effect:{mood:15}, idolEffect:{_all:{affection:3,awareness:-5}} },
      { text:'婉拒...', desc:'虽然很想，但觉得时机还不成熟。', effect:{mood:-5}, idolEffect:{_all:{affection:-2}} },
    ],
  },
];
