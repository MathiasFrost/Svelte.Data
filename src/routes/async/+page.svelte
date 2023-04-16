<script lang="ts">
	import { AsyncData } from "$lib";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
	import { TestClient } from "$sandbox/http/TestClient";

	let forecasts: WeatherForecast[] | Error | undefined = void 0;
	const data = new AsyncData<WeatherForecast[]>(() => TestClient.getForecasts(), {
		browserOnly: true,
		setValue: (value) => (forecasts = value),
		cooldown: 600,
		interval: 2_000
	});
</script>

<h1>Svelte.StoresPlus</h1>

<h2>Variable from <code>Promise</code></h2>

{#if typeof forecasts === "undefined"}
	<p>Loading...</p>
{:else if forecasts instanceof Error}
	<p style="color: crimson">{forecasts.message}</p>
	<p>{forecasts.stack}</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>Date</th>
				<th>TemperatureC</th>
				<th>TemperatureF</th>
				<th>Summary</th>
			</tr>
		</thead>
		<tbody>
			{#each forecasts as forecast}
				<tr>
					<td>{forecast.date}</td>
					<td>{forecast.temperatureC}</td>
					<td>{forecast.temperatureF}</td>
					<td>{forecast.summary}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<input type="text" bind:value={forecasts[0].summary} />
	<button on:click={() => data.invoke()}>refresh</button>
	<button on:click={() => data.invoke(true)}>silent refresh</button>
{/if}
