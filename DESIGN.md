# Sudoku 游戏领域对象重构

1) `Sudoku` / `Game` 的职责

- `Sudoku`：只负责 9x9 盘面数据的存取、校验、胜利检测、冲突检测、深拷贝、序列化/反序列化和一个简易的 `toString()` 用于调试。
- `Game`：作为聚合根，持有当前 `Sudoku`（`present`），并维护历史快照 `past`/`future` 以及 `initial`。它实现 `guess()`、`undo()`、`redo()`、`reset()`、序列化/反序列化等，UI 通过 `Game` 与领域交互。

2) `Move` 的设计

- `Move` 只是一个值对象（`{ row, col, value }`），不需要身份，等价比较以内容为准，简单直接。

3) 历史（history）存储内容和原因

- 我把 `past`/`future` 都存整盘的 `Sudoku` 快照（深拷贝）。理由：实现最直接，撤销/重做就是恢复快照；数独数据量小，性能开销能接受；避免引用共享导致的历史污染。

4) 复制策略（为什么用深拷贝）

- 所有对外返回的 grid、以及保存到 `past`/`future`/`present`/`initial` 的时候都用 JSON 序列化/反序列化做深拷贝。
- 理由：保证历史不可变，避免后续修改影响历史快照，撤销/重做才可靠。

5) 序列化 / 反序列化

- `Sudoku.toJSON()`、`Game.toJSON()` 输出纯数据结构（只包含 grid 数据），`fromJSON()` 能完整恢复 `present`、`past`、`future`、`initial`。
- 这让本地存档（localStorage 三槽）可以直接存/读，读档后能恢复完整历史，支持之后继续 undo/redo。

6) UI 与领域同步方式（为什么不用全局响应式双向同步）

- 原因：直接让领域对象（`Game`）改动后通过一个显式同步操作把 `userGrid` 更新到 UI，可以避免响应式死循环（之前试过 `$: syncUserGrid()` 会导致循环）。
- 具体做法：每次 `guess()` / `undo()` / `redo()` / `reset()` 后，调用 `Game.getSudoku().getGrid()` 然后逐格更新 `userGrid`（store）的值。这样 UI 始终和 `Game.present` 保持一致。

7) 关于 undo/redo 的实现细节与回调机制

- `Game` 内部保存 `past`/`future`，`guess()` 会把当前 `present` 的深拷贝推入 `past`，并清空 `future`。
- `undo()` 会把当前 `present` 推到 `future`，并弹出 `past` 的快照恢复为 `present`；`redo()` 反向操作。
- 为了让 UI 按钮（↶ / ↷）能在其它组件操作后立即响应，我加了 `setOnChange(cb)` 接口：每当 `guess()`/`undo()`/`redo()`/`reset()` 完成时，`Game` 会调用注册的回调。UI 在回调里更新 `canUndo`/`canRedo` 等本地状态并同步 `userGrid`。

8) 本地存档（3 槽）设计

- 存档就是把 `Game.toJSON()` 存到 `localStorage` 的某个键里；读档会 `createGameFromJSON()` 恢复 `present`/`past`/`future`/`initial` 并同步到 `userGrid`，读档后可以继续 undo/redo。

9) 设计权衡与说明（why this way）

- 简单优先：用快照实现历史简单且可靠，适合作业级别的工程。
- 明确同步：显式从领域到 UI 的同步，避免复杂的双向响应式耦合和潜在死循环。
- 可扩展：如果以后想优化内存，可以把快照改成差分（delta），但那会增加 undo/redo 逻辑复杂度，当前不需要。
