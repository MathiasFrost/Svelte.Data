<script lang="ts">
	import HTMLEditor from "$lib/html/HTMLEditor.svelte";
	import "../../app.scss";
	import EnhancedSelect from "$lib/select/EnhancedSelect.svelte";

	let value: number = 0;
</script>

<h1>HTML Editor</h1>

<HTMLEditor />

{value}
<EnhancedSelect bind:value>
	<input type="text" slot="summary" />
	<ul>
		{#each [1, 2, 3, 4, 5, 6] as num}
			<li><data value={num} />{num}</li>
		{/each}
	</ul>
</EnhancedSelect>
