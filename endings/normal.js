/* ============================
   endings/normal.js - 正常结局
   ============================ */
const ENDINGS_NORMAL = {
  legend:        { title:'传说之推', desc:'25个月的应援之路，你和偶像之间建立了超越粉丝与偶像的羁绊。她知道你的名字，记住你的脸，在人群中一眼就能找到你。这不只是应援，这是命中注定的相遇。', isEarly:false, condition:(s)=>s.idols.some(i=>i.bondLevel>=5&&i.affection>=70) },
  true_friend:   { title:'真正的朋友', desc:'你们之间不再只是偶像与粉丝的关系。她把你当作真正可以信赖的朋友，这份羁绊比任何特典都珍贵。', isEarly:false, condition:(s)=>s.idols.some(i=>i.bondLevel>=4&&i.affection>=50) },
  dedicated_fan: { title:'忠实应援', desc:'25个月的风雨无阻，你是她最坚实的后盾。虽然没有过多的交集，但你的应援从未缺席。', isEarly:false, condition:(s)=>s.idols.some(i=>i.bondLevel>=2) },
  casual_fan:    { title:'佛系追星', desc:'虽然参与了不少活动，但总感觉差了点什么。也许下次可以更投入一些？', isEarly:false, condition:(s)=>s.idols.some(i=>i.bondLevel>=1) },
  lost_soul:     { title:'迷途之羊', desc:'25个月过去了，你既没有建立深厚的羁绊，也没有找到应援的意义。偶像的世界对你来说，仍然是遥不可及的星光。', isEarly:false, condition:()=>true },
};

// 合并结局（供 game.js 使用）
const ENDINGS = { ...ENDINGS_EARLY, ...ENDINGS_NORMAL };
