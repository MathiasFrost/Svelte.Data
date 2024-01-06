<script lang="ts">
	/** TODOC */
	export let fullscreen = false;

	/** TODOC */
	export let side: "left" | "right" = "right";

	/** TODOC */
	export let open: boolean;
	$: closed = !open;

	/** Width in CSS */
	export let width = "10rem";
</script>

<div class="container {side}" class:closed class:fullscreen style="width: {width}">
	<slot />
</div>

<style lang="scss">
	@use "../../style/var";

	.container {
		height: 100%;
		background-color: var.$primary-a30;
		backdrop-filter: blur(3px);
		border: var.$secondary-light-a30 2px solid;
		position: relative;
		top: 0;
		transition-property: transform;
		transition-duration: var.$fast;
		overflow-y: auto;

		&.closed {
			transform: translateX(100%);
		}

		&.fullscreen {
			height: 100vh !important;
			position: fixed;
			top: 0;

			&.left {
				left: 0;
			}

			&.right {
				right: 0;
			}
		}

		&.left {
			float: left;
		}

		&.right {
			float: right;
		}
	}
</style>
