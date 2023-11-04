import { OIDCGlobals } from "$lib/oidc/OIDCGlobals.js";

/** TODOC */
export class TabManager {
	/** TODOC */
	public static readonly tabId = `${Date.now()}-${Math.random()}`;

	/** TODOC */
	private static heartbeatInterval = 0;

	/** TODOC */
	private static readonly heartbeatFrequency: number = 5_000; // every 5 seconds

	/** TODOC */
	private static electionTimeout = 0;

	/** @static ctor */
	public static initialize(): void {
		if (typeof window === "undefined") return;

		// Set up the heartbeat
		this.setTab(true);
		this.heartbeatInterval = window.setInterval(this.sendHeartbeat.bind(this), this.heartbeatFrequency);

		// Set up event listeners
		document.addEventListener("visibilitychange", this.sendHeartbeat.bind(this));
		window.addEventListener("beforeunload", this.onUnload.bind(this));
	}

	/** TODOC */
	public static setTab(master: boolean): void {
		console.info(`OIDC: tab ${this.tabId} (master: ${master})`);
		OIDCGlobals.tabSyncer.push({ id: this.tabId, timestamp: Date.now() });
	}

	/** TODOC */
	private static sendHeartbeat(): void {
		if (document.visibilityState === "visible") {
			this.setTab(true);
		} else {
			const heartbeat = OIDCGlobals.tabSyncer.pull();
			if (heartbeat.id === this.tabId) this.setTab(true);
		}
	}

	/** TODOC */
	private static electMaster(): void {
		// Generate a random delay
		const delay = Math.floor(Math.random() * 1_000); // 1 second max
		window.clearTimeout(this.electionTimeout);
		this.electionTimeout = window.setTimeout(() => {
			const currentHeartbeat = OIDCGlobals.tabSyncer.pull();
			if (!currentHeartbeat || Date.now() - currentHeartbeat.timestamp > this.heartbeatFrequency * 2) {
				// Assume mastership and set heartbeat
				this.setTab(true);
			}
		}, delay);
	}

	/** TODOC */
	public static isActive(): boolean {
		const heartbeat = OIDCGlobals.tabSyncer.pull();
		if (!heartbeat.id) return false;

		// If the current tab is the last known active tab, or if the last heartbeat is old, consider this tab as active.
		if (heartbeat.id === this.tabId) {
			// This is the active tab
			return true;
		}

		// If no active tab has had a heartbeat, start election process.
		if (Date.now() - heartbeat.timestamp > this.heartbeatFrequency * 2) {
			this.electMaster();
		}
		return false;
	}

	/** TODOC */
	public static onUnload(): void {
		// Clear the interval on tab close to stop sending heartbeats
		window.clearInterval(this.heartbeatInterval);
	}
}

TabManager.initialize();
