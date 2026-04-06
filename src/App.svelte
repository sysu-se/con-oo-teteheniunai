<script>
	import { onMount } from 'svelte';
	import { validateSencode } from '@sudoku/sencode';
	import game from '@sudoku/game';
	import { modal } from '@sudoku/stores/modal';
	import { gameWon } from '@sudoku/stores/game';
	import { grid } from '@sudoku/stores/grid';
	import Board from './components/Board/index.svelte';
	import Controls from './components/Controls/index.svelte';
	import Header from './components/Header/index.svelte';
	import Modal from './components/Modal/index.svelte';

	import { createSudoku, createGame } from './domain';
	let myGame;

	grid.subscribe($grid => {
		if ($grid && $grid.length === 9) {
			const sudoku = createSudoku($grid);
			myGame = createGame({ sudoku });
		}
	});

	gameWon.subscribe(won => {
		if (won) {
			game.pause();
			modal.show('gameover');
		}
	});

	onMount(() => {
		let hash = location.hash;
		if (hash.startsWith('#')) hash = hash.slice(1);
		let sencode;
		if (validateSencode(hash)) sencode = hash;
		modal.show('welcome', { onHide: game.resume, sencode });
	});
</script>

<header>
	<Header />
</header>

<section>
	<Board myGame={myGame} />
</section>

<footer>
	<Controls myGame={myGame} />
</footer>

<Modal />

<style global>
	@import "./styles/global.css";
</style>