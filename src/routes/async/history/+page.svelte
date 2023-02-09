<script lang="ts">
	import { AsyncData } from "$lib";
	import { HistoryManager } from "$lib";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
	import { testClient } from "$sandbox/services/testClient";

	let forecasts: WeatherForecast[] | Error | undefined = void 0;
	const data = new AsyncData<WeatherForecast[]>(() => testClient.getForecasts(), { setValue: (value) => (forecasts = value) });

	let index = -1;
	let history: WeatherForecast[][] = [];

	const manager = new HistoryManager<WeatherForecast[]>({
		cap: 10,
		setValue: (value) => (forecasts = value),
		setIndex: (i) => (index = i),
		setHistory: (value) => (history = value),
		ensureT(value): value is WeatherForecast[] {
			return !(value instanceof Error) && typeof value !== "undefined";
		}
	});

	$: manager.addEntry(forecasts) || forecasts;
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
	<button on:click={() => manager.undo()}>undo</button>
	<button on:click={() => manager.redo()}>redo</button>
	<button on:click={() => data.invoke()}>refresh</button>
	<button on:click={() => data.invoke(true)}>silent refresh</button>
	<p>Index: {index}</p>
	<ul>
		{#each history as item, i}
			<li style={i === index ? "color: crimson;" : ""}>{item[0].summary}</li>
		{/each}
	</ul>
{/if}
