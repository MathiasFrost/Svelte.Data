# Svelte.StoresPlus - _SvelteKit_

Utilities aiming to make it quick and easy to create Svelte stores with advanced functionality sich as history management; async data and storage.

# Examples

**Note:** throughout the examples we will use lambda functions instead of `Function.prototype.bind`. [Read more](https://stackoverflow.com/questions/42117911/lambda-functions-vs-bind-memory-and-performance).

## Bread and Butter Writable from Promise with History Management

### Use Case

1. You need to fetch data from a server
2. Multiple Svelte components needs access to this data
3. User must be able to edit the data
4. User should be able to undo, redo and reset their changes

### Code

```svelte
<script lang="ts">
	// Not that
</script>
```

## Sync a variable to `localStorage`

### Use Case

1. You need a persistant variable but don't want to store it in a database

### Code

```svelte
<script lang="ts">
	// String storage provides the simplest serialization/deserialization of strings
	import {LocalStorageSyncer, stringStorage} from "@maal/svelte-stores-plus";

	const syncer = new LocalStorageSyncer<string>("example", stringStorage("display this when server-rendering"));

	let val = syncer.get("Initial value");
	$: syncer.sync(val) || val;
</script>

<p>Value: {val}</p>
<input type="text" bind:value={val} />
```

## Editable variable from `Promise`

### Use Case
1. You need to fetch data from a server
2. User must be able to edit the data _(Svelte's #await blocks are immutable)_

### Code

```svelte
<script lang="ts">
	import {AsyncData} from "@maal/svelte-stores-plus/AsyncData";
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
```

`getForecasts` is just a wrapper around a simple `fetch`

```ts
export class TestClient extends HttpClientBase {
	public async getForecasts(): Promise<WeatherForecast[]> {
		const res = await fetch("http://localhost:5000/WeatherForecast");
		return await res.ensureSuccess().getFromJsonArray<WeatherForecast>((el) => new WeatherForecast(el));
	}
}
```
