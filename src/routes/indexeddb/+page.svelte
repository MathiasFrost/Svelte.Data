<script lang="ts">
	import {indexedDB} from "$lib/sandbox/stores/indexedDB";
</script>

<h1>Svelte.StoresPlus</h1>

<h2>WritableIndexedDB</h2>

<p>Date:</p>
<pre>{$indexedDB.date}</pre>

<p>Name:</p>
<pre>{$indexedDB.name}</pre>

<p>Num:</p>
<pre>{$indexedDB.num}</pre>

<p>Nully:</p>
<pre>{$indexedDB.nully}</pre>

<p>bool:</p>
<pre>{$indexedDB.bool}</pre>

<input type="text" bind:value={$indexedDB.name} />
