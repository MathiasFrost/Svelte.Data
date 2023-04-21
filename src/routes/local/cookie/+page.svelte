<script lang="ts">
	import { browser } from "$app/environment";

	const promise = () =>
		new Promise<string>((resolve) => {
			window.setTimeout(() => {
				console.log("sa");
				resolve("hah");
			}, 600);
		});

	type StorageValueBuilderResult<T> = {
		push: (value: T) => void;
		pull: () => void;
		reset: () => void;
	};

	class StorageValueBuilder<T> {
		private initialValue?: T;

		public withInitialValue(value: T): StorageValueBuilder<T> {
			this.initialValue = value;
			return this;
		}

		private setter?: (value: T) => void;

		public withSetter(setter: (value: T) => void): StorageValueBuilder<T> {
			this.setter = setter;
			return this;
		}

		private promise?: () => Promise<T>;

		public fromPromise(promise: () => Promise<T>): StorageValueBuilder<T> {
			this.promise = promise;
			return this;
		}

		public asObject(): StorageValueBuilderResult<T> {
			const push = (val: T) => {
				if (typeof window !== "undefined") window.sessionStorage.setItem("test", val as string);
			};

			const pull = () => {
				if (typeof window !== "undefined") {
					const str = window.sessionStorage.getItem("test");
					if (str !== null) {
						this.setter?.(str as T);
					} else {
						window.sessionStorage.setItem("test", this.initialValue as string);
						if (typeof this.promise !== "undefined") this.promise().then(sync);
					}
				}
			};

			function sync(value: T) {
				push(value);
				pull();
			}

			const reset = () => {
				if (typeof this.initialValue === "undefined") {
					window.sessionStorage.removeItem("test");
				} else {
					push(this.initialValue);
					this.setter?.(this.initialValue);
				}
				if (typeof this.promise !== "undefined") this.promise().then(sync);
			};

			pull();
			return { pull, push, reset };
		}
	}

	let str = "asd";
	const { pull, push, reset } = new StorageValueBuilder<string>()
		.withInitialValue(str)
		.fromPromise(promise)
		.withSetter((val) => (str = val))
		.asObject();
	$: push(str);
</script>

<h1>Svelte.Data</h1>

<h2>ValueBuilder with cookie sync</h2>

<input type="text" bind:value={str} />

<button on:click={pull}> pull </button>
<button on:click={reset}> reset </button>
