import {Syncer, type SyncerOptions} from "./Syncer";

export type CookieSyncerOptions<T> = SyncerOptions<T> & {
	/** Domain to set on cookie */
	domain?: string;

	/** Expire time to set on cookie. Leave empty for session cookies */
	expires?: Date;

	/** Set cookie to HostOnly */
	hostOnly?: boolean;

	/** Set cookie to HttpOnly */
	httpOnly?: boolean;

	/** Set cookie to HttpOnly */
	path?: string;

	/** Cookie SameSite policy. Default = 'None' */
	sameSite?: "Lax" | "Strict" | "None";

	/** Set cookie to secure. Default true */
	secure?: boolean;
};

export class CookieSyncer<T> extends Syncer<T> {
	public name: string;

	public domain?: string;

	public expires?: Date;

	public hostOnly?: boolean;

	public httpOnly?: boolean;

	public path?: string;

	public sameSite?: "Lax" | "Strict" | "None";

	public secure?: boolean;

	public constructor(name: string, options?: CookieSyncerOptions<T>) {
		super(options);
		this.name = name;
		this.domain = options?.domain;
		this.expires = options?.expires;
		this.hostOnly = options?.hostOnly;
		this.httpOnly = options?.httpOnly;
		this.path = options?.path;
		this.sameSite = options?.sameSite ?? "None";
		this.secure = options?.secure ?? true;
	}

	public override get(fallback: T): T;
	public override get(fallback?: T): T | undefined {
		try {
			const cookies = typeof document === "undefined" ? null : document.cookie;
			if (cookies) {
				const str = document.cookie
					.split("; ")
					.find((row) => row.startsWith(`${this.name}=`))
					?.split("=")[1];

				if (typeof str !== "undefined") {
					return this.deserializer?.(str) ?? JSON.parse(str);
				}
			} else if (typeof this.serverValue !== "undefined") {
				return this.serverValue;
			}
		} catch (e) {
			console.error(e);
		}
		return typeof fallback === "undefined" ? void 0 : fallback;
	}

	public override sync(value: T): boolean {
		const cookies = typeof document === "undefined" ? null : document.cookie;
		if (cookies) {
			const str = this.serializer?.(value) ?? JSON.stringify(value);
			const cookieComponents: string[] = [`${encodeURI(str)}`, `SameSite=${this.sameSite}`];
			if (this.domain) cookieComponents.push(`Domain=${this.domain}`);
			if (this.secure) cookieComponents.push("Secure");
			if (this.expires) cookieComponents.push(`Expires=${this.expires.toUTCString()}`);
			if (this.hostOnly) cookieComponents.push("HostOnly");
			if (this.httpOnly) cookieComponents.push("HttpOnly");
			if (this.path) cookieComponents.push(`Path=${this.path}`);

			document.cookie = `${this.name}=${cookieComponents.join("; ")}`;
		}
		return false;
	}
}
