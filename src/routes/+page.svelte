<script lang="ts">
	import { AsyncValue } from "$lib/async/AsyncValue.js";
	import type { ValuePromise } from "$lib/async/ValuePromise.js";
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast.js";
	import { onMount } from "svelte";

	/** */
	let forecasts = new AsyncValue<WeatherForecast[]>();
	$: console.log(forecasts);

	/** */
	let forecastsPromise: ValuePromise<WeatherForecast[]> = { value: [], promise: TestHTTP.getForecasts() };
	$: console.log(forecastsPromise);

	onMount(async () => {
		// forecasts.value = await TestHTTP.getForecasts();
		window.setTimeout(() => forecasts.resolve([]), 1000);

		// for (let i = 1; i < 6; i++) {
		// 	window.setTimeout(() => {
		// 		forecastsPromise.promise = TestHTTP.getForecasts();
		// 		forecasts.promise = TestHTTP.getForecasts();
		// 	}, 500 * i);
		// }
	});
</script>

<h1>Svelte.Data</h1>

<h2>Welcome to your library project</h2>

<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

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
		{#await forecasts.promise}
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
				<td colspan="4" style="color:crimson">{e.message}</td>
			</tr>
		{/await}
	</tbody>
</table>

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
		{#await forecastsPromise.promise}
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
				<td colspan="4" style="color:crimson">{e.message}</td>
			</tr>
		{/await}
	</tbody>
</table>
