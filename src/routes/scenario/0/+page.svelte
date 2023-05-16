<script lang="ts">
	import { stringTransformer } from "$lib/types/transformers.js";
	import { SessionStorageSyncer } from "$lib/sync/SessionStorageSyncer.js";
	import { Awaitable } from "$lib/async/Awaitable.js";

	/** */
	const session = new SessionStorageSyncer("test", "", stringTransformer());

	const testPromise = (str?: string) =>
		new Promise<string>((resolve, reject) => {
			if (typeof window === "undefined") resolve("");
			else
				window.setTimeout(() => {
					if (str === "reject") reject(new Error("test"));
					else resolve(str ?? "test");
				}, 1_000);
		});

	/** */
	const str = new Awaitable<string>(testPromise(), session.pull());
	$: session.push(str.value);

	/** */
	const secondStr = new Awaitable<string>(testPromise(str.value), "");
	$: update(str.value);
	function update(val: string) {
		console.log(val);
		secondStr.promise = testPromise(val);
	}
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 0</h2>
<p>MaybePromise dependent on str value synced to sessionStorage</p>

<input type="text" bind:value={str.value} />

{#await str.promise then res}
	{res}
{/await}

{#await secondStr.promise}
	<p>Loading...</p>
{:then res}
	<p>{res}</p>
	<input type="text" bind:value={secondStr.value} />
{:catch e}
	<p style="color:crimson;">{e}</p>
{/await}

<button on:click={() => (str.value = session.pull())}> pull </button>
<button on:click={() => session.clear()}> reset </button>
