<script lang="ts">
	import { testHttp } from "$sandbox/http/TestRestAPI.js";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
	import { onMount } from "svelte";

	/** TODOC */
	let forecasts: Promise<WeatherForecast[]> = Promise.resolve([]);

	onMount(async () => {
		forecasts = testHttp.getForecasts();
	});

	let url: string | null = null;

	async function getProfile(): Promise<void> {
		url = await testHttp.getPhoto();
	}
</script>

<h1>Svelte.Data</h1>

<h2>Welcome to your library project</h2>

<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<button on:click={() => getProfile()}> Get profile pic </button>

{#if url}
	<img src={url} alt="xd" />
{/if}

<table>
	<thead>
		<tr>
			<th>Summary</th>
			<th>Date</th>
			<th>TemperatureC</th>
			<th>TemperatureF</th>
		</tr>
	</thead>
	<tbody>
		{#await forecasts}
			<tr>
				<td colspan="4">Loading...</td>
			</tr>
		{:then res}
			{#each res as forecast}
				<tr>
					<td><input type="text" bind:value={forecast.summary} /></td>
					<td>{forecast.date}</td>
					<td>{forecast.temperatureC}</td>
					<td>{forecast.temperatureF}</td>
				</tr>
			{/each}
		{:catch e}
			<tr>
				<td colspan="4" style="color:crimson"
					>{e.message}
					<pre>{e.stack}</pre></td>
			</tr>
		{/await}
	</tbody>
</table>
