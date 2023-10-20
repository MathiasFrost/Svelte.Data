<script lang="ts">
	import { WSClient } from "$lib/ws/WSClient.js";
	import WsReceiver from "$lib/ws/WsReceiver.svelte";
	import { ensureString } from "$lib/types/unknown.js";

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
<WsReceiver {ws} target="Pong" let:maybePromise>
	{#await maybePromise}
		<p>Waiting for message...</p>
	{:then res}
		{@const str = res.deserialize(ensureString)}
		<pre><code>{append(str)}</code></pre>
	{:catch e}
		<pre><code>{e.message}</code></pre>
	{/await}
</WsReceiver>
