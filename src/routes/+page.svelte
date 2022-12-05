<script lang="ts">
	import { testClient } from "$sandbox/services/testClient.js";
	import { onMount } from "svelte";

	onMount(async () => {
		if (typeof window === "undefined") {
			return;
		}

		const res = await testClient.getForecasts();
		console.log(res);
	});
</script>

<h1>Svelte.StoresPlus</h1>

<h2>Welcome to your library project</h2>

<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
