<script lang="ts">
	import HTMLEditor from "$lib/html/HTMLEditor.svelte";
	import "../../app.scss";
	import ComboBox from "$lib/popup/ComboBox.svelte";

	let value: string = "0";
</script>

<h1>HTML Editor</h1>

<HTMLEditor />

{value}
<ComboBox bind:value>
	<input type="text" />
	<ul>
		{#each [1, 2, 3, 4, 5, 6] as num}
			<li><data value={num} />{num}</li>
		{/each}
	</ul>
</ComboBox>
