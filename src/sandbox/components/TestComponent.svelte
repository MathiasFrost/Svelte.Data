<script lang="ts">
	import { testHttp } from "$sandbox/http/TestHTTP.js";

	let promise = testHttp.getTest();
</script>

{#await promise}
	<p>Loading</p>
{:then res}
	<p>{res}</p>
	<button on:click={() => (promise = testHttp.getTest())}>Reinvoke</button>
{:catch e}
	<p style="color: crimson">{e.message}</p>
{/await}
