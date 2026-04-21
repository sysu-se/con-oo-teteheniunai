# con-oo-teteheniunai - Review

## Review 结论

代码已经做出了一个可辨认的领域层，并且通过 custom store 把部分主流程接进了 Svelte；但目前领域模型的关键语义没有闭合，尤其是 snapshot/序列化会污染 givens，且 UI 仍保留旧 `grid` 作为并行真相源，导致撤销、读档、分享等流程存在实质性设计缺陷。整体上属于“方向对了，但还不能算高质量完成接入”。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | fair |
| OOD | poor |

## 缺点

### 1. clone/序列化会把玩家填写的数字错误地固化为 givens

- 严重程度：core
- 位置：src/domain/Sudoku.js:67-115; src/domain/Game.js:22-24,40-47,98-104
- 原因：`Sudoku` 的 `givens` 是由当前 `grid` 的非零值重新推导出来的；因此 `clone()`、`fromJSON()`、以及 `Game` 在 history/save-load 中对 `Sudoku` 的复制，都会把玩家后来填入的数字当成题目原始 givens。结果是 undo/redo 后某些用户输入会变成不可再编辑的固定格，读档恢复后也会出现同样问题。这直接破坏了数独业务语义和 Game 的历史建模。

### 2. Svelte 接入仍保留两套真相源，读档后 UI 与领域对象可能失真

- 严重程度：core
- 位置：src/node_modules/@sudoku/stores/grid.js:110-114,220-223; src/components/Board/index.svelte:56-59; src/components/Modal/Types/Share.svelte:17-20
- 原因：当前可变盘面来自 `gameSession`，但题目 givens 和分享编码仍依赖旧的 `grid` store。`loadFromJSON()` 只替换 `gameSession`，并不会同步 `grid`；因此从本地存档恢复另一局时，棋盘显示中的 `userNumber` 判断和分享出来的 puzzle code 都可能与真实 `Game` 内部状态不一致。这说明领域对象还没有成为 UI 唯一可信来源。

### 3. 提示操作绕过了 Game 的命令边界，也没有进入历史

- 严重程度：major
- 位置：src/domain/Game.js:28-35; src/node_modules/@sudoku/stores/grid.js:127-153
- 原因：领域层虽然定义了 `Game.applyHint()`，但适配层并没有调用它，而是直接操作 `gameSession.present` 和 `gameSession.future`。这既破坏了封装，也让 hint 这种真实游戏动作没有统一进入历史管理；按当前代码，提示后通常不能像普通输入那样被 undo，业务行为不一致。

### 4. 冲突判断和胜利判断仍然写在 Svelte store，而不是复用领域对象

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/grid.js:229-273; src/node_modules/@sudoku/stores/game.js:7-18
- 原因：`Sudoku.checkConflicts()` 和 `Game.isSolved()` 已经存在，但接入层仍然重新扫描二维数组来计算 `invalidCells` 和 `gameWon`。这让同一套数独规则同时存在于 domain 和 UI/store 两处，削弱了领域对象作为业务中心的价值，也提高了后续规则演进时发生分叉的风险。

### 5. custom store 的 API 伪装成 writable，但 `set` 语义并不符合 Svelte 惯例

- 严重程度：minor
- 位置：src/node_modules/@sudoku/stores/grid.js:116-125
- 原因：这个 store 暴露了 `subscribe` 和 `set`，但 `set(pos, value)` 实际是“执行一步落子命令”，不是“整体替换 store 值”。这对 Svelte/JS 生态来说不够直观，降低了可读性和可复用性；更清晰的做法是把它显式命名为 `guess`/`applyMove` 之类的命令接口。

## 优点

### 1. Sudoku 在领域边界上做了比较完整的输入校验

- 位置：src/domain/Sudoku.js:26-44,78-97,219-223
- 原因：网格尺寸、单元值范围、坐标范围、以及 fixed cell 的不可修改性都集中在 `Sudoku` 内部校验，而不是散落在组件事件中，这符合把业务约束放进领域对象的方向。

### 2. 冲突检测返回了结构化结果，而不是只给布尔值

- 位置：src/domain/Sudoku.js:150-217
- 原因：`checkConflicts()` 返回 `row/col/value/reasons` 这样的结构，说明建模时考虑了 UI 需要消费的业务信息，后续无论是高亮还是提示，都比单纯返回 `true/false` 更可扩展。

### 3. 主要输入与撤销/重做流程已经改为通过 store adapter 调用领域接口

- 位置：src/components/Board/index.svelte:32-39; src/components/Controls/Keyboard.svelte:22-29; src/components/Controls/ActionBar/Actions.svelte:38-51
- 原因：棋盘输入、键盘输入、Undo/Redo 都不再直接改二维数组，而是走 `gameStore.guess()` / `undo()` / `redo()`。从“UI 直接操作状态”转向“UI 调领域命令”，这是本次作业要求的正确接入方向。

### 4. 适配层理解了 Svelte 需要通过 store 发布新值来触发刷新

- 位置：src/node_modules/@sudoku/stores/grid.js:79-91,103-107,156-173,211-223
- 原因：`syncBoardFromGame()` 每次在领域对象变化后都会提取快照并 `boardStore.set(...)`，这比在组件里直接 mutate 对象字段更符合 Svelte 3 的响应式机制，也解释了为什么界面可以随着 Game 状态更新。

## 补充说明

- 本次结论完全基于静态阅读；按你的要求没有运行 test，也没有实际启动页面验证交互。
- 与 Svelte 接入相关的判断主要来自这些调用链的静态分析：`src/App.svelte`、`src/node_modules/@sudoku/game.js`、`src/node_modules/@sudoku/stores/grid.js`、`src/node_modules/@sudoku/stores/game.js`、`src/components/Board/index.svelte`、`src/components/Controls/Keyboard.svelte`、`src/components/Controls/ActionBar/*.svelte`、`src/components/Modal/Types/Welcome.svelte`、`src/components/Modal/Types/Share.svelte`。
- 关于 Undo/Redo、提示、读档后 givens 是否失真等结论，都是根据 `clone()/fromJSON()/history/save-load` 的代码路径推导出来的静态结论，而不是运行结果。
- 审查范围已按要求收敛到 `src/domain/*` 及其关联的 Svelte 接入点，没有扩展评价无关目录中的其他 UI/样式问题。
