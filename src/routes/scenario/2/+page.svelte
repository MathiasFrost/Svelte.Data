<script lang="ts">
	import { store } from "./stores.js";
	import TestComponent from "./TestComponent.svelte";

	class Test {
		public test() {
			console.log(this);
		}
	}
	const test = new Test();

	const test2 = {
		test() {
			console.log(test2);
		}
	};
</script>

<h1>Svelte.Data</h1>

<h2>Scenario 2</h2>
<p>String synced to cookie writable</p>

<input type="text" bind:value={$store} />

<button on:click={() => ($store = store.cookie.pull())}> pull </button>
<button on:click={() => store.cookie.clear()}> reset </button>

<button on:click={test.test}> test </button>
<button on:click={test2.test}> test2 </button>

<TestComponent />
