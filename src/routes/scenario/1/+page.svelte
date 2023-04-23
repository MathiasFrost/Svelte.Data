<script lang="ts">
	import type { MaybePromise } from "$app/forms";
	import AsyncDataComponent from "$lib/async/AsyncDataComponent.svelte";

	const testPromise = (str?: string) =>
		new Promise<string>((resolve, reject) => {
			if (typeof window === "undefined") resolve("");
			else
				window.setTimeout(() => {
					if (str === "reject") reject(new Error("test"));
					else resolve(str ?? "test");
				}, 1_000);
		});

	let str: MaybePromise<string> = testPromise();

	let secondStr: MaybePromise<string> = Promise.resolve("");
	$: Promise.resolve(str).then((res) => (secondStr = testPromise(res)));

	let ms = 0;
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 1</h2>
<p>MaybePromise dependent on MaybePromise that automatically re-invokes</p>

<input type="range" min="0" max="20000" step="1000" bind:value={ms} />
{ms}

{#await str}
	<p>Laoding...</p>
{:then s}
	<p>{s}</p>
	<input type="text" value={s} on:input={(e) => (str = e.currentTarget.value)} />
{:catch e}
	<p style="color:crimson;">{e}</p>
{/await}

{#await secondStr}
	<p>Laoding...</p>
{:then s}
	<p>{s}</p>
	<input type="text" value={s} on:input={(e) => (secondStr = e.currentTarget.value)} />
{:catch e}
	<p style="color:crimson;">{e}</p>
{/await}

<AsyncDataComponent milliseconds={ms} promiseFactory={() => testPromise()} on:invoked={(e) => (str = e.detail)} />
