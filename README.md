# Svelte.StoresPlus - _SvelteKit_

Utility functions aiming to make it quick and easy to create Svelte stores with advanced functionality sich as history management; async data and storage.

# Examples

**Note:** throughout the examples we will use lambda functions instead of `Function.prototype.bind`. [Read more](https://stackoverflow.com/questions/42117911/lambda-functions-vs-bind-memory-and-performance).

## Bread and Butter Writable from Promise with History Management

### Use Case

1. You need to fetch data from a server
2. Multiple Svelte components needs access to this data
3. User must be able to edit the data
4. User should be able to undo, redo and reset their changes

### Code

```svelte
<script lang="ts">
	// Not that
</script>
```

## Sync a variable to `localStorage`

### Use Case

1. You need a persistant variable but don't want to store it in a database

### Code

```svelte
<script lang="ts">
	// String storage provides the simplest serialization/deserialization of strings
	import {LocalStorageSyncer, stringStorage} from "@maal/svelte-stores-plus";

	const syncer = new LocalStorageSyncer<string>("example", stringStorage("display this when server-rendering"));

	let val = syncer.get("Initial value");
	$: syncer.sync(val) || val;
</script>

<p>Value: {val}</p>
<input type="text" bind:value={val} />
```
