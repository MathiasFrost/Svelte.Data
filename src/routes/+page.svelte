<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import { SyncBuilder } from "$lib/SyncBuilder";
	import { onMount } from "svelte";

	const testPromise = () =>
		new Promise<string>((resolve) => {
			window.setTimeout(() => resolve("promise resolved"), 600);
		});

	let { value, update, invoke, error, undo, redo, history, historyIndex } = new SyncBuilder<string>("value")
		.withSerializer((str) => str)
		.withDeserializer((str) => str)
		.fromLocalStorage("test")
		.fromPromise(() => testPromise())
		.to((val) => (value = val))
		.toLocalStorage("test")
		.withHistory()
		.historyTo((entries) => (history = entries))
		.historyIndexTo((index) => (historyIndex = index))
		.withCatch((e) => (error = e))
		.asObject();

	$: update(value);

	onMount(() => invoke());
</script>

<h1>Svelte.StoresPlus</h1>

<h2>Welcome to your library project</h2>
<input type="text" bind:value />

<button on:click={() => invalidateAll()}>reload</button>
<button on:click={() => invoke()}>invoke</button>
<button on:click={() => undo()}>undo</button>
<button on:click={() => redo()}>redo</button>

<ul>
	{#each history as entry, i}
		<li style="color: {historyIndex === i ? 'crimson' : 'inherit'}">{i}: {entry}</li>
	{/each}
</ul>

<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
