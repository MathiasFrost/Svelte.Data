<script lang="ts">
	import type { LayoutData } from "./$types.js";
	import { makeInitializer, setI18N } from "$lib/i18n/index.js";
	import { loadLocalization } from "$sandbox/i18n/loc.js";

	export let data: LayoutData;

	setI18N(data.language, makeInitializer(data.locStrings, { loc: loadLocalization }));
</script>

<slot />
