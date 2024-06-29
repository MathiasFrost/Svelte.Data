import type { I18NLoader } from "$lib/i18n/index.js";
import type { Readable } from "svelte/store";
import type { Int } from "$sandbox/i18n/int.js";
import { getContext } from "svelte";

export const loadLocalization: I18NLoader = {
	async loadInternational(): Promise<{ new (): object }> {
		const module = await import("$sandbox/i18n/int.js");
		return module.Int;
	},
	loadLocalized: {
		async no(): Promise<{ new (): object }> {
			const module = await import("$sandbox/i18n/no.js");
			return module.No;
		}
	}
};

export function getLocalization(): Readable<Record<keyof Int, string>> {
	return getContext("loc");
}
