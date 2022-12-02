<script lang="ts">
	import {AsyncData} from "$lib/async/AsyncData";
	import type {WeatherForecast} from "../../sandbox/models/WeatherForecast";
	import {testClient} from "../../sandbox/services/testClient";

	let forecasts: WeatherForecast[] | Error | undefined = void 0;
	const data = new AsyncData<WeatherForecast[]>(() => testClient.getForecasts(), {setValue: (value) => (forecasts = value)});
</script>

<h1>Svelte.StoresPlus</h1>

<h2>local variable with async data</h2>

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
	<button on:click={() => data.refresh()}>refresh</button>
	<button on:click={() => data.refresh(true)}>silent refresh</button>
{/if}
