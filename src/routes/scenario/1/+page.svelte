<script lang="ts">
	import AsyncDataComponent from "$lib/async/AsyncDataComponent.svelte";
	import { onMount } from "svelte";

	const testPromise = (str?: string) =>
		new Promise<string>((resolve, reject) => {
			if (typeof window === "undefined") resolve("");
			else
				window.setTimeout(() => {
					if (str === "reject") reject(new Error("test"));
					else resolve(str ?? "test");
				}, 1_000);
		});

	let str = "";
	let strPromise = Promise.resolve(str);

	let secondStr = "";
	let secondStrPromise = Promise.resolve(secondStr);

	function initStr(): Promise<string> {
		const promise = testPromise();
		promise.then((res) => {
			str = res;
			secondStrPromise = testPromise(str);
			secondStrPromise.then((res) => (secondStr = res));
		});
		return promise;
	}

	let ms = 0;

	onMount(() => {
		strPromise = initStr();
	});
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 1</h2>
<p>MaybePromise dependent on MaybePromise that automatically re-invokes</p>

<input type="range" min="0" max="20000" step="1000" bind:value={ms} />
{ms}

{#await strPromise}
	<p>Loading...</p>
{:then}
	<p>{str}</p>
	<input type="text" bind:value={str} />
{:catch e}
	<p style="color:crimson;">{e}</p>
{/await}

{#await secondStrPromise}
	<p>Loading...</p>
{:then}
	<p>{secondStr}</p>
	<input type="text" bind:value={secondStr} />
{:catch e}
	<p style="color:crimson;">{e}</p>
{/await}

<AsyncDataComponent milliseconds={ms} promiseFactory={() => initStr()} on:invoked={(e) => (strPromise = e.detail)} />
