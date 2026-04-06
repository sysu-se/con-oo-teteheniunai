<script>
	import Timer from './Timer.svelte';
	import Actions from './Actions.svelte';

	export let myGame;

	import { userGrid } from '@sudoku/stores/grid';

	let showLoadDialog = false;
	let saveSlots = ['sudoku-save-1', 'sudoku-save-2', 'sudoku-save-3'];

	function handleUndo() {
		if (myGame && myGame.canUndo()) {
			myGame.undo();
			const grid = myGame.getSudoku().getGrid();
			// 更新 userGrid 中的所有格子
			for (let y = 0; y < 9; y++) {
				for (let x = 0; x < 9; x++) {
					userGrid.set({ x, y }, grid[y][x]);
				}
			}
		}
	}

	function handleRedo() {
		if (myGame && myGame.canRedo()) {
			myGame.redo();
			const grid = myGame.getSudoku().getGrid();
			// 更新 userGrid 中的所有格子
			for (let y = 0; y < 9; y++) {
				for (let x = 0; x < 9; x++) {
					userGrid.set({ x, y }, grid[y][x]);
				}
			}
		}
	}

	// 存档到指定槽位
	function handleSaveToSlot(slot) {
		if (!myGame) return;
		localStorage.setItem(slot, JSON.stringify(myGame.toJSON()));
		alert(`已保存到${slot}！`);
	}

	// 从指定槽位读档
	function handleLoadFromSlot(slot) {
		const data = localStorage.getItem(slot);
		if (data) {
			import('../../../domain').then(({ createGameFromJSON }) => {
				try {
					const loaded = createGameFromJSON(JSON.parse(data));
					// 正确地替换 myGame 的所有属性
					myGame.present = loaded.present;
					myGame.past = loaded.past;
					myGame.future = loaded.future;
					myGame.initial = loaded.initial;
					const grid = myGame.getSudoku().getGrid();
					// 更新 userGrid 中的所有格子
					for (let y = 0; y < 9; y++) {
						for (let x = 0; x < 9; x++) {
							userGrid.set({ x, y }, grid[y][x]);
						}
					}
					showLoadDialog = false;
					alert(`从${slot}恢复成功！`);
				} catch (e) {
					alert('读档失败：' + e.message);
				}
			});
		} else {
			alert(`${slot}没有存档！`);
		}
	}

	function toggleLoadDialog() {
		showLoadDialog = !showLoadDialog;
	}
</script>

<div class="action-bar space-y-3 xs:space-y-0">
	<Timer />

	<div class="flex gap-2 flex-wrap">
		<!-- 使用右侧圆形图标 ↶/↷（Actions.svelte）触发 Undo/Redo，移除重复文本按钮 -->
		<button on:click={() => handleSaveToSlot(saveSlots[0])} class="px-2 py-1 bg-green-500 text-white rounded text-sm">
			存1
		</button>
		<button on:click={() => handleSaveToSlot(saveSlots[1])} class="px-2 py-1 bg-green-500 text-white rounded text-sm">
			存2
		</button>
		<button on:click={() => handleSaveToSlot(saveSlots[2])} class="px-2 py-1 bg-green-500 text-white rounded text-sm">
			存3
		</button>
		<button on:click={toggleLoadDialog} class="px-2 py-1 bg-yellow-500 text-white rounded text-sm">
			读档
		</button>
	</div>

	{#if showLoadDialog}
		<div class="flex gap-2">
			<button on:click={() => handleLoadFromSlot(saveSlots[0])} class="px-2 py-1 bg-yellow-600 text-white rounded text-sm">
				读档1
			</button>
			<button on:click={() => handleLoadFromSlot(saveSlots[1])} class="px-2 py-1 bg-yellow-600 text-white rounded text-sm">
				读档2
			</button>
			<button on:click={() => handleLoadFromSlot(saveSlots[2])} class="px-2 py-1 bg-yellow-600 text-white rounded text-sm">
				读档3
			</button>
			<button on:click={toggleLoadDialog} class="px-2 py-1 bg-gray-500 text-white rounded text-sm">
				取消
			</button>
		</div>
	{/if}

	<Actions myGame={myGame} />
</div>

<style>
	.action-bar {
		@apply flex flex-col flex-wrap justify-between pb-5;
	}

	@screen xs {
		.action-bar {
			@apply flex-row;
		}
	}
</style>