<script>
	import Timer from './Timer.svelte';
	import Actions from './Actions.svelte';

	export let gameStore;

	let showLoadDialog = false;
	let saveSlots = ['sudoku-save-1', 'sudoku-save-2', 'sudoku-save-3'];

	function handleSaveToSlot(slot) {
		if (!gameStore) return;
		localStorage.setItem(slot, JSON.stringify(gameStore.toJSON()));
		alert(`已保存到${slot}！`);
	}

	function handleLoadFromSlot(slot) {
		const data = localStorage.getItem(slot);
		if (data) {
			try {
				if (gameStore && typeof gameStore.loadFromJSON === 'function') {
					gameStore.loadFromJSON(JSON.parse(data));
					showLoadDialog = false;
					alert(`从${slot}恢复成功！`);
				} else {
					alert('当前游戏对象不支持读档恢复。');
				}
			} catch (e) {
				alert('读档失败：' + e.message);
			}
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

	<Actions gameStore={gameStore} />
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