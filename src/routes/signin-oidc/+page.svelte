<script lang="ts">
	import { onMount } from "svelte";
	import { oidcManager } from "$sandbox/user/oidcConfig.js";
	import { goto } from "$app/navigation";

	onMount(async () => {
		await oidcManager.signInCallback();
		if (window === window.parent) await goto("/", { replaceState: true });
	});
</script>

<p>Signing in...</p>
