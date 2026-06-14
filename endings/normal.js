/* ============================
   endings/normal.js - 结局系统
   ENDING_LIST 按优先级排列，遍历时取首个条件匹配的结局
   数值阈值: affection≥70高 / 40~69中 / <40低
            awareness≥70高 / 40~69中 / <40低
            mental≥70压力低 / 41~69压力中 / ≤40压力高
   ============================ */

const AFF_H = 70, AFF_M = 40;
const AWR_H = 70, AWR_M = 40;
const MEN_H = 70, MEN_L = 40;

function many(s, n, fn) { return s.idols.filter(fn).length >= n; }
function some(s, fn) { return s.idols.some(fn); }

const ENDING_LIST = [
  // ===== 提前结局（isEarly:true）=====
  { id:'early_banned', title:'感谢你的支持', isEarly:true,
    desc:'偶像和STF一致决定，你被禁止参加该团后续所有偶活。你的越界行为触碰了底线，地偶圈已经没有你的容身之处了...',
    condition:(s)=>some(s, i=>i.affection<AFF_M&&i.mental<=MEN_L),
  },
  { id:'early_private', title:'私联，金钱关系', isEarly:true,
    desc:'你和她私下建立了联系，转账记录被扒了出来。板子上炸开了锅，偶像失格的风波最终吞噬了你们两个人。她的演艺生涯就此终结，你也被永远钉在了揭示板的耻辱柱上。',
    condition:(s)=>some(s, i=>i.awareness<AWR_M&&i.affection>=AFF_H&&(s.cutCounts[i.id]||0)>=50),
  },
  { id:'early_dead', title:'死掉就不会变心了', isEarly:true,
    desc:'她发现你在切其他人的时候，眼神彻底变了。那条私信只有一句话：「死掉就不会变心了」。其他人再也没有见到你去偶活。',
    condition:(s)=>some(s, i=>hasIdolTag(i,'gravity')&&(i.mental<=MEN_L||i.mental<AFF_H)&&s.idols.reduce((sum,j)=>sum+((s.cutCounts[j.id]||0)-(j.id===i.id?0:0)),0)>=10),
  },
  { id:'early_economy', title:'现生的终结', isEarly:true,
    desc:'经济完全枯竭，连最基本的应援都无法维持。你不得不退出偶像宅的世界，回归平凡生活。',
    condition:(s)=>s.economy<=0,
  },
  { id:'early_mood', title:'崩溃', isEarly:true,
    desc:'心情跌至谷底，再也感受不到应援的快乐。曾经照亮你生活的星光，如今只剩灰烬...',
    condition:(s)=>s.mood<=0,
  },
  { id:'early_idol_mental', title:'偶像心理崩溃', isEarly:true,
    desc:'你推的偶像们心理防线彻底崩塌，一个接一个倒下...你无能为力地看着她们的星光逐渐黯淡。',
    condition:(s)=>s.idols.filter(i=>i.mental<=0).length>=2,
  },
  { id:'early_idol_affection', title:'推倒心灭', isEarly:true,
    desc:'你和偶像之间的距离越来越远，她们的心逐渐远去...你曾经坚信的羁绊，最终化作了虚无。',
    condition:(s)=>s.idols.filter(i=>i.affection<=0).length>=2,
  },
  { id:'early_idol_awareness', title:'偶像迷失', isEarly:true,
    desc:'偶像们逐渐迷失了自我，找不到前进的方向。而你，也只能眼睁睁看着这一切发生...',
    condition:(s)=>s.idols.filter(i=>(i.awareness??50)<=0).length>=2,
  },

  // ===== 标签特殊结局 =====
  { id:'end_graduated', title:'毕业快乐', isEarly:false,
    desc:'从学校毕业后，你去了另一个城市工作。告别的那天，她发了条微博：「毕业快乐，以后也要加油哦」。你没有回复，只是默默点了个赞。也许这就是最好的结局。',
    condition:(s)=>hasPlayerTag(s,'graduated_ota'),
  },
  { id:'end_transferred', title:'工作调动', isEarly:false,
    desc:'一纸调令把你派到了千里之外的城市。临走前最后一场偶活，她似乎察觉到了什么，在你临走时她在背面写了一段文字：「不管在哪里，我们的心都会在一起的」',
    condition:(s)=>hasPlayerTag(s,'transferred'),
  },
  { id:'end_hospital', title:'现场被误伤住院', isEarly:false,
    desc:'开圈的时候你被撞掉了几颗牙。醒来的时候已经在医院了，她的微博@，问你有没有事。你笑了笑，回了一条：「没事，下次还来。」',
    condition:(s)=>hasPlayerTag(s,'injured_hospital'),
  },
  { id:'end_arrested', title:'现场其他人报警被抓', isEarly:false,
    desc:'不知道是谁报的警。警察来的时候，台上的偶像一脸茫然，台下的粉丝四散奔逃。你在派出所蹲了一夜，出来的时候偶活群已经炸了。STF发了公告：该场偶活无限期暂停。你默默关了微博。',
    condition:(s)=>hasPlayerTag(s,'arrested_incident'),
  },

  // ===== 多推结局（≥4个偶像满足条件）=====
  { id:'end_legend', title:'传奇OTA', isEarly:false,
    desc:'四个月里，你和多位偶像建立了超越粉丝与偶像的羁绊。她们在人群中一眼就能找到你，叫出你的名字。你不只是应援，这是命中注定的相遇。圈内所有人都知道你的名字——你是真正的传说。',
    condition:(s)=>many(s,4,i=>i.awareness>=AWR_H&&i.affection>=AFF_H&&i.mental>=MEN_H),
  },
  { id:'end_legend_yaku', title:'传奇厄介', isEarly:false,
    desc:'你投入了全部热情，却也带来了很多麻烦。偶像们认识你，却是因为你那些让人皱眉的厄介行为。揭示板上你的名字出现的频率比你想象的要高得多。你还是那个让人又爱又恨的传说。',
    condition:(s)=>many(s,4,i=>i.awareness>=AWR_H&&i.affection>=AFF_H&&i.mental<=MEN_L),
  },
  { id:'end_strongest_dd', title:'最强DD', isEarly:false,
    desc:'谁也不得罪，谁也不放弃。你的博爱主义让所有偶像都对你心生好感，虽然每个人都知道你不是只推她一个人，但她们依然很开心看到你。你成了现场最受欢迎的面孔。Dare Demo Daisuki——最强DD的称号非你莫属。',
    condition:(s)=>many(s,4,i=>i.awareness>=AWR_M&&i.awareness<AWR_H&&i.affection>=AFF_H&&i.mental>=MEN_H),
  },
  { id:'end_oldman', title:'崩老头', isEarly:false,
    desc:'你对每个人都投入了巨量经济，每张特典券都是你钱包的泪水。但是偶像们对你的存在似乎并没有特别的意识。你就像一台没有感情的出券机器，又是一场偶活，又买了一堆券。',
    condition:(s)=>many(s,4,i=>i.awareness<AWR_M&&(s.cutCounts[i.id]||0)>=30),
  },

  // ===== 单推结局（任意一个偶像满足条件）=====
  { id:'end_precious', title:'更珍贵的感情', isEarly:false,
    desc:'在这四个多月里，你们之间发展出了超越偶像与粉丝的羁绊。她知道你的名字，记住你的脸，在你每次出现的时候眼睛都会亮起来。你从来没有说过那句话，但你们都知道，这已经不是普通的推了。',
    condition:(s)=>some(s,i=>i.awareness>=AWR_H&&i.affection>=AFF_H&&i.mental>=MEN_H),
  },
  { id:'end_heavy_love', title:'沉重的爱', isEarly:false,
    desc:'你的爱太重了。她承受着巨大的压力，但依然对你保持微笑。每一次特典会你都准时出现，每一次切聊你都说得太多。她没有拒绝你，但你知道她很累。你也知道，你停不下来。',
    condition:(s)=>some(s,i=>i.awareness>=AWR_H&&i.affection>=AFF_H&&i.mental<=MEN_L),
  },
  { id:'end_important', title:'重要的存在', isEarly:false,
    desc:'你成了她心中特别的存在。每次演出你在台下，她都格外安心。虽然不常在微博互动，但每次反切她都会认真留言。你们之间保持着恰到好处的距离，却又无比熟悉。这就是最好的推和最好的偶像之间的关系。',
    condition:(s)=>some(s,i=>i.awareness>=AWR_H&&i.affection>=AFF_M&&i.affection<AFF_H&&i.mental>=MEN_H),
  },
  { id:'end_graduate_marry', title:'毕业结婚', isEarly:false,
    desc:'她毕业了。最后一场SP上，她在MC环节对着台下说：「这些年来谢谢大家的支持，特别是某个人...」她的目光停在你身上。全场都安静了。后来你们真的在一起了——不是偶像和粉丝的关系。也许从一开始，就不只是偶活而已。',
    condition:(s)=>some(s,i=>i.awareness>=AWR_M&&i.awareness<AWR_H&&i.affection>=AFF_H&&i.mental>=MEN_H),
  },
  { id:'end_red_exclamation', title:'红色感叹号', isEarly:false,
    desc:'你给她发了太多条消息。那天打开微博，发现你已经无法再评论她了——你被拉黑了。红色感叹号刺痛了你的眼睛。你切了多少张券已经记不清了，但你知道，一切都结束了。',
    condition:(s)=>some(s,i=>i.awareness>=AWR_M&&i.awareness<AWR_H&&i.affection>=AFF_M&&i.affection<AFF_H&&i.mental<=MEN_L),
  },
  { id:'end_only_me', title:'只能喜欢我', isEarly:false,
    desc:'你无法接受她还对其他粉丝甜。每次看到她的微博营业，你都会难受得整晚睡不着。你发了一条私信（虽然知道她不看），写了很久很久。你明白这段感情从一开始就不可能，但你还是说出了那句话：「只能喜欢我」。',
    condition:(s)=>some(s,i=>i.awareness<AWR_M&&i.affection>=AFF_H&&i.mental<=MEN_L),
  },
  { id:'end_grateful_love', title:'感谢偶活使我们相恋', isEarly:false,
    desc:'你从来没有想过会在这里遇到爱情。每一次特典会，每一张拍立得，每一次对望——最终都化作了你们之间最真实的感情。不是嘎比的一厢情愿，不是偶像的营业话术。是真的。谢谢你，偶活。',
    condition:(s)=>some(s,i=>i.awareness<AWR_M&&i.affection>=AFF_H&&(i.mental>MEN_L||i.mental>=AWR_M)),
  },

  // ===== 全局计数结局 =====
  { id:'end_real_life', title:'回归现实', isEarly:false,
    desc:'你花越来越多的时间在现实生活上。偶活逐渐变得遥远，微博的更新提醒不再让你心跳加速。偶尔路过Livehouse的时候会想起曾经站在杆位喊mix的日子，但你只是笑了笑，继续向前走去。这就是成年人吧。',
    condition:(s)=>(s.actionLog.rest||0)+(s.actionLog.focusLife||0)>=12,
  },

  // ===== 兜底 =====
  { id:'lost_soul', title:'迷途之羊', isEarly:false,
    desc:'时间过去，你既没有建立深厚的感情，也没有找到应援的意义。偶像的世界对你来说，仍然是是一团迷雾，但谁的生活又不是呢',
    condition:()=>true,
  },
];

const EARLY_END_TRIGGERS = [];
