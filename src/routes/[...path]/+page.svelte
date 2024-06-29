<script lang="ts">
	import { getLanguageStore, getSvelteData, type Language } from "$lib/i18n/index.js";
	import { getLocalization } from "$sandbox/i18n/loc.js";

	const locNpm = getSvelteData();
	const loc = getLocalization();
	const lang = getLanguageStore();

	function onChange(e: Event & { currentTarget: HTMLSelectElement }): void {
		lang.set(e.currentTarget.value ? (e.currentTarget.value as Language) : null);
	}
</script>

<h1 style="color: #3498db">{$locNpm.something} {$loc.haha} <em>({$lang})</em></h1>
<select value={$lang} on:change={onChange}>
	<option value={null}>int</option>
	<option value="no">no</option>
</select>
