import { CookieSyncer, LocalStorageSyncer } from "$lib/sync";
import { TimeSpan } from "$lib/date";
import { stringSerializer } from "$lib/types";

/** @static */
export class OIDCGlobals {
	/** Queue of iframe sign in requests */
	public static readonly iFramePromises: { audience: string; promise: Promise<void> }[] = [];

	/** Authorities that has failed iframe sign in */
	public static readonly iFrameRejections: string[] = [];

	/** References to active refresh_tokens exchange requests per refresh_token */
	public static readonly refreshPromises: { [key: string]: Promise<number | null> } = {};

	/** Store resolves from suspending user interaction sign ins from `getOidcMessage` */
	public static resolves: { audience: string; resolve: (expiresIn: number) => void }[] = [];

	/** Store rejects from suspending user interaction sign ins from `getOidcMessage` */
	public static rejects: { audience: string; reject: () => void }[] = [];

	/** TODOC */
	public static readonly cookieSyncers = {} as Record<string, CookieSyncer<string>>;

	/** TODOC */
	public static readonly tabSyncer = new LocalStorageSyncer<boolean[]>("OIDC_Tabs", []);

	/** Interval for checking validity regularly */
	public static isValidIntervals: Record<string, number> = {};

	/** TODOC */
	public static get tabActive() {
		return OIDCGlobals.tabSyncer.pull()[this.tabIndex];
	}

	/** TODOC */
	public static tabIndex = 0;

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
	public static addIfNotExists(audience: string, name: string): void {
		OIDCGlobals.cookieSyncers[audience] ??= new CookieSyncer(name, "", { sameSite: "Strict", maxAge: new TimeSpan(0, 1, 0, 0, 0, 0) }, stringSerializer());
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
OIDCGlobals.initialize();
