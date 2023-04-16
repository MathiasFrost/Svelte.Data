<script lang="ts">
	import { page } from "$app/stores";
	import { TestClient } from "$sandbox/http/TestClient";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
	import { onMount } from "svelte";

	let promise: Promise<WeatherForecast[]>;

	onMount(async () => {
		if (typeof window !== "undefined") {
			promise = TestClient.getForecasts();
			console.log(await TestClient.getTest());
		}
	});
</script>

<h1>Svelte.StoresPlus</h1>

<h2>Welcome to your library project</h2>

<table>
	<thead>
		<tr>
			<th>Date</th>
			<th>C</th>
			<th>Summary</th>
		</tr>
	</thead>
	<tbody>
		{#if promise}
			{#await promise}
				<tr>
					<td colspan="3">Loading...</td>
				</tr>
			{:then forecasts}
				{#each forecasts as forecast}
					<tr>
						<td>{forecast.date.toISOString()}</td>
						<td>{forecast.temperatureC}</td>
						<td><input type="text" bind:value={forecast.summary} /></td>
					</tr>
				{/each}
			{:catch e}
				<tr>
					<td style="color: crimson;" colspan="3">{e.message}</td>
				</tr>
			{/await}
		{/if}
	</tbody>
</table>

<table>
	<thead>
		<tr>
			<th>Date</th>
			<th>C</th>
			<th>Summary</th>
		</tr>
	</thead>
	<tbody>
		{#each $page.data.item as forecast}
			<tr>
				<td>{forecast.date.toISOString()}</td>
				<td>{forecast.temperatureC}</td>
				<td><input type="text" bind:value={forecast.summary} /></td>
			</tr>
		{/each}
	</tbody>
</table>

<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
