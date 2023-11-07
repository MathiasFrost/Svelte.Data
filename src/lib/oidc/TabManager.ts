import { OIDCGlobals } from "$lib/oidc/OIDCGlobals.js";
import type { Cookies } from "@sveltejs/kit";

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
	public static setTab(master: boolean, cookies?: Cookies): void {
		console.info(`OIDC: tab ${this.tabId} (master: ${master})`);
		OIDCGlobals.tabSyncer.push({ id: this.tabId, timestamp: Date.now() }, cookies);
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
	private static serverElectionTimeout: NodeJS.Timeout | null = null;

	/** TODOC */
	private static setTimeout(callback: () => void, delay: number): void {
		if (typeof window === "undefined") {
			if (this.serverElectionTimeout) clearTimeout(this.serverElectionTimeout);
			this.serverElectionTimeout = setTimeout(callback, delay);
		} else {
			window.clearTimeout(this.electionTimeout);
			this.electionTimeout = window.setTimeout(callback, delay);
		}
	}

	/** TODOC */
	private static electMaster(cookies?: Cookies): void {
		// Generate a random delay
		const delay = Math.floor(Math.random() * 1_000); // 1 second max
		this.setTimeout(() => {
			const currentHeartbeat = OIDCGlobals.tabSyncer.pull(cookies);
			if (!currentHeartbeat || Date.now() - currentHeartbeat.timestamp > this.heartbeatFrequency * 2) {
				// Assume mastership and set heartbeat
				this.setTab(true);
			}
		}, delay);
	}

	/** TODOC */
	public static isActive(cookies?: Cookies): boolean {
		const heartbeat = OIDCGlobals.tabSyncer.pull(cookies);
		if (!heartbeat.id) {
			return typeof window === "undefined";
		}

		// If the current tab is the last known active tab, or if the last heartbeat is old, consider this tab as active.
		if (heartbeat.id === this.tabId) {
			// This is the active tab
			return true;
		}

		// If no active tab has had a heartbeat, start election process.
		if (Date.now() - heartbeat.timestamp > this.heartbeatFrequency * 2) {
			this.electMaster(cookies);
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
