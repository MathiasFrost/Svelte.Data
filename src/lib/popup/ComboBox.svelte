<script lang="ts" context="module">
	type AsyncOrArray<T> = () => Promise<T[]> | T[];
	type ArrayOrValue<T> = T[] | AsyncOrArray<T>;
</script>

<script lang="ts" generics="T, G extends ArrayOrValue<T>, K">
	export let value: K | undefined = void 0;

	export let getter: G;

	function processGet(get: G): G extends AsyncOrArray<T> ? ReturnType<G> : G {
		if (typeof get === "function") {
			const result = get();
			return result instanceof Promise ? result : result;
		} else {
			return get;
		}
	}
</script>

<slot name="summary" />
<slot options={processGet(getter)} />
