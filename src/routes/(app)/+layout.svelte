<script lang="ts">
	import { AspNetCoreHTTP } from "$sandbox/http/AspNetCoreHTTP.js";
	import { setUserStore } from "$sandbox/user/user.js";
	import { writable } from "svelte/store";
	import { browser } from "$app/environment";

	// Create a store and update it when necessary...
	const user = writable<Record<string, unknown>>();

	// ...and add it to the context for child components to access
	setUserStore(user);

	let refresh = false;

	async function getUser(refresh: boolean): Promise<Record<string, unknown>> {
		if (refresh) user.set({});
		refresh = false;
		return {};
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
