<script lang="ts">
	import { store } from "./stores.js";
	import TestComponent from "./TestComponent.svelte";
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 2</h2>
<p>String synced to cookie writable</p>

<input type="text" bind:value={$store} />

<button on:click={() => ($store = store.pull())}> pull </button>
<button on:click={store.clear}> reset </button>

<TestComponent />
