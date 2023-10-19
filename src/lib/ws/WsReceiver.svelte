<script lang="ts">
	import type { WSClient } from "$lib/ws/WSClient";
	import { onDestroy } from "svelte";
	import { indefinitePromise } from "$lib/async";

	/** TODOC */
	export let ws: WSClient | null;

	let unsub: (() => void) | null = null;
	let promise: Promise<string> = indefinitePromise<string>();

	$: if (ws) {
		const p = ws.receive(target, (str) => str);
		p.then((res) => {
			unsub = res.subscribe((val) => {
				if (typeof val === "undefined") return;
				promise = Promise.resolve(val);
			});
		});
	}

	/** TODOC */
	export let target: string;

	onDestroy(() => unsub?.());
</script>

<slot {promise} />
