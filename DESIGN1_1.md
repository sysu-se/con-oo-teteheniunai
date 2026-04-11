# 改进领域对象并接入Svelte

## 1. 文档目标

本文件对应目标是说明两件事：

1. 在 HW1 的领域对象基础上完成了哪些实质性改进。
2. 如何把领域对象真正接入 Svelte 真实游戏流程，并解释为什么界面会正确刷新。

---

## 2. 方案总览

本次采用了 Store Adapter 方案：

- 领域核心层：src/domain/Sudoku.js, src/domain/Game.js
- 适配层：src/node_modules/@sudoku/stores/grid.js 中的 createGameStore
- 视图层：各 Svelte 组件只读响应式状态，事件中调用适配层方法

最终边界：

- 领域层负责规则与状态演进。
- 适配层负责把领域状态转成 Svelte 可订阅状态。
- 组件层只负责渲染和转发用户意图。

---

## 3. 将领域对象真正接入Svelte真实使用

### 3.1 开始一局游戏

实现：

- 开局题面仍由原流程生成或解码。
- createGameStore 监听题面变化后，创建新的 Sudoku 与 Game 会话。
- 恢复存档时通过 loadFromJSON 重建 Game。

对应位置：

- src/node_modules/@sudoku/stores/grid.js
- src/components/Modal/Types/Welcome.svelte

### 3.2 界面渲染当前局面

当前实现：

- createGameStore 内部持有 Game，并把 gameSession.getSudoku().getGrid() 同步到可订阅 store。
- Board 组件渲染的是 userGrid 这条响应式数据。

对应位置：

- src/node_modules/@sudoku/stores/grid.js
- src/components/Board/index.svelte

### 3.3 用户输入

当前实现：

- Board 输入调用 gameStore.guess。
- Keyboard 输入调用 gameStore.guess。
- 适配层内部再调用 gameSession.guess。

对应位置：

- src/components/Board/index.svelte
- src/components/Controls/Keyboard.svelte
- src/node_modules/@sudoku/stores/grid.js


### 3.4 Undo 和 Redo

当前实现：

- ActionBar 调用 gameStore.undo 与 gameStore.redo。
- 适配层内部调用 gameSession.undo 与 gameSession.redo，再同步响应式状态。

对应位置：

- src/components/Controls/ActionBar/Actions.svelte
- src/node_modules/@sudoku/stores/grid.js

### 3.5 界面自动更新

当前实现：

- 每次领域状态变化后执行 syncBoardFromGame。
- syncBoardFromGame 会把最新 grid 重新 set 到可订阅 store。
- Svelte 组件通过 $userGrid 自动响应更新。

对应位置：

- src/node_modules/@sudoku/stores/grid.js
- src/components/Board/index.svelte
- src/components/Controls/ActionBar/Actions.svelte

---

## 4. 领域对象改进说明

### 4.1 Sudoku 改进

主要改进：

1. 输入与结构不变量收紧

- 构造时校验 9x9。
- 校验单元值范围。
- 校验 row 和 col 边界。

2. 固定题面建模

- 增加 givens 概念。
- 禁止修改初始固定格。
- 对外暴露 isGiven。

3. 冲突结果语义化

- 冲突结果去重。
- 返回包含 row, col, value, reasons 的对象结构。

4. 无变化输入识别

- guess 返回是否真正变化。

对应位置：

- src/domain/Sudoku.js

### 4.2 Game 改进

主要改进：

1. 职责去 UI 化

- 移除 UI 回调状态，Game 聚焦会话与历史。

2. 历史语义改进

- 无变化输入不入栈。

3. 提示语义改进

- 提示写入当前盘面，但不进入 past。
- 因此提示后再落子，撤销只回退后续落子，不回退提示值。

4. 进度恢复能力

- loadProgress 支持新局恢复玩家进度。

对应位置：

- src/domain/Game.js

---

## 5. Store Adapter 设计（createGameStore）

### 5.1 设计目标

createGameStore 的目标是桥接两种模型：

- 领域模型：面向规则和状态演进。
- Svelte 模型：面向可订阅响应式状态。

### 5.2 持有对象

内部持有：

- gameSession：当前 Game 实例
- boardSnapshot：当前渲染快照
- boardStore：Svelte writable

### 5.3 对外暴露

响应式状态：

- subscribe（用于 $userGrid）

可调用命令：

- guess
- applyHint
- undo
- redo
- canUndo
- canRedo
- isGiven
- toJSON
- loadFromJSON
- loadProgress

### 5.4 更新策略

每次命令成功后：

1. 修改 gameSession（领域状态）。
2. 读取 gameSession.getSudoku().getGrid()。
3. set 到 boardStore。
4. 触发 UI 自动刷新。

对应位置：

- src/node_modules/@sudoku/stores/grid.js

