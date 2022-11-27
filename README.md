# Svelte.StoresPlus - _Svelte_

Convenient Svelte store abstractions

# Stores

## AsyncWritable

```ts
import {writableAsync} from "$lib/store/async/WritableAsync";
import {WeatherForecast} from "./WeatherForecast";

async function getForecasts() {
	const res = await fetch("http://localhost:5000/WeatherForecast");

	// Throw error if any checks fail
	// WritableAsync will be updated to contain the error
	if (!res.ok) {
		throw new Error("Not success");
	}
	const json = await res.json();
	if (!Array.isArray(json)) {
		throw new Error("Not array");
	}
	return json.map((el) => new WeatherForecast(el));
}

export const forecasts = writableAsync<WeatherForecast[]>(getForecasts);
```

```svelte
<script lang="ts">
	import {forecasts} from "$lib/sandbox/stores";
</script>

<!-- undefined means loading -->
{#if typeof $forecasts === "undefined"}
	<p>Loading...</p>
{:else if $forecasts instanceof Error}
	<p style="color: crimson">{$forecasts.message}</p>
	<p>{$forecasts.stack}</p>

	<!-- If it is not undefined and not an error, it is the async data -->
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
			{#each $forecasts as forecast}
				<tr>
					<td>{forecast.date}</td>
					<td>{forecast.temperatureC}</td>
					<td>{forecast.temperatureF}</td>
					<td>{forecast.summary}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
```
