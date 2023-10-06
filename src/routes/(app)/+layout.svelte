<script lang="ts">
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";
	import { user } from "$sandbox/user/user.js";
	import { AspNetCoreHTTP } from "$sandbox/http/AspNetCoreHTTP.js";

	async function getUser() {
		const res = await TestHTTP.getUser();
		user.set(res);
		return res;
	}
</script>

<nav>
	{#await getUser()}
		<div>Loading...</div>
	{:then user}
		<div>{user.name}</div>
	{:catch e}
		<div>{e.message}</div>
	{/await}
	{#await AspNetCoreHTTP.getClaims()}
		<div>Loading...</div>
	{:then res}
		<pre>{JSON.stringify(res, null, 2)}</pre>
	{:catch e}
		<div>{e.message}</div>
	{/await}
</nav>

<main>
	<slot />
</main>
