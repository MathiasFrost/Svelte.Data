<script lang="ts">
	import type { MaybePromise } from "$app/forms";
	import { stringTransformer } from "$lib/types/transformers.js";
	import { SessionStorageSyncer } from "$lib/sync/SessionStorageSyncer.js";

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
	let str = initStr();
	function initStr(): string {
		const res = session.pull();
		if (!res) testPromise().then((s) => (str = s));
		return res;
	}
	$: session.push(str);

	let secondStr: MaybePromise<string>;
	$: secondStr = testPromise(str);
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 0</h2>
<p>MaybePromise dependent on str value synced to sessionStorage</p>

<input type="text" bind:value={str} />

{#await secondStr}
	<p>Laoding...</p>
{:then s}
	<p>{s}</p>
	<input type="text" value={s} on:input={(e) => (secondStr = e.currentTarget.value)} />
{:catch e}
	<p style="color:crimson;">{e}</p>
{/await}

<button on:click={() => (str = session.pull())}> pull </button>
<button on:click={session.clear}> reset </button>
