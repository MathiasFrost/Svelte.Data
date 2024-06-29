<script lang="ts">
	import { getLanguageStore, getSvelteData } from "$lib/i18n/index.js";
	import { getLocalization } from "$sandbox/i18n/loc.js";

	const locNpm = getSvelteData();
	const loc = getLocalization();
	const lang = getLanguageStore();
</script>

<h1 style="color: #3498db">{$locNpm.something} {$loc.haha} <em>({$lang})</em></h1>
<select value={$lang} on:change={(e) => lang.set(e.currentTarget.value ? e.currentTarget.value : null)}>
	<option value={null}>int</option>
	<option value="no">no</option>
</select>
