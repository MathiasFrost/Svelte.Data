<script lang="ts">
	import { onMount } from "svelte";
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";
	import { user } from "$sandbox/user/user.js";

	onMount(async () => {
		const res = await TestHTTP.getUser();
		user.set(res);
	});
</script>

<main>
	<slot />
</main>
