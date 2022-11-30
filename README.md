# Svelte.StoresPlus - _SvelteKit_

Convenient Svelte store abstractions

# Stores

| Implemented                     | Name                                | From promise                    | Store          | With history                    |
| ------------------------------- | ----------------------------------- | ------------------------------- | -------------- | ------------------------------- |
| <input type="checkbox" checked> | WritableCookie                      | <input type="checkbox">         | Cookie         | <input type="checkbox">         |
| <input type="checkbox" checked> | WritableLocalStorage                | <input type="checkbox">         | LocalStorage   | <input type="checkbox">         |
| <input type="checkbox" checked> | WritableSessionStorage              | <input type="checkbox">         | SessionStorage | <input type="checkbox">         |
| <input type="checkbox">         | WritableIndexedDB                   | <input type="checkbox">         | IndexedDB      |
| <input type="checkbox">         | WritableCache                       | <input type="checkbox">         | Cache          |
| <input type="checkbox" checked> | WritableAsync                       | <input type="checkbox" checked> | Memory         | <input type="checkbox">         |
| <input type="checkbox">         | WritableCookieAsync                 | <input type="checkbox" checked> | Cookie         | <input type="checkbox">         |
| <input type="checkbox">         | WritableLocalStorageAsync           | <input type="checkbox" checked> | LocalStorage   | <input type="checkbox">         |
| <input type="checkbox">         | WritableSessionStorageAsync         | <input type="checkbox" checked> | SessionStorage | <input type="checkbox">         |
| <input type="checkbox">         | WritableIndexedDBAsync              | <input type="checkbox" checked> | IndexedDB      | <input type="checkbox">         |
| <input type="checkbox">         | WritableCacheAsync                  | <input type="checkbox" checked> | Cache          | <input type="checkbox">         |
| <input type="checkbox" checked> | HistoricWritable                    | <input type="checkbox">         | Memory         | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableCookie              | <input type="checkbox">         | Cookie         | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableLocalStorage        | <input type="checkbox">         | LocalStorage   | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableSessionStorage      | <input type="checkbox">         | SessionStorage | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableIndexedDB           | <input type="checkbox">         | IndexedDB      | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableCache               | <input type="checkbox">         | Cache          | <input type="checkbox" checked> |
| <input type="checkbox" checked> | HistoricWritableAsync               | <input type="checkbox" checked> | Memory         | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableCookieAsync         | <input type="checkbox" checked> | Cookie         | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableLocalStorageAsync   | <input type="checkbox" checked> | LocalStorage   | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableSessionStorageAsync | <input type="checkbox" checked> | SessionStorage | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableIndexedDBAsync      | <input type="checkbox" checked> | IndexedDB      | <input type="checkbox" checked> |
| <input type="checkbox">         | HistoricWritableCacheAsync          | <input type="checkbox" checked> | Cache          | <input type="checkbox" checked> |

## Examples

### HistoricWritable

```ts
import {historicWritable} from "$lib/historic/HistoricWritable";

export const historic = historicWritable<string>("initial value");
```

```svelte
<script lang="ts">
	import {historic} from "$lib/stores/historic";
	import {onDestroy} from "svelte";

	function update(e: Event): void {
		const target = e.target as HTMLInputElement;
		historic.set(target.value);
	}

	let history: string[] = [];
	let index = 0;

	let unsubscribeHistory = historic.history.subscribe((value) => (history = value));
	let unsubscribeIndex = historic.index.subscribe((value) => (index = value));

	onDestroy(() => {
		unsubscribeHistory();
		unsubscribeIndex();
	});
</script>

<input type="text" value={$historic} on:change={update} />
<button on:click={historic.undo}>undo</button>
<button on:click={historic.redo}>redo</button>
<button on:click={historic.deleteHistory}>clear</button>
<p>Index: {index}</p>
<ul>
	{#each history as item, i}
		<li style={i === index ? "color: crimson;" : ""}>{item}</li>
	{/each}
</ul>
```

### WritableAsync

```ts
import {writableAsync} from "@maal/svelte-stores-plus/WritableAsync";
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

// if using a method remember to bind: someClient.getForecasts.bind(someClient);
export const forecasts = writableAsync<WeatherForecast[]>(getForecasts);
```

