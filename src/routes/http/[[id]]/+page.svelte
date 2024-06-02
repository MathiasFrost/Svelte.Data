<script lang="ts">
	import { testHttp } from "$sandbox/http/TestRestAPI.js";
	import { onDestroy } from "svelte";
	import { browser } from "$app/environment";
	import { page } from "$app/stores";
	import { User } from "$sandbox/models/User.js";
	import { goto } from "$app/navigation";
	import { type SvelteSaga, SvelteSagaBuilder } from "$lib/http/SvelteSagaBuilder";

	const saga: SvelteSaga<User> = new SvelteSagaBuilder<User>()
		// .withRefreshInterval(2_000)
		// .withRefreshCooldown(3_000)
		.toSaga();

	const saga2 = new SvelteSagaBuilder<string>().toSaga();

	let id = 0;
	$: id = Number($page.params.id) || 0;

	$: if (browser && id > 0) {
		saga.setGetter((signal) => testHttp.getUser(id, signal)) // Sets getter that will be used next invocation
			.start(); // Start or re-start fetching (and possibly start interval refresh)
	} else if (id === 0) {
		console.log("ID 0");
		saga.setValue(new User()) // Sets the getter that will be used next invocation, in this case a resolved empty user for form scenarios
			.stop(); // Stop possible intervals or re-start fetching (and possibly start interval refresh)
	}

	$: if ($saga.value?.id)
		saga2
			.setGetter(async () => {
				if (typeof window !== "undefined") await new Promise((resolve) => window.setTimeout(resolve, 2_000));
				return id.toString();
			})
			.start();

	onDestroy(() => {
		saga.stop(); // Stop the in process getter promise and/or the interval refresh
	});

	async function submit(this: HTMLFormElement): Promise<void> {
		saga.clearMessages();
		const form = new FormData(this);
		const rollback = saga.setOptimistic(User, form); // Update the values in the saga with form data optimistically, returning a rollback that can be used if the actual update fails
		try {
			const newId = await testHttp.post("test").withBody(form).fromNumber(saga.signal);
			console.log(newId);
			if (newId !== id) await goto(`/http/${newId}`);
		} catch (e) {
			rollback();
			saga.setMessage("update", "error", "Could not update user");
			console.log("Rolled back", e);
		}
	}
</script>

<h1>REST HTTP</h1>
{$saga.value?.id ?? "pending"}
{#await $saga.maybePromise}
	<p>Loading...</p>
{:then user}
	{#if user.id}
		<p>Editing user #{user.id}</p>
	{:else}
		<p>Creating new user</p>
	{/if}
	<form on:submit|preventDefault={submit}>
		<label
			>test
			<input type="number" required value={user.id} /></label>
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
	{#if $saga.messages["update"]}
		<p>{$saga.messages["update"].message}</p>
	{/if}
	<button type="button" on:click={() => saga.refresh()}> Refresh </button>
{:catch e}
	<p>{e.message}</p>
	<button on:click={() => saga.start()} type="button"> Try to recover? </button>
{/await}

{#await $saga2.maybePromise}
	<p>Loading 2</p>
{:then str}
	<p>{str}</p>
{:catch e}
	<p>Error {e}</p>
{/await}
