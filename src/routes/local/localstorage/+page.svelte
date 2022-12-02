<script lang="ts">
	import {LocalStorageSyncer} from "$lib/sync/LocalStorageSyncer";
	import {stringStorage} from "$lib/sync/Syncer";

	const syncer = new LocalStorageSyncer<string>("local_local", stringStorage(""));

	let val = syncer.get("Initial value");
	$: syncer.sync(val) || val;
</script>

<h1>Svelte.StoresPlus</h1>

<h2>local variable with localStorage sync</h2>

<p>Value: {val}</p>
<input type="text" bind:value={val} />
