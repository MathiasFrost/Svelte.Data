<script lang="ts">
	import { page } from "$app/stores";
	import { TestClient } from "$sandbox/http/TestClient";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
	import { onMount } from "svelte";
	import type { PageData } from "./$types";
	import { browser } from "$app/environment";
	import { AsyncData } from "$lib";
	import { AsyncBuilder, type AsyncObject } from "$lib/async/AsyncData";

	function testPromise(forecast: string): Promise<string> {
		return new Promise<string>((resolve) => {
			if (!browser) {
				resolve("");
			} else {
				window.setTimeout(() => resolve(forecast.toUpperCase()), 600);
			}
		});
	}

	/** */
	//export let data: PageData;

	const forecasts: AsyncObject<WeatherForecast[]> = new AsyncBuilder<WeatherForecast[]>()
		.fromPromise(() => TestClient.getForecasts())
		.withInitialValue([])
		.withSetter((value) => (forecasts.value = value))
		.asObject();

	const second: AsyncObject<string> = new AsyncBuilder<string>()
		.withInitialValue("")
		.withSetter((value) => (second.value = value))
		.asObject();
	$: forecasts.value.then((forecasts) => second.setPromise(() => testPromise(forecasts[0]?.summary ?? "")));

	let historyIndex = 0;
	let history: string[];
	function undo(): void {}

	async function sync(value: Promise<WeatherForecast[]>): Promise<void> {
		console.log("test");
	}

	$: sync(forecasts.value);

	onMount(async () => {
		if (browser) {
			forecasts.refresh(false);
		}
	});
</script>

<h1>Svelte.StoresPlus</h1>

<h2>Welcome to your library project</h2>

<button on:click={() => forecasts.refresh(false)}> Refresh </button>
<button on:click={() => forecasts.refresh(true)}> Silent Refresh </button>

<table>
	<thead>
		<tr>
			<th>Date</th>
			<th>C</th>
			<th>Summary</th>
			<th>Promise</th>
		</tr>
	</thead>
	<tbody>
		{#await forecasts.value}
			<tr>
				<td colspan="4">Loading...</td>
			</tr>
		{:then forecasts}
			{#each forecasts as forecast}
				<tr>
					<td>{forecast.date.toISOString()}</td>
					<td>{forecast.temperatureC}</td>
					<td><input type="text" bind:value={forecast.summary} /></td>
					<td>
						{#await second.value}
							Loading...
						{:then text}
							{text}
						{/await}
					</td>
				</tr>
			{/each}
		{/await}
	</tbody>
</table>

<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
