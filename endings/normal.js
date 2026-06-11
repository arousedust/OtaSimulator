/* ============================
   endings/normal.js - 结局系统
   ENDING_LIST 按优先级排列，遍历时取首个条件匹配的结局
   ============================ */

const ENDING_LIST = [
  // ===== 提前结局（isEarly:true，逐个判断）=====
  {
    id:'early_economy', title:'破产离场', isEarly:true,
    desc:'经济完全枯竭，连最基本的应援都无法维持。你不得不退出偶像宅的世界，回归平凡生活。也许有一天，你会重新回来...',
    condition:(s)=>s.economy<=0,
  },
  {
    id:'early_mood', title:'心如死灰', isEarly:true,
    desc:'心情跌至谷底，再也感受不到应援的快乐。曾经照亮你生活的星光，如今只剩灰烬...',
    condition:(s)=>s.mood<=0,
  },
  {
    id:'early_idol_mental', title:'偶像心理崩溃', isEarly:true,
    desc:'你推的偶像们心理防线彻底崩塌，一个接一个倒下...你无能为力地看着她们的星光逐渐黯淡，而你也随之迷失在黑暗中。',
    condition:(s)=>s.idols.filter(i=>i.mental<=0).length>=2,
  },
  {
    id:'early_idol_affection', title:'推倒心灭', isEarly:true,
    desc:'你和偶像之间的距离越来越远，她们的心逐渐远去...你曾经坚信的羁绊，最终化作了虚无。',
    condition:(s)=>s.idols.filter(i=>i.affection<=0).length>=2,
  },
  {
    id:'early_idol_awareness', title:'偶像迷失', isEarly:true,
    desc:'偶像们逐渐迷失了自我，找不到前进的方向。而你，也只能眼睁睁看着这一切发生...',
    condition:(s)=>s.idols.filter(i=>(i.awareness??50)<=0).length>=2,
  },

  // ===== 正常结局（isEarly:false，时间到后遍历）=====
  {
    id:'legend', title:'传说之推', isEarly:false,
    desc:'一段应援之路，你和偶像之间建立了超越粉丝与偶像的羁绊。她知道你的名字，记住你的脸，在人群中一眼就能找到你。这不只是应援，这是命中注定的相遇。',
    condition:(s)=>s.idols.some(i=>i.affection>=80&&i.awareness>=60),
  },
  {
    id:'true_friend', title:'真正的朋友', isEarly:false,
    desc:'你们之间不再只是偶像与粉丝的关系。她把你当作真正可以信赖的朋友，这份羁绊比任何特典都珍贵。',
    condition:(s)=>s.idols.some(i=>i.affection>=60),
  },
  {
    id:'dedicated_fan', title:'忠实应援', isEarly:false,
    desc:'风雨无阻的应援，你是她最坚实的后盾。虽然没有过多的交集，但你的应援从未缺席。',
    condition:(s)=>s.idols.some(i=>i.affection>=40),
  },
  {
    id:'casual_fan', title:'佛系追星', isEarly:false,
    desc:'虽然参与了不少活动，但总感觉差了点什么。也许下次可以更投入一些？',
    condition:(s)=>s.idols.some(i=>i.affection>=20),
  },
  {
    id:'lost_soul', title:'迷途之羊', isEarly:false,
    desc:'几个月过去了，你既没有建立深厚的感情，也没有找到应援的意义。偶像的世界对你来说，仍然是遥不可及的星光。',
    condition:()=>true,
  },
];

// 向后兼容：ERRY_END_TRIGGERS 可在 events/index.js 动态注册额外提前结局
const EARLY_END_TRIGGERS = [];
