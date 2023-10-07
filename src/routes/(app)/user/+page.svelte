<script lang="ts">
	import Authorize from "$sandbox/user/Authorize.svelte";
	import { user } from "$sandbox/user/user.js";
	import TestComponent from "$sandbox/components/TestComponent.svelte";
	import { TestHTTP } from "$sandbox/http/TestHTTP.js";
</script>

<section>
	<h1>User</h1>

	<Authorize>
		<p>Hello "{$user["name"]}"</p>
		<TestComponent />
		<p slot="unauthorized">
			Nope
			<button on:click={() => TestHTTP.postUseR()}>Sign in</button>
		</p>
	</Authorize>
</section>