---

## 6. View 层如何消费领域对象

### 6.1 View 层直接消费什么

消费对象：gameStore（由 createGameStore 产生）。

传递链路：

- App 把 gameStore 传给 Board 与 Controls。
- Controls 再传给 ActionBar 与 Keyboard。

对应位置：

- src/App.svelte
- src/components/Controls/index.svelte

### 6.2 View 层拿到的数据是什么

主要数据：

- userGrid（当前盘面，用于渲染）
- invalidCells（冲突高亮）
- canUndo 和 canRedo（按钮状态）

### 6.3 用户操作如何进入领域对象

- 棋盘输入：Board -> gameStore.guess -> Game.guess -> Sudoku.guess
- 键盘输入：Keyboard -> gameStore.guess -> Game.guess -> Sudoku.guess
- 提示：ActionBar -> gameStore.applyHint -> Game 当前盘面写入
- 撤销重做：ActionBar -> gameStore.undo/redo -> Game.undo/redo

### 6.4 领域对象变化后为什么会刷新

因为 createGameStore 在每次领域状态变化后都会 set 新的盘面快照到 Svelte store，
而组件通过 $userGrid 订阅这个 store，所以会自动更新。

---

## 7. Svelte 响应式机制说明

### 7.1 依赖的机制

本方案依赖：

- store 与 $store
- 顶层 reactive statement
- 通过 set 触发订阅更新

### 7.2 为什么直接改对象内部字段不一定刷新

Svelte 的 store 订阅触发点在 set 或 update。若只改对象深层字段而不触发 set，
订阅者可能不会按预期更新。

本方案规避方式：

- 所有业务修改先进入领域对象。
- 然后统一调用 syncBoardFromGame，执行 boardStore.set。

### 7.3 为什么直接改二维数组元素容易有风险

直接改二维数组会让修改分散在组件中，容易出现：

- 领域状态和 UI 状态不一致。
- Undo 和 Redo 无法准确表达业务语义。
- 不同入口对同一规则处理不一致。

本方案将输入统一收敛到 gameStore 命令，避免散落变更。

### 7.4 为什么 $: 有时更新、有时不更新

只有当 reactive statement 依赖的值发生变化并被追踪到时，$: 才会重跑。

在本项目中，按钮状态依赖 $userGrid 和 gameStore.canUndo/canRedo，
当 boardStore.set 触发后会驱动该逻辑重算。

### 7.5 间接依赖不触发的风险如何避免

风险：只改领域对象内部，不触发 store.set，UI 不刷新。

规避：所有命令在适配层末尾统一执行 syncBoardFromGame。

---

## 8. 回答问题

### 8.1 Sudoku 与 Game 如何被 View 消费

View 不直接操作 Sudoku 或 Game 实例字段，而是通过 gameStore 方法调用领域行为，
通过 gameStore 的订阅状态完成渲染。

### 8.2 响应式更新如何发生

领域状态变化后，适配层把新 grid set 到 boardStore，
组件通过 $userGrid 自动刷新。

### 8.3 为什么这种写法在 Svelte 中有效

因为它符合 Svelte 3 的推荐路径：

- 用 store 作为响应式边界。
- 用命令函数封装业务状态修改。

### 8.4 哪些数据响应式暴露给 UI，哪些留在领域对象内部

暴露给 UI：

- 当前盘面快照
- 冲突派生状态
- 撤销和重做可用性

留在领域内部：

- givens 不变量
- 历史栈 past 和 future
- 序列化和反序列化细节
- 规则校验细节

### 8.5 不用该方案而直接 mutate 会怎样

会出现：

- 规则绕过（比如固定格保护失效）。
- 历史语义被污染。
- 同一操作在不同组件表现不一致。
- 界面更新行为不可预测。

---

## 9. 相比 HW1 的不足与本次改进的 trade-off

### 9.1 HW1 不足

- 领域对象和真实 UI 流程脱节。
- 组件直接改数组，导致逻辑散落。
- Undo/Redo 容易依赖 UI 实现细节。

### 9.2 本次主要改进

- 用 createGameStore 作为唯一桥接层。
- 输入和撤销重做统一走领域命令。
- 提示与撤销语义分离，符合业务预期。
- 分享码和读档恢复可落到领域状态。

### 9.3 trade-off

- 优点：边界清晰，可解释性强，规则集中。
- 代价：多一层适配代码，状态同步路径更显式。
- 可接受性：在课程作业规模下，这个代价是合理的。

---

## 10. 结论

当前实现已实现：

- 领域规则由 Sudoku 与 Game 承担。
- createGameStore 作为 Svelte 响应式桥接层。
- 主要交互流程由领域命令驱动。
- UI 刷新由 store 机制稳定触发。

满足了关于真实接入、响应式正确性与可解释性的核心要求。
