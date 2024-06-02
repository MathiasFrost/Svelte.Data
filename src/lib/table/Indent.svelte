<script lang="ts">
	export let i: number;
</script>

{#each Array.from({ length: i }, (_, i) => i) as _}&nbsp;&nbsp;&nbsp;&nbsp;{/each}
