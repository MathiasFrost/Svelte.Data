<script lang="ts">
	import type { WSClient } from "$lib/ws/WSClient";
	import { onDestroy } from "svelte";
	import { indefinitePromise } from "$lib/async";
	import type { WSMessage } from "$lib/ws/WSMessage";

	/** TODOC */
	export let ws: WSClient | null;

	/** TODOC */
	export let target: string;

	/** TODOC */
	let unsub: (() => void) | null = null;

	/** TODOC */
	let maybePromise: Promise<WSMessage> | WSMessage = indefinitePromise<WSMessage>();

	// TODOC
	$: receive(ws, target);

	/** TODOC */
	async function receive(ws: WSClient | null, target: string): Promise<void> {
		unsub?.();
		if (!ws) return;

		const res = await ws.receive(target);
		unsub = res.subscribe((val) => {
			if (val === null) return;
			maybePromise = val;
		});
	}

	// Cleanup
	onDestroy(() => unsub?.());
</script>

<slot {maybePromise} />
