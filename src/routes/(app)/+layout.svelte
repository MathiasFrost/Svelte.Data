<script lang="ts">
	import { AspNetCoreHTTP } from "$sandbox/http/AspNetCoreHTTP.js";
	import { type Audiences, oidcManager, setSignInPromptStore } from "$sandbox/user/oidcConfig.js";
	import { setUserStore } from "$sandbox/user/user.js";
	import { AcquisitionMethod } from "$lib/oidc/OIDCManager.js";
	import type { LayoutData } from "./$types";
	import { writable } from "svelte/store";
	import { browser } from "$app/environment";

	export let data: LayoutData;

	// Create a store and update it when necessary...
	const user = writable<Record<string, unknown>>();
	$: user.set(data.user);

	// ...and add it to the context for child components to access
	setUserStore(user);

	setSignInPromptStore(data.signInPrompt as Audiences | null);

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
	{#if browser}
		{#await AspNetCoreHTTP.getClaims()}
			<div>Loading...</div>
		{:then res}
			<pre>{JSON.stringify(res, null, 2)}</pre>
		{:catch e}
			<div>{e.message}</div>
		{/await}
		{#await getUser(refresh)}
			<div>Loading...</div>
		{:then res}
			<div>{res["name"]}</div>
			<button on:click={() => (refresh = true)}>Force OIDC refresh</button>
		{:catch e}
			<div>{e.message}</div>
		{/await}
	{/if}
</nav>

<main>
	<slot />
</main>
