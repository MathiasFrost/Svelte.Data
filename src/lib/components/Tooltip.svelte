<script lang="ts">
	import Popup from "$lib/popup/Popup.svelte";
	import { fly } from "svelte/transition";
</script>

<Popup type="hover" let:open delay={300} let:delay>
	<svelte:fragment slot="summary">
		<slot name="summary" />
	</svelte:fragment>
	{#if open}
		<div transition:fly={{ duration: delay }}>
			<slot />
		</div>
	{/if}
</Popup>
