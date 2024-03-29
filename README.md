# Svelte.Data - _Svelte_

![Logo](https://raw.githubusercontent.com/MathiasFrost/Svelte.StoresPlus/main/logo.png)

Package aiming to make it easier to manage data with advanced features in Svelte apps

## Important

Your tsconfig.json [must be set](https://kit.svelte.dev/docs/packaging#typescript) to `"moduleResolution": "bundler"`

## Components

### EnhancedSelect

For scenarios when the native `<select>` element does not suffice.

#### Example

```sveltehtml
<form on:submit|preventDefault={onSubmit} style="width: 100%;">
	<EnhancedSelect name="users" pool={users} values={[1, 3]} force multiple let:values let:pool>
		<svelte:fragment slot="summary">
			{@const filtered = pool.filter((user) => values.includes(user.id))}
			<input type="text" readonly style="width: 100%" value={filtered.map((user) => user.username).join(", ")} />
		</svelte:fragment>
		<div class="selector">
			{@const filtered = filterOptions(users)}
			<input type="search" style="width: 100%" placeholder="Employee" name="name" />
			<input type="search" style="width: 100%" placeholder="Employee" name="username" />
			<EnhancedOption {registerOption} togglesAll>
				<input tabindex="-1" type="checkbox" checked={allChecked} />
				{#if allChecked}Uncheck all{:else}Check all{/if} ({filtered.length})
			</EnhancedOption>
			{#each filtered as user (user.id)}
				<EnhancedOption {registerOption} value={user.id} item={user} let:checked
					><input tabindex="-1" type="checkbox" {checked} />{user.name}</EnhancedOption>
			{/each}
		</div>
	</EnhancedSelect>
	<button type="submit">submit</button>
</form>
```

### Syncer

Handle pulling and pushing a value to and from a replication source

| Name                 | Replication source      |
| -------------------- | ----------------------- |
| LocalStorageSyncer   | `window.localStorage`   |
| SessionStorageSyncer | `window.sessionStorage` |
| CookieSyncer         | `document.cookie`       |

## Scenarios

Examples on how you can employ these components in different scenarios:

### Sync value to `window.localStorage`

```ts
import { LocalStorageSyncer } from "@maal/svelte-data/sync";
import { writable } from "svelte/store";

const syncer = new LocalStorageSyncer("key", "initialValue");
export const someStore = writable<string>(syncer.pull());
someStore.subscribe((value) => syncer.push(value));
```

## Recommendations for handling remote data

**Recommendation**: For models, use classes. **Not** interfaces.  
**Reason**: interfaces exist to tell TypeScript that "this object is guaranteed to have these members".  
This is fine at build-time, but when dealing with data stored at various locations at runtime, we **can't** guarantee that.

Did the REST endpoint you are calling change? Did the user modify the data stored in localStorage? Was there a JSON property that could be null that your code
has not accounted for?

All of these problems are dealt with when doing the following:

### 1. Make sure the `Response` is what you expect it to be

```ts
import { ensureArray } from "@maal/svelte-data/types";

Response.prototype.ensureSuccess = function (): Response {
	if (!this.ok) {
		throw new Error(`Expected status code indicating success, got: ${this.status} ${this.statusText}`);
	}
	return this;
};

export class TestHTTP {
	public async getForecasts(): Promise<WeatherForecast[]> {
		const res = await window.fetch("http://localhost:5173/api/weatherforecast");
		return ensureArray(await res.ensureSuccess().json()).map((el) => new WeatherForecast(el));
	}
}
```

### 2. Make sure the JSON is what you expect it to be

```ts
import { ensureObject, ensureDateString, ensureNumber, ensureString } from "@maal/svelte-data";

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

### HTTPClient

Using `HTTPClient` does these things for you:

```ts
import { HTTPClient } from "@maal/svelte-data/http";
import { WeatherForecast } from "$lib/models/WeatherForecast.js";

/** @static */
export class TestHTTP {
	/** TODOC */
	private static httpClient = new HTTPClient("http://localhost:5173/api/", { redirect: "manual", credentials: "include" });

	/** @param fetch This is only needed for SSR */
	public static async getForecasts(fetch?: typeof window.fetch): Promise<WeatherForecast[]> {
		return await this.httpClient
			.get("weatherforecast")
			.withFetch(fetch) // If you are fetching server-side in SvelteKit's `load` function
			.fromJSONArray((something) => new WeatherForecast(something));
	}
}
```
