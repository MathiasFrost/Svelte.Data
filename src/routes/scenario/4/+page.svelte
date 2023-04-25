<script lang="ts">
	import { store } from "./stores.js";
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 4</h2>
<p>TODO</p>
{#await $store.promise}
	<p>Loading...</p>
{:then}
	<p>{$store.value}</p>
{:catch e}
	<p>{e.message}</p>
{/await}
