<script lang="ts">
	import {historic} from "$lib/sandbox/stores/historic";
	import {onDestroy} from "svelte";

	function updateSummary(e: Event): void {
		const target = e.target as HTMLInputElement;
		historic.set(target.value);
	}

	let history: string[] = [];
	let index = 0;

	let unsubscribeHistory = historic.history.subscribe((value) => (history = value));
	let unsubscribeIndex = historic.index.subscribe((value) => (index = value));

	onDestroy(() => {
		unsubscribeHistory();
		unsubscribeIndex();
	});
</script>

<h1>Svelte.StoresPlus</h1>

<h2>HistoricWritable</h2>

<input type="text" value={$historic} on:change={updateSummary} />
<button on:click={historic.undo}>undo</button>
<button on:click={historic.redo}>redo</button>
<button on:click={historic.deleteHistory}>clear</button>
<p>Index: {index}</p>
<ul>
	{#each history as item, i}
		<li style={i === index ? "color: crimson;" : ""}>{item}</li>
	{/each}
</ul>
