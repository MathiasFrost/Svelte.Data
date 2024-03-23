<script lang="ts">
	import { testHttp, testUserStore } from "$sandbox/http/TestHTTP.js";
	import { onDestroy } from "svelte";
	import { browser } from "$app/environment";
	import { page } from "$app/stores";
	import { User } from "$sandbox/models/User.js";

	let id = 0;
	$: id = Number($page.params.id) || 0;

	$: if (browser && id > 0) {
		testUserStore.startWithGetter((signal) => testHttp.getUser(id, signal)).then(console.log);
	} else if (id === 0) {
		testUserStore.startWithGetter(() => new User());
	}

	onDestroy(() => {
		testUserStore.stop();
	});

	async function submit(this: HTMLFormElement): Promise<void> {
		const newId = await testUserStore.mutate("update", id, new FormData(this));
		console.log(newId);
	}
</script>

<h1>REST HTTP</h1>

{#await $testUserStore.promise}
	<p>Loading...</p>
{:then user}
	{#if user.id}
		<p>Editing user #{user.id}</p>
	{:else}
		<p>Creating new user</p>
	{/if}
	<form on:submit|preventDefault={submit}>
		<label
			>Name
			<input type="text" name="name" required value={user.name} />
		</label>
		<label
			>Age
			<input type="number" name="age" required value={user.age} />
		</label>
		<button type="submit">Submit</button>
	</form>
{:catch e}
	<p>{e.message}</p>
{/await}
