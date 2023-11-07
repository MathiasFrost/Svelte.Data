<script lang="ts">
	import { getUserStore } from "$sandbox/user/user.js";

	const user = getUserStore();
</script>

{#if $user["name"]}
	<slot />
{:else}
	<slot name="unauthorized" />
{/if}
