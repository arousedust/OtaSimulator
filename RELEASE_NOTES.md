# 发布说明 (Release Notes)
##v0.7.2 - 架构重构 (2026-06-14)
优化结局判断同时增加更多事件补充


## v0.5.0 - 架构重构 (2026-06-11)

### 🎉 概述

v0.5.0 是 OtaSimulator 的重大版本更新，专注于**核心系统架构重构**和**游戏深度扩展**。本版本统一了标签系统、重新设计了事件触发机制、并引入了全新的吃醋系统和玩家昵称支持。

### ✨ 新增功能

#### 1️⃣ 统一标签系统 `NEW`

所有标签（玩家 + 偶像）现已采用统一的定义格式：

```javascript
{
  id: 'tag_id',
  name: '标签名',
  description: '描述',
  effect: { /* 数值增益 */ },
  modifier: { /* 倍数修正 */ },
  actionPenalty: { /* 特定行动的惩罚 */ },
  blockMethods: ['method1'], // 禁用的参与方式
  hidden: true // 隐藏标签不显示在 UI
}
```

**偶像初始被动标签**（`hidden: true`，不影响 UI）：

| 标签 | 效果 | 备注 |
|------|------|------|
| `eloquent` (能��会道) | 与她对话时玩家心情恢复 ×1.15 | 聊天选项提供额外 mood 加成 |
| `gravity` (重力系) | 每次切她都触发独特事件 | 特典事件 `repeatable: true` |
| `ojousama` (大小姐) | 券数分级乘算固定为 1.0 | 无论购多少张都只有基础效果 |
| `natural_idol` (天生偶像) | awareness 每回合 +1 | 被动增长，无需切 |
| `sick` (病气中) | 禁止被选中 | `blockMethods: ['tokuten']` |

**玩家初始被动标签**（按身份差异化）：

- 社畜：`it_ota` - 经济恢复 ×1.2，月度心情消耗 ×1.3
- 学生：`natural_charm` - 经济恢复 ×0.8，月度心情消耗 ×0.7

**新增动态标签**：

- `fatigue` (疲劳) - 选择现场应援时可能触发，现场应援时追加 mood-3 / economy-50
- `focusing_life` (专注生活) - 休息 3 次后解锁，可选「专注现实生活」方式
- `personal_cheered` (被个人应援) - 个人应援时授予，提高好感度 buff
- `jealous` (吃醋) - 被冷落的偶像获得，下次切她时触发特殊对话

#### 2️⃣ 吃醋系统 `NEW`

新增完整的偶像吃醋机制：

```javascript
/**
 * 触发条件：
 * - 偶像累计切数 ≥ 20
 * - 本周没有切该偶像
 * - 本周切了其他偶像
 * - 随机概率 35%
 */
if (cut >= 20 && !thisWeekIds.includes(idol.id) && thisWeekIds.length > 0) {
  if (Math.random() < 0.35) {
    addIdolTag(idol, 'jealous');
  }
}
```

**特殊吃醋对话** (`schat_idol_jealous`)：

- 触发后消费 `jealous` 标签
- 提供独特的情感交互
- 可获得额外的好感度或心情变化

#### 3️⃣ 玩家昵称系统 `NEW`

角色选择页新增昵称输入：

- **输入范围**：2-12 个字符（中英文均支持）
- **显示位置**：游戏内会话、事件描述中
- **替换机制**：`{playerName}` 占位符自动替换为玩家昵称

#### 4️⃣ 节点事件系统 `REDESIGNED`

重新设计事件触发机制，引入专用的节点事件：

```javascript
// 三种新的节点事件（按顺序触发）
const NODE_EVENTS = {
  'weekStart': 周初立即触发（如天气影响、突发新闻）,
  'preTokuten': 特典购买前触发（如预告、预算调整）,
  'postTicket': 特典购买后触发（如包裹损坏、稀有特典）
};
```

**特点**：

- 独立文件管理（`events/weekStart.js` 等）
- 支持 `endRound: true` 跳过该周互动
- 支持 `choices` 选择事件，结算延迟到 UI
- 条件格式统一：`requiredPlayerTag` / `requiredIdolTag` / `minTurn`

#### 5️⃣ 修正对话与事件顺序

- **之前**：事件弹窗 → 对话弹窗（容易遗漏对话）
- **现在**：对话弹窗 → 事件弹窗（更符合逻辑）

### 🔄 重构改进

#### 事件条件格式统一

所有事件现采用统一的条件定义：

```javascript
{
  id: 'event_xxx',
  requiredPlayerTag: 'tag_id', // 玩家需具备的标签
  requiredIdolTag: 'tag_id',   // 偶像需具备的标签
  minTurn: 5,                  // 最小月数
  condition: (state, idol?) => true, // 自定义条件（可选）
}
```

#### 经济立即结算，偶像互动延迟

- **立即结算**：参与方式成本、特典购买成本等立即扣除
- **延迟结算**：偶像互动（对话、会话选择）延迟到 UI 渲染，支持异步处理

#### Modifier 双端叠加

统一收集玩家和偶像的 modifier：

```javascript
const playerModifiers = collectPlayerModifiers(state);
const idolModifiers = collectIdolModifiers(idol);
const finalMult = (playerModifiers.tokutenMoodMult || 1) 
                * (idolModifiers.mentalGainMult || 1);
```

#### 提前结局优先级明确

结局由有序数组遍历，首个条件匹配即为结局：

```javascript
const ENDING_LIST = [
  { id: 'early_economy', isEarly: true, condition: (state) => state.economy <= 0 },
  { id: 'early_mood', isEarly: true, condition: (state) => state.mood <= 0 },
  // ... 其他提前结局
  { id: 'normal_ending_1', isEarly: false, condition: (state) => /* ... */ },
];
```

