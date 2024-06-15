<script lang="ts">
	import { stringSerializer } from "$lib/utils/Serializer.js";
	import { SessionStorageSyncer } from "$lib/sync/SessionStorageSyncer.js";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";

	/** TODOC */
	const session = new SessionStorageSyncer(
		"test",
		"",
		stringSerializer((string) => {
			if (string.startsWith('"')) throw new Error("Invalid");
			return string;
		})
	);

	const testPromise = (str?: string) =>
		new Promise<string>((resolve, reject) => {
			if (typeof window === "undefined") resolve("");
			else
				window.setTimeout(() => {
					if (str === "reject") reject(new Error("test"));
					else resolve(str ?? "test");
				}, 1_000);
		});

	/** TODOC */
	let str = session.pull();
	onMount(() => {
		if (!str) testPromise().then((res) => (str = res));
	});
	$: session.push(str);

	/** TODOC */
	let secondStr = "";
	let secondStrPromise = Promise.resolve("");
	$: updateSecondStr(str);

	function updateSecondStr(str: string): void {
		if (!browser) return;
		secondStrPromise = testPromise(str);
		secondStrPromise.then((res) => (secondStr = res));
	}
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 0</h2>
<p>MaybePromise dependent on str value synced to sessionStorage</p>

<input type="text" bind:value={str} />

{#await secondStrPromise}
	<p>Loading...</p>
{:then res}
	<p>{res}</p>
	<input type="text" bind:value={secondStr} />
{:catch e}
	<p style="color:crimson;">{e}</p>
{/await}

<button on:click={() => (str = session.pull())}> pull</button>
<button on:click={() => session.clear()}> reset</button>
