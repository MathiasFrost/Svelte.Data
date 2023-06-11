<script lang="ts">
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";

	let promise = TestHTTP.getTest();
</script>

{#await promise}
	<p>Loading</p>
{:then res}
	<p>{res}</p>
	<button on:click={() => (promise = TestHTTP.getTest())}>Reinvoke</button>
{:catch e}
	<p style="color: crimson">{e.message}</p>
{/await}
