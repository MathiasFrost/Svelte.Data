# Svelte.Data - _Svelte

![Logo](https://raw.githubusercontent.com/MathiasFrost/Svelte.StoresPlus/main/logo.png)

Building blocks aiming to make it quick and easy to create Svelte stores with advanced functionality such as history management; async data and storage.

# Examples

## `Writable` from `Promise` with history Management

### Common use case

1. You need to fetch data from a server
2. Multiple Svelte components needs access to this data
3. User must be able to edit the data
4. User should be able to undo, redo and reset their changes

### Sample code

The commonality of this store constitutes it's own wrapper:

```ts
import type { AsyncState } from "@maal/svelte-stores-plus";
import { writable, type Readable, type Updater, type Writable } from "svelte/store";
import { AsyncData, stateIsResolved, HistoryManager } from "@maal/svelte-stores-plus";

export type WritableAsyncHistoric<T> = Writable<AsyncState<T>> & {
	refresh: (silent?: boolean) => void;
	redo: () => void;
	undo: () => void;
};

export type WritableAsyncHistoricBundle<T> = {
	value: WritableAsyncHistoric<T>;
	index: Readable<number>;
	history: Readable<T[]>;
};

export function writableAsyncHistoric<T>(promise: () => Promise<T>): WritableAsyncHistoricBundle<T> {
	const { set: _set, update: _update, subscribe } = writable<AsyncState<T>>(void 0);

	const index = writable<number>(-1);
	const history = writable<T[]>([]);

	const manager = new HistoryManager<T>({
		cap: 10,
		setValue: (value) => set(value),
		setIndex: (i) => index.set(i),
		setHistory: (value) => history.set(value),
		ensureT(value): value is T {
			return stateIsResolved(value);
		}
	});

	function set(value: AsyncState<T>): void {
		_set(value);
		manager.addEntry(value);
		// You can also add syncing to a store here using something like LocalStorageSyncer
	}

	function update(updater: Updater<AsyncState<T>>): void {
		_update((prev) => {
			if (stateIsResolved(prev)) {
				const val = updater(prev);
				manager.addEntry(val);
				return val;
			}
			return prev;
		});
	}

	const data = new AsyncData<T>(promise, {
		browserOnly: true,
		setValue: (value) => set(value)
	});

	return {
		value: {
			set,
			update,
			subscribe,
			refresh: data.refresh.bind(data),
			redo: manager.redo.bind(manager),
			undo: manager.undo.bind(manager)
		},
		index: { subscribe: index.subscribe },
		history: { subscribe: history.subscribe }
	};
}
```

```ts
import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
import { testClient } from "$sandbox/services/testClient";
import { writableAsyncHistoric } from "$sandbox/example/WritableAsyncHistoric";

export const {
	history: forecastHistory, // Providing histry and index stores as separate objects are more convenient,
	index: forecastIndex, // allowing you to use Svelte's auto-subscribe ('$')
	value: forecasts
} = writableAsyncHistoric<WeatherForecast[]>(testClient.getForecasts.bind(testClient));
```

```svelte
<script lang="ts">
	import { forecasts, forecastIndex, forecastHistory } from "$sandbox/stores/writableAsyncHistoric";
</script>

{#if typeof $forecasts === "undefined"}
	<p>Loading...</p>
{:else if $forecasts instanceof Error}
	<p style="color: crimson">{$forecasts.message}</p>
	<p>{$forecasts.stack}</p>
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
	<button on:click={() => forecasts.undo()}>undo</button>
	<button on:click={() => forecasts.redo()}>redo</button>
	<button on:click={() => forecasts.refresh()}>refresh</button>
	<button on:click={() => forecasts.refresh(true)}>silent refresh</button>
	<p>Index: {$forecastIndex}</p>
	<ul>
		{#each $forecastHistory as item, i}
			<li style={i === $forecastIndex ? "color: crimson;" : ""}>{item[0].summary}</li>
		{/each}
	</ul>
{/if}
```

## Variable with `localStorage` sync

### Common use case

1. You need a persistant variable but don't want to store it in a database

### Sample code

```svelte
<script lang="ts">
	// String storage provides the simplest serialization/deserialization of strings
	import { LocalStorageSyncer, stringStorage } from "@maal/svelte-stores-plus";

	const syncer = new LocalStorageSyncer<string>("example", stringStorage("display this when server-rendering"));

	let val = syncer.get("Initial value");
	$: syncer.sync(val) || val;
</script>

<p>Value: {val}</p>
<input type="text" bind:value={val} />
```

## Variable from `Promise`

### Common use case

1. You need to fetch data from a server
2. User must be able to edit the data _(Svelte's #await blocks are immutable)_

### Sample code

```svelte
<script lang="ts">
	import { AsyncData } from "@maal/svelte-stores-plus";
	import type { WeatherForecast } from "$sandbox/models/WeatherForecast";
	import { testClient } from "$sandbox/services/testClient";

	let forecasts: WeatherForecast[] | Error | undefined = void 0;
	// Remember that if passing in a method, this has to be bound or wrapped in a lambda
	const data = new AsyncData<WeatherForecast[]>(testClient.getForecasts.bind(testClient), { setValue: (value) => (forecasts = value) });
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
import { ensureArray } from "@maal/svelte-stores-plus";
import { WeatherForecast } from "$sandbox/models/WeatherForecast";

export class TestClient {
	public async getForecasts(): Promise<WeatherForecast[]> {
		const res = await fetch("http://localhost:5000/WeatherForecast");
		return ensureArray(await res.ensureSuccess().json()).map((el) => new WeatherForecast(el));
	}
}
```

_See recommendation at the bottom for more info_

## `Writable` from `Promise` with `indexedDB` sync

### Common use case

1. You need to fetch a lot of data from a server
2. Holding all data in memory is unappealing

### Sample code

```ts
// TODO
```

```svelte
<!-- TODO -->
```

## Recommendations for serialization/deserialization

**Recommendation**: For models, use classes. **Not** interfaces.  
**Reason**: interfaces exist to tell TypeScript that "this object is guaranteed to have these members".  
But when dealing with data stored at various locations, we **don't** have that guarantee.  
Did the REST endpoint you are calling change? Did the user modify the data stored in localStorage? Was there a JSON property that could be null that your code has not accounted for?  
All of these problems are dealt with when doing the following:

### 1. Make sure the `Response` is what you expect it to be

```ts
import { ensureArray } from "@maal/svelte-stores-plus";

Response.prototype.ensureSuccess = function (): Response {
	if (!this.ok) {
		throw new Error(`Expected status code indicating success, got: ${this.status} ${this.statusText}`);
	}
	return this;
};

export class TestClient {
	public async getForecasts(): Promise<WeatherForecast[]> {
		const res = await this.get("WeatherForecast");
		return ensureArray(await res.ensureSuccess().json()).map((el) => new WeatherForecast(el));
	}
}
```

### 2. Make sure the JSON is what you expect it to be

```ts
import { ensureObject, ensureDateString, ensureNumber, ensureString } from "@maal/svelte-stores-plus";

export class WeatherForecast {
	date: Date;
	temperatureC: number;
	temperatureF: number;
	summary: string | null;

	public constructor(something: unknown) {
		const o = ensureObject(something);
		this.date = ensureDateString(o.date);
		this.temperatureC = ensureNumber(o.temperatureC);
		this.temperatureF = ensureNumber(o.temperatureF);
		this.summary = ensureString(o.summary);
	}
}
```
