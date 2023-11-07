<script lang="ts">
	import { AspNetCoreHTTP } from "$sandbox/http/AspNetCoreHTTP.js";
	import { oidcManager } from "$sandbox/user/oidcConfig.js";
	import { setUserStore } from "$sandbox/user/user.js";
	import { AcquisitionMethod } from "$lib/oidc/OIDCManager.js";
	import type { LayoutData } from "./$types";
	import { writable } from "svelte/store";

	export let data: LayoutData;

	// Create a store and update it when necessary...
	const user = writable<Record<string, unknown>>();
	$: user.set(data.user);

	// ...and add it to the context for child components to access
	setUserStore(user);

	let refresh = false;

	async function getUser(refresh: boolean): Promise<Record<string, unknown>> {
		if (refresh) user.set({});
		await oidcManager.ensureValidAccessToken("MS.Graph", refresh ? AcquisitionMethod.RefreshToken : AcquisitionMethod.Storage);
		const o = await oidcManager.getIdTokenObject("MS.Graph");
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
