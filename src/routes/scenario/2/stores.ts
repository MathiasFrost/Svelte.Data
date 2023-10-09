import { stringSerializer } from "$lib/types/Serializer.js";
import { CookieSyncer } from "$lib/sync/CookieSyncer.js";
import { writable, type Writable } from "svelte/store";

const testPromise = (str?: string) =>
	new Promise<string>((resolve, reject) => {
		if (typeof window === "undefined") resolve("");
		else
			window.setTimeout(() => {
				if (str === "reject") reject(new Error("test"));
				else resolve(str ?? "test");
			}, 1_000);
	});

const cookie = new CookieSyncer("test", "", { sameSite: "Strict" }, stringSerializer());
export const store: Writable<string> & { cookie: CookieSyncer<string> } = { ...writable(initStore()), cookie: cookie };
function initStore(): string {
	const res = cookie.pull();
	if (!res) testPromise().then((s) => store.set(s));
	return res;
}
store.subscribe((val) => store.cookie.push(val));
