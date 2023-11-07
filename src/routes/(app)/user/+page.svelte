<script lang="ts">
	import Authorize from "$sandbox/user/Authorize.svelte";
	import { getUserStore } from "$sandbox/user/user.js";
	import TestComponent from "$sandbox/components/TestComponent.svelte";
	import { testHttp } from "$sandbox/http/TestHTTP.js";

	const user = getUserStore();
</script>

<section>
	<h1>User</h1>

	<Authorize>
		<p>Hello "{$user["name"]}"</p>
		<TestComponent />
		<p slot="unauthorized">
			Nope
			<button on:click={() => testHttp.postUser()}>Sign in</button>
		</p>
	</Authorize>
</section>
