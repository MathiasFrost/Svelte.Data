<script lang="ts">
	import {local} from "$lib/sandbox/stores/local";
</script>

<h1>Svelte.StoresPlus</h1>

<h2>WritableLocalStorage</h2>

<p>Date:</p>
<pre>{$local.date}</pre>

<p>Name:</p>
<pre>{$local.name}</pre>

<p>Num:</p>
<pre>{$local.num}</pre>

<p>Nully:</p>
<pre>{$local.nully}</pre>

<p>bool:</p>
<pre>{$local.bool}</pre>

<input type="text" bind:value={$local.name} />
