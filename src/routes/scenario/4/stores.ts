import { writable } from "svelte/store";

export const store = writable<{ value: string; promise: Promise<string> }>({ value: "", promise: Promise.resolve("") }, (set) => {
	const promise = new Promise<string>((resolve) => {
		if (typeof window === "undefined") resolve("");
		else window.setTimeout(() => resolve("test"), 1_000);
	});
	set({ value: "", promise });
	promise.then((res) => set({ value: res, promise }));
});
