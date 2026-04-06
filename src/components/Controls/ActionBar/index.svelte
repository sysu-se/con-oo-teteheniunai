<script>
	import Timer from './Timer.svelte';
	import Actions from './Actions.svelte';

	export let myGame;

	import { userGrid } from '@sudoku/stores/grid';

	function handleUndo() {
		if (myGame && myGame.canUndo()) {
			myGame.undo();
			userGrid.set(myGame.getSudoku().getGrid());
		}
	}

	function handleRedo() {
		if (myGame && myGame.canRedo()) {
			myGame.redo();
			userGrid.set(myGame.getSudoku().getGrid());
		}
	}

	// 存档与读档
	function handleSave() {
		localStorage.setItem('sudoku-save', JSON.stringify(myGame.toJSON()));
		alert('游戏已存档！');
	}
	function handleLoad() {
		const data = localStorage.getItem('sudoku-save');
		if (data) {
			import('../../../domain').then(({ createGameFromJSON }) => {
				const loaded = createGameFromJSON(JSON.parse(data));
				Object.assign(myGame, loaded);
				alert('存档已恢复！');
			});
		} else {
			alert('没有可用存档！');
		}
	}
</script>

<div class="action-bar space-y-3 xs:space-y-0">
	<Timer />

	<div class="flex gap-3">
		<button on:click={handleUndo} disabled={!myGame || !myGame.canUndo()}
			class="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300">
			Undo
		</button>
		<button on:click={handleRedo} disabled={!myGame || !myGame.canRedo()}
			class="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300">
			Redo
		</button>
		<button on:click={handleSave} class="px-3 py-1 bg-green-500 text-white rounded">
			存档
		</button>
		<button on:click={handleLoad} class="px-3 py-1 bg-yellow-500 text-white rounded">
			读档
		</button>
	</div>

	<Actions />
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