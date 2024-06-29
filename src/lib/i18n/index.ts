import { CookieSyncer } from "$lib/sync/index.js";
import type { Serializer } from "$lib/utils/index.js";
import { derived, type Readable, type Writable, writable } from "svelte/store";
import { getContext, setContext } from "svelte";
import type { Int } from "$lib/i18n/int.js";
import { loadSvelteDataI18n } from "$lib/i18n/svelteDataI18n.js";

export type Language = "no";

export const Localizations: Language[] = ["no"];

const serializer: Serializer<Language | null> = {
	deserialize(string) {
		if (!string) return null;
		if (!Localizations.includes(string as Language)) throw new Error(`Unsupported localization string: ${string}`);
		return string as Language;
	},
	serialize(something) {
		return something ?? "";
	}
};

export const languageSyncer = new CookieSyncer<Language | null>("language", null, { sameSite: "Strict" }, serializer);

export interface I18NLoader {
	loadInternational(): Promise<new () => object>;
	loadLocalized: Partial<Record<Language, () => Promise<new () => object>>>;
}

export async function loadI18N(language: Language | null, loader: I18NLoader): Promise<Record<string, string>> {
	let res: Record<string, string>;
	if (language && language in loader.loadLocalized) {
		const Class = await loader.loadLocalized["no"]!();
		res = new Class() as unknown as Record<string, string>;
	} else {
		const Class = await loader.loadInternational();
		res = new Class() as unknown as Record<string, string>;
	}
	return { ...res };
}

export async function loadAllI18N(language: Language | null, loaders: Record<string, I18NLoader>): Promise<Record<string, Record<string, string>>> {
	const res: Record<string, Record<string, string>> = { svelteDataI18n: await loadI18N(language, loadSvelteDataI18n) };
	for (const key of Object.keys(loaders)) {
		res[key] = await loadI18N(language, loaders[key]);
	}
	return res;
}

export type LanguageStore = Writable<Language | null> & { syncer: CookieSyncer<Language | null> };

export interface I18NInitializer {
	initial: Record<string, string>;
	loader: I18NLoader;
}

export function makeInitializer(initial: Record<string, Record<string, string>>, loaders: Record<string, I18NLoader>): Record<string, I18NInitializer> {
	const res: Record<string, I18NInitializer> = {};
	for (const key of Object.keys(initial)) {
		const init = initial[key];
		const loader = key === "svelteDataI18n" ? loadSvelteDataI18n : loaders[key];
		res[key] = { initial: init, loader };
	}
	return res;
}

export function setI18N(language: Language | null, locStrings: Record<string, I18NInitializer>): void {
	const store = writable<Language | null>(language);
	const languageStore: LanguageStore = { ...store, syncer: languageSyncer };
	languageStore.subscribe((val) => languageSyncer.push(val));
	setContext("language", languageStore);

	for (const key of Object.keys(locStrings)) {
		const { initial, loader } = locStrings[key];
		const store: Readable<Record<string, string>> = derived(
			languageStore,
			($language, set) => {
				loadI18N($language, loader).then(set);
			},
			initial
		);
		setContext(key, store);
	}
}

export function getLanguageStore(): LanguageStore {
	return getContext("language");
}

export function getSvelteData(): Readable<Record<keyof Int, string>> {
	return getContext("svelteDataI18n");
}
