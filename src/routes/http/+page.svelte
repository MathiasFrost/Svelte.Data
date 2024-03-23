<script lang="ts">
	import { testHttp, testUserStore } from "$sandbox/http/TestHTTP.js";
	import { onDestroy, onMount } from "svelte";

	onMount(() => {
		testUserStore.startWithGetter((signal) => testHttp.getUser(6, signal));
	});

	onDestroy(() => {
		testUserStore.stop();
	});

	async function submit(this: HTMLFormElement): Promise<void> {
		console.log(new FormData(this));
	}
</script>

<h1>REST HTTP</h1>

{#await $testUserStore.promise}
	<p>Loading...</p>
{:then user}
	<form on:submit|preventDefault={submit}>
		<label
			>Name
			<input type="text" name="name" required value={user.name} />
		</label>
		<label
			>Age
			<input type="number" name="age" required value={user.age} />
		</label>
	</form>
{:catch e}
	<p>{e.message}</p>
{/await}
