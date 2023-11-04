import { CookieSyncer } from "$lib/sync/CookieSyncer.js";
import { TimeSpan } from "$lib/date/TimeSpan.js";
import { stringSerializer } from "$lib/types/Serializer.js";

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
	public static readonly tabSyncer = new CookieSyncer<{ id: string; timestamp: number }>("OIDC_Tab", { id: "", timestamp: 0 }, { sameSite: "Strict" });

	/** Interval for checking validity regularly */
	public static isValidIntervals: Record<string, number> = {};

	/** TODOC */
	public static addIfNotExists(audience: string, name: string): void {
		OIDCGlobals.cookieSyncers[audience] ??= new CookieSyncer(name, "", { sameSite: "Strict", maxAge: new TimeSpan(0, 1, 0, 0, 0, 0) }, stringSerializer());
	}
}
