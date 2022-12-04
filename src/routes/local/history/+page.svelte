<script lang="ts">
	import { HistoryManager } from "$lib";

	let val = "Initial value";
	let index = -1;
	let history: string[] = [];

	const manager = new HistoryManager<string>({
		cap: 10,
		setValue: (value) => (val = value),
		setIndex: (i) => (index = i),
		setHistory: (value) => (history = value)
	});
	$: manager.addEntry(val) || val;
</script>

<h1>Svelte.StoresPlus</h1>

<h2>local variable with history management</h2>

<p>Value: {val}</p>
<input type="text" bind:value={val} />
<button on:click={manager.undo.bind(manager)}>undo</button>
<button on:click={manager.redo.bind(manager)}>redo</button>
<p>Index: {index}</p>
<ul>
	{#each history as item, i}
		<li style={i === index ? "color: crimson;" : ""}>{item}</li>
	{/each}
</ul>
