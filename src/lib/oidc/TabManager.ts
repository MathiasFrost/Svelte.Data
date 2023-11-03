import { OIDCGlobals } from "$lib/oidc/OIDCGlobals";

console.log("modle");
export class TabManager {
	/** TODOC */
	public static tabIndex = 0;

	/** TODOC */
	public static get tabActive() {
		return OIDCGlobals.tabSyncer.pull()[this.tabIndex];
	}

	/** ctor */
	public static initialize(): void {
		if (typeof window === "undefined") return;

		window.removeEventListener("beforeunload", this.onBeforeUnload.bind(this));
		window.addEventListener("beforeunload", this.onBeforeUnload.bind(this));

		document.removeEventListener("visibilitychange", this.onVisibilityChange.bind(this));
		document.addEventListener("visibilitychange", this.onVisibilityChange.bind(this));

		let existing = OIDCGlobals.tabSyncer.pull();
		this.tabIndex = existing.length;
		existing = existing.map(() => false); // When new tab is initialized all other tabs is necessarily not active
		existing.push(true);
		OIDCGlobals.tabSyncer.push(existing);
		console.log(this.tabIndex, existing);
	}

	/** TODOC */
	public static onBeforeUnload(): void {
		console.info(`OIDC: tab ${this.tabIndex} closed`);
		const existing = OIDCGlobals.tabSyncer.pull();
		existing.splice(this.tabIndex, 1);
		OIDCGlobals.tabSyncer.push(existing);
	}

	/** TODOC */
	public static onVisibilityChange(): void {
		if (document.visibilityState !== "visible") return;

		console.info(`OIDC: tab ${this.tabIndex} active`);
		const existing = OIDCGlobals.tabSyncer.pull().map((_value, i) => i === this.tabIndex);
		OIDCGlobals.tabSyncer.push(existing);
	}
}

// Static ctor
TabManager.initialize();
