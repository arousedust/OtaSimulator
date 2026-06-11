# 偶活重度依赖 (OtaSimulator)

> 一个关于「被偶像应援拖垮」的人生模拟游戏

![Version](https://img.shields.io/badge/version-0.5.0-blue)
![Language](https://img.shields.io/badge/language-JavaScript-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 游戏概述

《偶活重度依赖》是一款暗黑幽默的浏览器人生模拟游戏。你将扮演一位深陷偶像应援的宅男或女，在有限的经济和心情之间做出艰难的选择。

### 核心设定

- **游戏周期**：4 个月 × 每月 4 周 = 16 周的应援人生
- **核心数值**：💰 经济、💖 心情
- **角色身份**：社畜（经济充裕，心情消耗大）vs 学生（经济拮据，心情消耗小）
- **偶像互动**：精心设计的对话系统与随机事件
- **多元结局**：根据数值与选择，走向不同的人生终点

## 🕹️ 快速开始

### 在线游玩

直接打开 `index.html` 文件在浏览器中运行即可。不需要额外的服务器或依赖。

```bash
# 克隆仓库
git clone https://github.com/arousedust/OtaSimulator.git
cd OtaSimulator

# 用浏览器打开
open index.html
```

### 游戏流程

1. **标题屏**：点击「开始游戏」
2. **角色选择**：选择身份（社畜/学生），输入昵称（2-12 字）
3. **每周循环**：
   - 🎯 **阶段 1：决定** - 选择本周参与方式（参与/休息/专注生活）
   - 🎬 **阶段 2：方式** - 选择具体参与方式（现场应援/特典/个人应援等）
   - 🎁 **阶段 3：特典** - 选择想购买特典的偶像与张数
4. **每月结算**：查看经济恢复、心情消耗与事件总结
5. **结局揭秘**：游戏结束时根据最终数值与选择显示结局

## 📊 核心机制

### 参与方式

| 方式 | 成本 | 效果 | 特点 |
|------|------|------|------|
| **现场应援** | 💰 500 | 💖 +3 | 切偶像时可以选择多个，每个心情 -1，好感 +5 |
| **特典购买** | 💰 100-300/张 | 💖 ±5-15 | 根据券数确定，触发会话与随机事件 |
| **个人应援** | 💰 1000 | 💖 +10 | 给偶像额外 buff，获得 personal_cheered 标签 |
| **看视频** | 💰 0 | 💖 +2 | 免费，但心情增长有限 |

### 偶像数值

每个偶像拥有三项独立数值：

- **心理健康度（Mental）**：受偶像初始设定、你的切数、参与方式影响
- **好感度（Affection）**：随应援增加，影响对话选项可用性
- **知名度（Awareness）**：在特定对话或事件中增加

### 标签系统

**玩家标签**：
- `it_ota` / `natural_charm` - 身份标签（初始）
- `fatigue` - 疲劳（选择现场应援时可能触发）
- `focusing_life` - 专注生活（休息 3 次后）
- 其他通过事件获得

**偶像标签**：
- `eloquent` - 能说会道（与她对话心情恢复 ×1.15）
- `gravity` - 重力系（每次切都触发独特事件）
- `ojousama` - 大小姐（券数分级乘算固定为 1.0）
- `natural_idol` - 天生偶像（awareness 每回合 +1）
- `sick` - 病气中（禁止被选中）
- `personal_cheered` - 被个人应援（特定事件触发）
- `jealous` - 吃醋（被冷落后可能获得）

### 吃醋系统

当一个偶像的累计切数 ≥ 20，且本周没有切她，但切了其他偶像时，有 35% 概率获得 `jealous` 标签。下次选中她时会触发特殊吃醋对话。

## 📁 项目结构

```
OtaSimulator/
├── index.html              # 主HTML入口
├── style.css               # 样式表（烟火语/暗黑美学）
├── game.js                 # 游戏核心引擎
├── ui.js                   # UI交互与渲染
│
├── data/
│   ├── config.js           # 全局配置（角色、月数、周数）
│   ├── idols.js            # 偶像池定义
│   └── conversations.js    # 对话池
│
├── tags/
│   ├── player.js           # 玩家标签定义与系统
│   └── idol.js             # 偶像标签定义与系统
│
├── events/
│   ├── index.js            # 事件总索引与触发逻辑
│   ├── monthly.js          # 月度事件
│   ├── weekStart.js        # 周初事件（节点事件）
│   ├── preTokuten.js       # 特典前置事件
│   ├── postTicket.js       # 特典后置事件
│   └── tokuten.js          # 特典事件池
│
├── endings/
│   └── normal.js           # 结局定义
│
├── CHANGELOG.md            # 变更日志
├── RELEASE_NOTES.md        # 发布说明
└── README.md               # 本文件
```

## 🎨 美学设定

- **色彩主题**：暗黑/赛博朋克风格
- **字体**：Google Fonts「Noto Sans SC」
- **动效**：流光、脉冲、毛玻璃效果
- **交互**：霓虹按钮、雷达图表、数值条

## 🔧 开发指南

### 添加新偶像

编辑 `data/idols.js`：

```javascript
{
  id: 'idol_xxx',
  name: '新偶像',
  emoji: '😊',
  mental: 70, affection: 30, awareness: 50,
  initialTags: ['eloquent'], // 可选
}
```

### 添加新对话

编辑 `data/conversations.js`：

```javascript
{
  id: 'conv_xxx',
  idolId: 'idol_xxx',
  trigger: { affection: 50 }, // 触发条件
  trigger: { 
    playerTag: 'tag_id',  // 玩家需要的标签
    idolTag: 'tag_id'     // 偶像需要的标签
  },
  texts: ['对白文本'],
  chats: [
    {
      text: '玩家选择',
      effect: { mood: 5 },
      idolEffect: { affection: 3 },
      grantTag: { tagId: 'tag_id', chance: 0.5 } // 可选：概率获得标签
    }
  ]
}
```

### 添加新标签

编辑 `tags/player.js` 或 `tags/idol.js`：

```javascript
const PLAYER_TAG_DEFS = {
  custom_tag: {
    id: 'custom_tag',
    name: '自定义标签',
    description: '标签描述',
    effect: { economy: 100, mood: -5 },           // 数值增益
    modifier: { tokutenMoodMult: 1.2 },           // 倍数修正
    actionPenalty: { cheer: { mood: -3 } },       // 行动惩罚
    blockMethods: ['tokuten'],                    // 禁用的参与方式
    hidden: false                                  // 是否隐藏
  }
};
```

### 添加新事件

编辑 `events/monthly.js` 或 `events/tokuten.js`：

```javascript
{
  id: 'evt_xxx',
  name: '事件名称',
  desc: '事件描述',
  priority: 2,                           // 优先级（1-10，越低越优先）
  repeatable: false,                     // 是否可重复触发
  minTurn: 2,                            // 最少月数限制
  requiredPlayerTag: 'tag_id',           // 玩家标签要求
  requiredIdolTag: 'tag_id',             // 偶像标签要求
  condition: (state, idol?) => true,    // 自定义条件
  effect: { mood: -10 },
  idolEffect: { mental: 5 },
  choices: [                              // 可选：选择型事件
    {
      text: '选择 1',
      effect: { mood: 5 },
      idolEffect: { affection: 3 }
    }
  ]
}
```

### 添加新结局

编辑 `endings/normal.js`：

```javascript
{
  id: 'ending_xxx',
  title: '结局名称',
  desc: '结局描述',
  isEarly: false,                        // 是否为提前结局
  condition: (state) => {
    return state.economy > 10000 && state.mood > 80;
  }
}
```

### 调试模式

在浏览器控制台（F12）中可直接调用：

```javascript
// 增加玩家标签
addPlayerTag(Game.getState(), 'tagId');

// 增加偶像标签
addIdolTag(Game.getState().idols[0], 'tagId');

// 移除玩家标签
removePlayerTag(Game.getState(), 'tagId');

// 移除偶像标签
removeIdolTag(Game.getState().idols[0], 'tagId');

// 查看游戏状态
console.log(Game.getState());

// 快速推进到特定月份
const state = Game.getState();
state.turn = 3; // 快进到第3月

// 修改数值
state.economy = 10000;
state.mood = 100;
```

## 📝 v0.5.0 更新亮点

### ✨ 新增功能

- **统一标签系统**：偶像和玩家标签支持 modifier、effect、penalty
- **节点事件**：`weekStart`、`preTokuten`、`postTicket` 专用触发
- **吃醋系统**：偶像被冷落会吃醋，触发特殊对话
- **玩家昵称**：游戏中会用昵称替换 `{playerName}`
- **专注生活**：休息 3 次可解锁「专注现实生活」选项

### 🔄 重构变更

- 代码按功能/节点拆分，模块化程度提升
- 事件条件格式统一为 `requiredPlayerTag` / `requiredIdolTag` / `minTurn`
- 经济立即结算，偶像互动延迟到 UI（支持异步渲染）
- 提前结局由有序数组触发，优先级更清晰

### 🗑️ 删除内容

- 移除 `endings/early.js`，整合入主结局列表
- 删除多个主题事件文件，统一按节点拆分
- 移除 `status/` 目录，标签系统迁移到 `tags/`

## 🎯 游戏目标

本游戏没有「赢」的定义，只有不同的「结局」：

- ✨ **理想结局**：找到心仪的偶像，在经济与心情的平衡中度过人生
- 💔 **黑化结局**：被偶像应援彻底摧毁经济或心理
- 😌 **躺平结局**：放弃应援，专注生活，找回自我
- 🌀 **循环结局**：沉沦于应援的漩涡，找不到出口

每一个选择都可能改变你的命运。

## 🤝 贡献指南

欢迎 PR 和 Issue！你可以帮助：

- 🐛 修复 bug
- 📝 改进文档
- 🎨 优化美学设计
- 🎮 添加新的对话、事件或偶像
- ⚙️ 平衡游戏参数

### 提交 PR 前请检查

- [ ] 代码遵循现有风格
- [ ] 更新了 CHANGELOG.md
- [ ] 测试了主要流程
- [ ] 中英文注释清晰

## 📚 相关链接

- [CHANGELOG.md](./CHANGELOG.md) - 完整变更历史
- [RELEASE_NOTES.md](./RELEASE_NOTES.md) - v0.5.0 详细发布说明
- [Issues](https://github.com/arousedust/OtaSimulator/issues) - 报告问题
- [Discussions](https://github.com/arousedust/OtaSimulator/discussions) - 讨论建议

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 💬 反馈与支持

- 提交 [Issue](https://github.com/arousedust/OtaSimulator/issues)
- 参加 [Discussions](https://github.com/arousedust/OtaSimulator/discussions)

---

**警告**：本游戏纯属虚构，任何与真实偶像、人物或事件的相似之处纯属巧合。  
不鼓励真实应援过度消费。保持理性追星，健康生活！ 💖

**最后更新**：2026-06-11  
**最新版本**：v0.5.0
