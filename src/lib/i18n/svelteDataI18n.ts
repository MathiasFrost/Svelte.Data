import type { I18NLoader } from "$lib/i18n/index.js";

export const loadSvelteDataI18n: I18NLoader = {
	async loadInternational(): Promise<{ new (): object }> {
		const module = await import("$lib/i18n/int.js");
		return module.Int;
	},
	loadLocalized: {
		async no(): Promise<{ new (): object }> {
			const module = await import("$lib/i18n/no.js");
			return module.No;
		}
	}
};
