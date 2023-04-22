<script lang="ts">
	import { DataBuilder } from "$lib/SyncBuilder";

	const promise1 = (str?: string) =>
		new Promise<string>((resolve) => {
			window.setTimeout(() => resolve(str ?? "hah"), 600);
		});

	let str = "asd";
	const {
		pull: pullStr,
		push: pushStr,
		reset: resetStr
	} = new DataBuilder<string>()
		.fromSessionStorage("test") // First get from sessionStorage
		.fromAwaited(promise1) // If nothing in sessionStorage, initiate promise
		.to((val) => (str = val))
		.toSessionStorage()
		.isString()
		.asObject();
	$: pushStr(str);

	let secondStr = Promise.resolve("te");
	const {
		pull: pullStr2,
		push: pushStr2,
		unshiftFrom
	} = new DataBuilder<Promise<string>>()
		.to((val) => (secondStr = val))
		.toSessionStorage("test2")
		.isString()
		.asObject();
	$: if (str === "haha") {
		unshiftFrom(() => promise1(str)).pull();
	}

	// let promise = Promise.resolve("asd");
	// const {
	// 	pull: pullPromise,
	// 	push: pushPromise,
	// 	reset: resetPromise
	// } = new DataBuilder<Promise<string>>()
	// 	.fromSessionStorage() // First get from sessionStorage
	// 	.from(promise1) // If nothing in sessionStorage, set to promise
	// 	.to((p) => (promise = p))
	// 	.asObject();
	// $: pushPromise(promise);

	// let maybePromise: Promise<string> | string = "asd";
	// const {
	// 	pull: pullMaybePromise,
	// 	push: pushMaybePromise,
	// 	reset: resetMaybePromise
	// } = new DataBuilder<Promise<string> | string>()
	// 	.fromSessionStorage() // First get from sessionStorage
	// 	.from(promise1) // If nothing in sessionStorage, set to promise
	// 	.to((p) => (maybePromise = p))
	// 	.asObject();
	// $: pushMaybePromise(maybePromise);
</script>

<h1>Svelte.Data</h1>

<h2>ValueBuilder with cookie sync</h2>

<input type="text" bind:value={str} />

{#await secondStr}
	<p>Laoding...</p>
{:then s}
	<p>{s}</p>
{/await}

<button on:click={pullStr}> pull </button>
<button on:click={resetStr}> reset </button>
