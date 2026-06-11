# Changelog

## v0.5.0 (2026-06-11) — 架构重构

### 🏷️ 标签系统

- **偶像初始被动标签**：`hidden + turn:-1` 永久生效，不影响 UI 展示
  - `eloquent` 能说会道：与她对话时玩家心情恢复 ×1.15
  - `gravity` 重力系：每次切她都触发独特事件
  - `ojousama` 大小姐：券数分级乘算固定为 1.0
  - `natural_idol` 天生偶像：awareness 每回合 +1
  - `sick` 病気中：`blockTokuten` 禁止被选中
- **玩家初始被动标签**：`it_ota`（社畜）/ `natural_charm`（学生）
- **actionPenalty**：`fatigue` 标签选 `cheer` 时追加 mood-3 / economy-50
- **blockMethods**：`injured` 标签禁止 `cheer`
- **modifier 双端叠加**：`collectPlayerModifiers` 同时聚合偶像 `playerModifiers` + 玩家 `modifiers`

### 📅 事件引擎

- **统一条件格式**：`requiredPlayerTag` / `requiredIdolTag` / `minTurn`
- **repeatable**：gravity 类事件每次切偶像都触发
- **节点事件**：`preTokuten` / `postTicket` / `weekStart` 独立文件
- **Math.random() 统一在 condition 中**：引擎不做额外随机门
- **事件弹窗顺序修正**：对话 → 事件（之前是事件 → 对话）

### 🎮 结局机制

- `ENDING_LIST` 有序数组，遍历取首个条件匹配
- `checkGameOver()` 每周 `nextWeek()` 检查，非仅月末
- 提前结局细分：`early_economy` / `early_mood` / `early_idol_mental` / `early_idol_affection` / `early_idol_awareness`

### 👤 玩家系统

- 角色选择页新增昵称输入（2-12 字）
- 会话/事件中 `{playerName}` 自动替换为玩家昵称
- `getAvailableParticipation`：参与方式按 `requiredRest` / `requiredTag` / `blockMethods` 过滤
- `focus_life`：休息 3 次后解锁「专注现实生活」→ 获得 `focusing_life` 标签

### 💬 对话系统

- `selectConversation` 已检查 `trigger.playerTag` + `trigger.idolTag`
- 特殊会话触发后消费对应 idol tag
- 新增 `schat_idol_jealous` 吃醋特殊会话

### 🍰 吃醋系统

- 偶像累计切数 ≥20 + 本周没切她 + 切了别人 → 35% 概率获得 `jealous` 标签
- 下次切她时触发特殊对话，消费标签

### 🛠 调试

- 控制台可直接调用 `addPlayerTag(state, tagId)` / `addIdolTag(idol, tagId)`

### 🗑 删除

- `endings/early.js` — 合并到 `normal.js` 的 `ENDING_LIST`
- `events/common.js` / `idol.js` / `interact.js` / `student.js` / `worker.js` — 按节点拆分
- `status/idol.js` / `player.js` — 迁移到 `tags/`

### ⚙️ 配置

- `TOTAL_MONTHS` 25 → 4（测试阶段）
