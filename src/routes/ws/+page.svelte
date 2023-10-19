<script lang="ts">
	import { WSClient } from "$lib/ws/WSClient.js";
	import WsReceiver from "$lib/ws/WsReceiver.svelte";

	let status = "";

	let ws: WSClient | null = typeof window === "undefined" ? null : new WSClient("ws://localhost:5000/Chat");

	async function send(): Promise<void> {
		await ws?.send(text);
	}

	let prev: string[] = [];
	let text = "test";
	function append(str: string): string {
		prev.push(str);
		console.log(prev);
		return prev.join("\n");
	}
</script>

<pre><code>{status}</code></pre>
<button on:click={send}>Send</button>
<input type="text" bind:value={text} />
<WsReceiver {ws} target="Pong" let:promise>
	{#await promise}
		<p>Waiting for message...</p>
	{:then res}
		<pre><code>{append(res)}</code></pre>
	{:catch e}
		<pre><code>{e.message}</code></pre>
	{/await}
</WsReceiver>