### 📁 结构优化

#### 文件重组

- ✅ **整合**：`endings/early.js` 合并到 `endings/normal.js`
- ✅ **拆分**：`events/common.js` 等主题文件按节点重新拆分
  - `events/monthly.js` - 月度事件
  - `events/weekStart.js` - 周初事件
  - `events/preTokuten.js` - 特典前事件
  - `events/postTicket.js` - 特典后事件
  - `events/tokuten.js` - 特典互动事件
- ✅ **迁移**：`status/idol.js` 和 `status/player.js` → `tags/idol.js` 和 `tags/player.js`

#### 新增调试接口

在浏览器控制台直接调用：

```javascript
// 增加玩家标签
addPlayerTag(Game.getState(), 'tag_id');

// 增加偶像标签
const idol = Game.getState().idols[0];
addIdolTag(idol, 'tag_id');

// 移除标签
removePlayerTag(state, 'tag_id');
removeIdolTag(idol, 'tag_id');

// 查看标签详情
console.log(PLAYER_TAG_DEFS['tag_id']);
console.log(IDOL_TAG_DEFS['tag_id']);
```

### ⚙️ 配置调整

| 参数 | 原值 | 新值 | 说明 |
|------|------|------|------|
| `TOTAL_MONTHS` | 25 | 4 | 测试阶段缩短游戏周期 |
| `WEEKS_PER_MONTH` | 4 | 4 | 保持不变 |

### 🚀 性能优化

- 特典互动预处理，减少 UI 渲染压力
- 事件条件使用 short-circuit 逻辑，提前终止无关检查
- 标签系统使用 WeakMap 缓存，减少重复查询

### 🐛 Bug 修复

| Issue | 描述 | 修复 |
|-------|------|------|
| #1 | 多选偶像应援时心情计算错误 | 修正为每个偶像单独 -1 |
| #2 | 事件弹窗与对话顺序混乱 | 统一为先对话后事件 |
| #3 | 偶像 awareness 无法增长 | 新增 `natural_idol` 标签被动增长 |
| #4 | 券数乘算影响大小姐偶像 | 大小姐固定乘算为 1.0 |

### 📊 游戏平衡调整

#### 参与方式成本

| 方式 | 成本变化 | 说明 |
|------|---------|------|
| 现场应援 | 500 → 500 | 保持不变 |
| 特典购买 | 100/张 → 100/张 | 保持不变（实际为 100-300 区间） |
| 个人应援 | 无 → 1000 | 新增高成本选项 |
| 看视频 | 0 → 0 | 保持免费 |

#### 月度经济恢复

- 社畜：3000 × 1.2 = 3600（`it_ota` modifier 生效）
- 学生：3000 × 0.8 = 2400（`natural_charm` modifier 生效）

### 🎮 游戏体验

#### 新增会话触发

- 偶像获得特定标签后可触发独特会话
- 支持 `playerTag` 和 `idolTag` 的组合触发
- 会话选择消费标签，防止重复

#### 改进 UI 反馈

- 标签获得实时通知
- 事件触发原因详细说明
- 吃醋事件单独样式展示

### 🔐 向后兼容性

- ✅ 存档兼容性：旧版本存档可直接读入（自动初始化新字段）
- ⚠️ 数据格式变更：`status/` 迁移为 `tags/`，需要手动更新脚本导入
- ❌ API 变更：`resolveEvent()` 函数签名已修改，自定义事件需更新

### 📖 文档更新

- 📝 完整的 README.md 开发指南
- 📝 标签系统详细说明
- 📝 事件添加模板与示例
- 🔧 调试命令速查表

### 🌟 下一步计划（Roadmap）

- [ ] v0.6.0 - UI/UX 大升级（响应式设计、移动端支持）
- [ ] v0.7.0 - 存档系统（本地存储、云端同步）
- [ ] v0.8.0 - 多语言支持（英文、日文）
- [ ] v1.0.0 - 完整版本发布（50+ 偶像、100+ 对话、30+ 结局）

### 🙏 感谢

感谢所有参与内测和反馈的玩家！你们的建议帮助我们打磨出更好的游戏。

---

## 升级指南

### 从 v0.4.x 升级到 v0.5.0

1. **备份旧版本**（如有自定义内容）
2. **更新文件结构**：
   ```bash
   # 删除旧文件
   rm -rf events/common.js events/idol.js events/interact.js events/student.js events/worker.js
   rm -rf status/idol.js status/player.js endings/early.js
   
   # 新版本会自动创建需要的文件
   ```
3. **清除浏览器缓存**（强制刷新）
4. **重新启动游戏**

### 自定义内容迁移

如果你之前添加过自定义标签或事件，参考以下迁移步骤：

```javascript
// 旧格式
const customTag = {
  name: '自定义标签',
  moodEffect: 5
};

// 新格式
const customTag = {
  id: 'custom_tag',
  name: '自定义标签',
  description: '描述',
  effect: { mood: 5 },
  modifier: {}
};
```

---

## 已知问题

| 问题 | 优先级 | 状态 | 计划修复版本 |
|------|--------|------|------------|
| 大量事件同时触发时 UI 可能卡顿 | 中 | 开放 | v0.6.0 |
| 移动端按钮响应区域过小 | 低 | 开放 | v0.6.0 |
| 某些浏览器中文字渲染模糊 | 低 | 开放 | v0.6.0 |

---

**v0.5.0 发布日期**：2026-06-11  
**下一个版本预计**：2026-08-11（v0.6.0）
