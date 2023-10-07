<script lang="ts">
	import { user } from "$sandbox/user/user.js";
</script>

{#if $user["name"]}
	<slot />
{:else}
	<slot name="unauthorized" />
{/if}
