<script lang="ts">
	import { ChatWs } from "$sandbox/ws/ChatWs.js";

	const hub = new ChatWs();
</script>

{#await hub.connecting}
	<p>Connecting to hub...</p>
{:then e}
	{#each $hub.chatMessages() as message}
		<p>{message.name}: {message.text}</p>
	{/each}

	{#each $hub.chatMessages() as message}
		{#if message.received}
			<p>{message.name}: {message.text}</p>
		{:else}
			Yuo: {message.text}
		{/if}
	{/each}

	<form on:submit|preventDefault={(e) => hub.postMessage(e.currentTarget.text.value)}>
		<input name="text" />
	</form>

	<small>{e.target}</small>
{/await}
