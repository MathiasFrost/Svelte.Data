# Svelte.StoresPlus - _SvelteKit_

Utilities aiming to make it quick and easy to create Svelte stores with advanced functionality sich as history management; async data and storage.

# Examples

## _Bread and butter_ `Writable` from `Promise` with history Management

### Common use case

1. You need to fetch data from a server
2. Multiple Svelte components needs access to this data
3. User must be able to edit the data
4. User should be able to undo, redo and reset their changes

### Sample code

```svelte
<script lang="ts">
	// Not that
</script>
```

## Variable with `localStorage` sync

### Common use case

1. You need a persistant variable but don't want to store it in a database

### Sample code

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

## Variable from `Promise`

### Common use case

1. You need to fetch data from a server
2. User must be able to edit the data _(Svelte's #await blocks are immutable)_

### Sample code

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

**Recommendation**: For models, use classes. **Not** interfaces
**Reason**: interfaces exist to tell TypeScript that "this object is guaranteed to have these members".  
But when dealing with data stored at various locations, we **don't** have that guarantee.  
Did the REST endpoint you are calling change? Did the user modify the data stored in localStorage? Was there a JSON property that could be null that your could has not accounted for?
All of these problems are dealt with when doing the following:

### 1. Make sure the `Response` is what you expect it to be

```ts
Response.prototype.ensureSuccess = function (): Response {
	if (!this.ok) {
		throw new Error(`Expected status code indicating success, got: ${this.status} ${this.statusText}`);
	}
	return this;
};

Response.prototype.getFromJsonArray = async function <T>(ctor: (el: unknown) => T): Promise<T[]> {
	const json = await this.json();
	if (!Array.isArray(json)) {
		throw new Error(`Expected body to be a JSON array, got: ${typeof json}`);
	}
	return json.map(ctor);
};

Response.prototype.getFromJson = async function <T>(ctor: (el: unknown) => T): Promise<T> {
	const json = await this.json();
	if (typeof json !== "object") {
		throw new Error(`Expected body to be a JSON object, got: ${typeof json}`);
	}
	return ctor(json);
};
```

Similar extension methods can be made for other tpes such as `string` or `number`

### 2. Make sure the JSON is what you expect it to be

```ts
export class WeatherForecast {
	date: Date;
	temperatureC: number;
	temperatureF: number;
	summary: string | null;

	public constructor(something: unknown) {
		const o = ensureObject(something); // These helper methods are exported from @maal/svelte-stores-plus
		this.date = ensureDateString(o.date);
		this.temperatureC = ensureNumber(o.temperatureC);
		this.temperatureF = ensureNumber(o.temperatureF);
		this.summary = ensureString(o.summary);
	}
}
```

### 3. Put it all together

```ts
export class TestClient {
	public async getForecasts(): Promise<WeatherForecast[]> {
		const res = await this.get("WeatherForecast");
		return await res.ensureSuccess().getFromJsonArray<WeatherForecast>((el) => new WeatherForecast(el));
	}
}
```
