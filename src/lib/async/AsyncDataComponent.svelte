<script lang="ts">
	import { AsyncData } from "./AsyncData.js";
	import { createEventDispatcher, onDestroy } from "svelte";

	/** */
	type T = $$Generic;

	/** */
	const dispatch = createEventDispatcher<{ invoked: Promise<T>; resolved: T; rejected: Error }>();

	/** */
	export const data = new AsyncData<T>();
	data.onInvoked = (promise) => dispatch("invoked", promise);
	data.onResolved = (res) => dispatch("resolved", res);
	data.onReject = (e) => dispatch("rejected", e);

	/** Function that returns the promise */
	export let promiseFactory: () => Promise<T>;
	$: data.promiseFactory = promiseFactory;

	/** Milliseconds between each invocation. Setting to 0 suspends invocation indefinately */
	export let milliseconds = 0;
	$: data.milliseconds = milliseconds;

	/** */
	export let cooldown = 0;
	$: data.cooldown = cooldown;

	// Clear interval
	onDestroy(() => data.stop());
</script>
