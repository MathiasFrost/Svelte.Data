<script lang="ts" generics="T">
	import { onDestroy, onMount } from "svelte";
	import type { SvelteSaga } from "$lib/http/SvelteSagaBuilder";

	// eslint-disable-next-line no-undef
	export let saga: SvelteSaga<T>;

	onMount(() => {
		saga.start();
	});

	onDestroy(() => {
		saga.stop();
	});
</script>