```svelte
<script lang="ts">
	import {forecasts} from "$lib/stores/forecasts";
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

### HistoricWritableAsync

```ts
import {historicWritableAsync} from "@maal/svelte-stores-plus/HistoricWritableAsync";
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

// if using a method remember to bind: someClient.getForecasts.bind(someClient);
export const forecasts = historicWritableAsync<WeatherForecast[]>(getForecasts, {cap: 20});
```

```svelte
<script lang="ts">
	import {forecasts} from "$lib/stores/forecasts";
	import type {WeatherForecast} from "$lib/models/WeatherForecast";
	import {onDestroy} from "svelte";

	let history: WeatherForecast[][] = [];
	let index = 0;

	let unsubscribeHistory = forecasts.history.subscribe((value) => (history = value));
	let unsubscribeIndex = forecasts.index.subscribe((value) => (index = value));

	onDestroy(() => {
		unsubscribeHistory();
		unsubscribeIndex();
	});
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
	<input type="text" bind:value={$forecasts[0].summary} />
	<button on:click={forecasts.undo}>undo</button>
	<button on:click={forecasts.redo}>redo</button>
	<button on:click={() => forecasts.refresh()}>refresh</button>
	<button on:click={() => forecasts.refresh(true)}>silent refresh</button>
	<button on:click={forecasts.deleteHistory}>clear</button>
	<p>Index: {index}</p>
	<ul>
		{#each history as item, i}
			<li style={i === index ? "color: crimson;" : ""}>{Array.isArray(item) && item[0].summary}</li>
		{/each}
	</ul>
{/if}
```

### WritableCookie

```ts
import {writableCookie} from "@maal/svelte-stores-plus/WritableCookie";
import {RandomModel} from "$lib/models/RandomModel";

export const cookie = writableCookie<RandomModel>("random_model", {
	initialValue: new RandomModel(),
	transform: (rawValue) => new RandomModel(JSON.parse(rawValue))
});
```

```svelte
<script lang="ts">
	import {cookie} from "$lib/stores/cookie";
</script>

<p>Date:</p>
<pre>{$cookie.date}</pre>

<p>Name:</p>
<pre>{$cookie.name}</pre>

<p>Num:</p>
<pre>{$cookie.num}</pre>

<p>Nully:</p>
<pre>{$cookie.nully}</pre>

<p>bool:</p>
<pre>{$cookie.bool}</pre>

<input type="text" bind:value={$cookie.name} />
```

### WritableLocalStorage

```ts
import {writableLocalStorage} from "@maal/svelte-stores-plus/WritableLocalStorage";
import {RandomModel} from "$lib/models/RandomModel";

export const local = writableLocalStorage<RandomModel>("random_model", {
	initialValue: new RandomModel(),
	transform: (rawValue) => new RandomModel(JSON.parse(rawValue))
});
```

```svelte
<script lang="ts">
	import {local} from "$lib/stores/local";
</script>

<p>Date:</p>
<pre>{$local.date}</pre>

<p>Name:</p>
<pre>{$local.name}</pre>

<p>Num:</p>
<pre>{$local.num}</pre>

<p>Nully:</p>
<pre>{$local.nully}</pre>

<p>bool:</p>
<pre>{$local.bool}</pre>

<input type="text" bind:value={$local.name} />
```

### WritableSessionStorage

```ts
import {writableSessionStorage} from "@maal/svelte-stores-plus/WritableSessionStorage";
import {RandomModel} from "$lib/models/RandomModel";

export const session = writableSessionStorage<RandomModel>("random_model", {
	initialValue: new RandomModel(),
	transform: (rawValue) => new RandomModel(JSON.parse(rawValue))
});
```

```svelte
<script lang="ts">
	import {session} from "$lib/stores/session";
</script>

<p>Date:</p>
<pre>{$session.date}</pre>

<p>Name:</p>
<pre>{$session.name}</pre>

<p>Num:</p>
<pre>{$session.num}</pre>

<p>Nully:</p>
<pre>{$session.nully}</pre>

<p>bool:</p>
<pre>{$session.bool}</pre>

<input type="text" bind:value={$session.name} />
```
