import type { LayoutServerLoad } from "./$types.js";
import { languageSyncer, loadAllI18N } from "$lib/i18n/index.js";
import { loadLocalization } from "$sandbox/i18n/loc.js";

export const load: LayoutServerLoad = async ({ cookies }) => {
	const language = languageSyncer.pull(cookies);
	const locStrings = await loadAllI18N(language, { loc: loadLocalization });
	console.log(locStrings.svelteDataI18n);
	console.log(locStrings.loc);
	return { language, locStrings };
};
