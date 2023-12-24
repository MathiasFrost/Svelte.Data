<script lang="ts">
	import { onMount } from "svelte";

	/** TODOC */
	export let open = false;

	/** TODOC */
	export let duration = 300;

	/** TODOC */
	let details: HTMLDetailsElement | undefined;

	/** TODOC */
	let timeout = 0;

	// ctor
	onMount(() => {
		details?.addEventListener("click", onClick);
	});

	/** TODOC */
	function onClick(e: Event): void {
		window.clearTimeout(timeout);
		if (open) {
			e.preventDefault();
			close();
		} else {
			open = true;
		}
	}

	async function close(): Promise<void> {
		timeout = window.setTimeout(() => {
			if (!details) return;
			details.open = false;
			open = false;
		}, duration);
	}

	/** Function to close details after a custom event */
	function closeClick(onClick?: () => void): () => void {
		return () => {
			onClick?.();
			close();
		};
	}
</script>

<details bind:this={details}>
	<slot {open} {closeClick} />
</details>
