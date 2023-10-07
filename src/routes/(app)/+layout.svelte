<script lang="ts">
	import { AspNetCoreHTTP } from "$sandbox/http/AspNetCoreHTTP.js";
	import { oidcManager } from "$sandbox/user/oidcConfig.js";
	import { user } from "$sandbox/user/user.js";

	let refresh = false;
	async function getUser(refresh: boolean): Promise<Record<string, unknown>> {
		console.log(refresh);
		if (refresh) user.set({});
		const res = await oidcManager.getOidcMessage("MS.Graph", refresh);
		const o = res.idTokenObject;
		user.set(o);
		refresh = false;
		return o;
	}
</script>

<nav>
	{#await AspNetCoreHTTP.getClaims()}
		<div>Loading...</div>
	{:then res}
		<pre>{JSON.stringify(res, null, 2)}</pre>
	{:catch e}
		<div>{e.message}</div>
	{/await}
	{#await getUser(refresh) then res}
		<div>{res["name"]}</div>
		<button on:click={() => (refresh = true)}>Force OIDC refresh</button>
	{:catch e}
		<div>{e.message}</div>
	{/await}
</nav>

<main>
	<slot />
</main>
