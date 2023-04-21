<script lang="ts">
	import { browser } from "$app/environment";

	type ValueBuilderResult<T> = {
		get value(): T;
		set value(val: T);
	};

	class ValueBuilder<T> {
		private initialValue?: T;

		public withInitialValue(value: T): ValueBuilder<T> {
			this.initialValue = value;
			return this;
		}

		public asObject(): ValueBuilderResult<T> {
			let _value: T;
			if (typeof window !== "undefined") {
				const str = window.sessionStorage.getItem("test");
				if (str !== null) _value = str as T;
			}

			if (typeof _value === "undefined") {
				if (typeof this.initialValue === "undefined") throw new Error("");
				_value = this.initialValue;
			}
			const o = {
				get value() {
					return _value;
				},
				set value(val) {
					if (typeof window !== "undefined") window.sessionStorage.setItem("test", val as string);
					_value = val;
				}
			};

			if (browser) window.setTimeout(() => (o.value = "test" as T), 600);
			return o;
		}
	}

	const value = new ValueBuilder<string>().withInitialValue("").asObject();
</script>

<h1>Svelte.Data</h1>

<h2>ValueBuilder with cookie sync</h2>

<input type="text" bind:value={value.value} />
