# Svelte.Data - _Svelte_

![Logo](https://raw.githubusercontent.com/MathiasFrost/Svelte.StoresPlus/main/logo.png)

Package aiming to make it easier to manage data with advanced features in Svelte apps

## Important

Your tsconfig.json [must be set](https://kit.svelte.dev/docs/packaging#typescript) to `"moduleResolution": "bundler"`

## Components

### OIDC

We focus on offering a secure way to handle OIDC authentication and authorization, deliberately avoiding commonly used but less secure practices.

#### Features

-   User sign-in flow: the Authorization Code flow with PKCE.
-   Token storage using encrypted HTTP cookies.
-   Provider-agnostic: Designed to be compatible with any OIDC-compliant identity provider.
-   Simplified API for straightforward integration.

#### A Note on Token Storage

##### Why We Don't Use localStorage for Token Storage

Many existing OIDC client libraries default to using localStorage for token storage. However, our library deliberately avoids this to focus on more secure methods, like encrypted cookies.

Storing sensitive tokens in localStorage exposes them to various security risks, such as Cross-site Scripting (XSS) attacks. HTTP-only cookies offer a more secure alternative, mitigating many common vulnerabilities.

##### The expires_in Value

We only store the expires_in value client-side in localStorage, as it indicates the token's expiration time. This information is far less sensitive and allows you to check token validity safely on the client side.

#### Cookie Handling Best Practices in BFF (Backend-for-Frontend)

When implementing our OIDC JavaScript client library in a BFF architecture, it's crucial to configure your cookies carefully to maintain a secure environment. Here are some guidelines:

##### Why SameSite=Lax?

In a BFF setup, you'll often find the backend and frontend are not part of the same project, requiring cookies to be set with SameSite=Lax to ensure they are sent during top-level navigation changes initiated by HTTP GET methods. This setting offers a good balance between security and usability.

##### CORS (Cross-Origin Resource Sharing)

Configure a CORS policy on your server to explicitly allow only your frontend's domain. For example, if your frontend is hosted on https://myfrontend.mycompany.com, your CORS policy should only allow this specific domain to interact with your backend.

##### Best Practices

-   Use HTTPS: Always use HTTPS for transmitting cookies between the client and server. Make sure to set the Secure flag on your cookies.
-   Restrict Domains: Be specific with your domain and path attributes. If you're using wildcard subdomains, ensure you have tight control and monitoring over subdomain creation.
-   Set Cookie Expiry: Make sure your cookies have an expiration time set to limit the time-frame for potential cookie hijacking or other unauthorized access.
-   HttpOnly: Use the HttpOnly flag for cookies that don't need to be accessed by JavaScript. This adds an extra layer of protection against cross-site scripting (XSS) attacks.
-   Implement CSRF Protection: Although SameSite=Lax offers some level of CSRF protection, implementing additional anti-CSRF tokens can fortify your security.
-   Configure CORS: Even with SameSite=Lax, setting up a strong CORS policy is crucial. Only allow origins that you trust, avoiding wildcard (\*) allowances for sensitive operations.
-   Regular Audits: Conduct regular security audits to ensure that all settings are configured as expected and that there are no vulnerabilities in your application or its dependencies.
-   By following these best practices, you'll set a strong foundation for maintaining a secure BFF architecture when using our OIDC JavaScript client library.

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
		const res = await fetch("http://localhost:5173/api/weatherforecast");
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
