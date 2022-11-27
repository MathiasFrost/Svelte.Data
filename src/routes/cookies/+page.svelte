<script lang="ts">
	import {cookies} from "$lib/sandbox/stores/cookies";
</script>

<h1>Svelte.StoresPlus</h1>

<h2>WritableCookies</h2>

<p>Date:</p>
<pre>{$cookies.date}</pre>

<p>Name:</p>
<pre>{$cookies.name}</pre>

<p>Num:</p>
<pre>{$cookies.num}</pre>

<p>Nully:</p>
<pre>{$cookies.nully}</pre>

<p>bool:</p>
<pre>{$cookies.bool}</pre>

<input type="text" bind:value={$cookies.name} />
