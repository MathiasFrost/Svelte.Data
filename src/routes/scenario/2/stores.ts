import { stringTransformer } from "$lib/types/transformers.js";
import { CookieSyncer } from "$lib/sync/CookieSyncer.js";
import type { ISyncer } from "$lib/sync/Syncer.js";
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

const session = new CookieSyncer("test", "", { sameSite: "Strict" }, stringTransformer());
export const store: ISyncer<string> & Writable<string> = { ...writable(initStore()), ...session.deconstruct() };
function initStore(): string {
	const res = session.pull();
	if (!res) testPromise().then((s) => store.set(s));
	return res;
}
store.subscribe((val) => {
	console.log(val);
	store.push(val);
});
