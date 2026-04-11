<script>
	import { difficulty as difficultyStore } from '@sudoku/stores/difficulty';
	import { startNew, startCustom } from '@sudoku/game';
	import { validateSencode } from '@sudoku/sencode';
	import { DIFFICULTIES } from '@sudoku/constants';
	import { userGrid } from '@sudoku/stores/grid';

	export let data = {};
	export let hideModal;

	const SAVE_CODE_PREFIX = 'SAVE1:';

	let difficulty = $difficultyStore;
	let sencode = data.sencode || '';

	function decodeSaveCode(code) {
		const trimmed = code.trim();
		if (!trimmed.startsWith(SAVE_CODE_PREFIX)) {
			return null;
		}

		try {
			const payload = JSON.parse(atob(trimmed.slice(SAVE_CODE_PREFIX.length)));
			if (!payload || typeof payload !== 'object') {
				return null;
			}

			if (!validateSencode(payload.puzzle)) {
				return null;
			}

			if (!Array.isArray(payload.progress) || payload.progress.length !== 9) {
				return null;
			}

			for (const row of payload.progress) {
				if (!Array.isArray(row) || row.length !== 9) {
					return null;
				}

				for (const cell of row) {
					if (!Number.isInteger(cell) || cell < 0 || cell > 9) {
						return null;
					}
				}
			}

			return payload;
		} catch (error) {
			return null;
		}
	}

	function applyProgress(progress) {
		if (typeof userGrid.loadProgress === 'function') {
			userGrid.loadProgress(progress);
		}
	}

	$: enteredSencode = sencode.trim().length !== 0;
	$: saveCode = decodeSaveCode(sencode);
	$: buttonDisabled = enteredSencode ? !(validateSencode(sencode) || saveCode) : !DIFFICULTIES.hasOwnProperty(difficulty);

	function handleStart() {
		if (saveCode) {
			startCustom(saveCode.puzzle);
			applyProgress(saveCode.progress);
		} else if (validateSencode(sencode)) {
			startCustom(sencode);
		} else {
			startNew(difficulty);
		}

		hideModal();
	}
</script>

<h1 class="text-3xl font-semibold mb-6 leading-none">Welcome!</h1>

{#if data.sencode}
	<div class="p-3 text-lg rounded bg-primary bg-opacity-25 border-l-8 border-primary border-opacity-75 mb-4">
		Someone shared a Sudoku code with you!<br>Just click start if you want to restore it
	</div>
{/if}

<label for="difficulty" class="text-lg mb-3">To start a game, choose a difficulty:</label>

<div class="inline-block relative mb-6">
	<select id="difficulty" class="btn btn-small w-full appearance-none leading-normal" bind:value={difficulty} disabled={enteredSencode}>
		{#each Object.entries(DIFFICULTIES) as [difficultyValue, difficultyLabel]}
			<option value={difficultyValue}>{difficultyLabel}</option>
		{/each}
	</select>

	<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
		<svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
			<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
		</svg>
	</div>
</div>

<label for="sencode" class="text-lg mb-3">Or, paste a shared Sudoku code here to restore your board:</label>

<input id="sencode" class="input font-mono mb-5" bind:value={sencode} type="text">

<div class="flex justify-end">
	<button class="btn btn-small btn-primary" disabled={buttonDisabled} on:click={handleStart}>Start</button>
</div>