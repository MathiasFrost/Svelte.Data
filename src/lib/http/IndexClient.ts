import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { HttpClient } from "$lib/http/HttpClient";
import { MenuItem } from "$lib/layout/MenuItem";
import { AuthenticatedUser } from "$lib/user/AuthenticatedUser";
import type { Provider } from "$lib/user/Provider";
import { user } from "$lib/user/user";
import { ensureArray, stateIsResolved } from "@maal/svelte-stores-plus";
import type { User } from "oidc-client-ts";
import { get } from "svelte/store";

/** @static */
export class IndexClient {
	/** */
	private static client: HttpClient = new HttpClient(PUBLIC_BACKEND_URL, "backend");

	/** */
	public static async menu(): Promise<MenuItem[]> {
		const res = await this.client.get("Menu");
		return ensureArray(await res.ensureSuccess().json()).map((something) => new MenuItem(something));
	}

	/** @returns User information */
	public static async me(provider: Provider, oidcUser: User): Promise<AuthenticatedUser | null> {
		const headers = new Headers();
		headers.append("Authorization", `${provider}Bearer ${oidcUser.access_token}`);
		const init: RequestInit = { headers };

		const res = await this.client.get("Me", init);
		if (res.status === 401) return null;
		return new AuthenticatedUser(oidcUser, await res.ensureSuccess().json());
	}

	/** Check if we are still authenticated. Called by pinger. This is important */
	public static async pingAuth(): Promise<void> {
		if (stateIsResolved(get(user)) || get(user) === null) return;
		await this.client.get("Ping/OpenIdBearer");
	}

	/** */
	public static async provider(): Promise<Provider> {
		const res = await this.client.get("Provider");
		const str = await res.text();
		return str ? (str as Provider) : "pending";
	}
}
