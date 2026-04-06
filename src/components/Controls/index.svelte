<script>
	import ActionBar from './ActionBar/index.svelte';
	import Keyboard from './Keyboard.svelte';
	export let myGame;
</script>

<div class="px-4 pb-5 flex justify-center">
	<div class="w-full max-w-xl">
		<ActionBar myGame={myGame} />
		<Keyboard myGame={myGame} />
	</div>
</div>