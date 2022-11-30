<script lang="ts">
	import {session} from "../../sandbox/stores/session";
</script>

<h1>Svelte.StoresPlus</h1>

<h2>WritableSessionStorage</h2>

<p>Date:</p>
<pre>{$session.date}</pre>

<p>Name:</p>
<pre>{$session.name}</pre>

<p>Num:</p>
<pre>{$session.num}</pre>

<p>Nully:</p>
<pre>{$session.nully}</pre>

<p>bool:</p>
<pre>{$session.bool}</pre>

<input type="text" bind:value={$session.name} />
