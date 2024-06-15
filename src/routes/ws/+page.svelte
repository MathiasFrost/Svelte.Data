<script lang="ts">
	import { WSClient } from "$lib/ws/WSClient.js";
	import WSReceiver from "$lib/ws/WSReceiver.svelte";
	import { ensureString } from "$lib/utils/unknown.js";

	let status = "";

	let ws: WSClient = new WSClient("ws://localhost:5000/Chat");

	async function send(): Promise<void> {
		await ws.send("Ping", text);
	}

	let prev: string[] = [];
	let text = "test";
	function append(res: string): string {
		prev.push(res);
		console.log(prev);
		return prev.join("\n");
	}
</script>

<pre><code>{status}</code></pre>
<button on:click={send}>Send</button>
<input type="text" bind:value={text} />
<WSReceiver {ws} target="Pong" let:maybePromise>
	{#await maybePromise}
		<p>Waiting for message...</p>
	{:then res}
		{@const str = res.deserialize(ensureString)}
		<pre><code>{append(str)}</code></pre>
	{:catch e}
		<pre><code>{e.message}</code></pre>
	{/await}
</WSReceiver>
