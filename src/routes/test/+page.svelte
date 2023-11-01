<script lang="ts">
	import { HTTPResponseError } from "$lib/http";
	import { testHttp } from "$sandbox/http/TestHTTP";

	let err = "";
	async function test(): Promise<void> {
		try {
			err = await testHttp.getTest();
		} catch (e) {
			if (e instanceof HTTPResponseError && e.response.status === 400) {
				console.log(e.message);
				err = await e.response.text();
			}
			throw e;
		}
	}
</script>

<h1>Test</h1>

<button on:click={test}>test</button>
<pre><code style="color: crimson;">{err}</code></pre>
