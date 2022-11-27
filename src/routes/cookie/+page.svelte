<script lang="ts">
	import {cookie} from "$lib/sandbox/stores/cookie";
</script>

<h1>Svelte.StoresPlus</h1>

<h2>WritableCookie</h2>

<p>Date:</p>
<pre>{$cookie.date}</pre>

<p>Name:</p>
<pre>{$cookie.name}</pre>

<p>Num:</p>
<pre>{$cookie.num}</pre>

<p>Nully:</p>
<pre>{$cookie.nully}</pre>

<p>bool:</p>
<pre>{$cookie.bool}</pre>

<input type="text" bind:value={$cookie.name} />
