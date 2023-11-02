import type { Serializer } from "$lib/types/Serializer.js";
import { Syncer } from "./Syncer.js";
import type { TimeSpan } from "$lib/date/TimeSpan.js";

/** Cookie options */
export interface ICookieOptions {
	/** Domain to set on cookie */
	domain?: string;

	/** Expire time to set on cookie. Leave empty for session cookies */
	expires?: Date;

	/** How long the cookie will last after updated */
	maxAge?: TimeSpan;

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
}

/** Sync values to `document.cookie` */
export class CookieSyncer<T> extends Syncer<T> implements ICookieOptions {
	/** Domain to set on cookie */
	public domain?: string;

	/** Expire time to set on cookie. Leave empty for session cookies */
	public expires?: Date;

	/** Hwo long it will last after set */
	public maxAge?: TimeSpan;

	/** Set cookie to HostOnly */
	public hostOnly?: boolean;

	/** Set cookie to HttpOnly */
	public httpOnly?: boolean;

	/** Set cookie to HttpOnly */
	public path?: string;

	/** Cookie SameSite policy. Default = 'None' */
	public sameSite?: "Lax" | "Strict" | "None";

	/** Set cookie to secure. Default true */
	public secure?: boolean;

	/** Replicate data to `cookie`
	 * @param name Name of `cookie`
	 * @param fallback Value used when we are unable to retrieve value from cookies
	 * @param serializer TODOC
	 * @param options Optional parameters */
	public constructor(name: string, fallback: T, options: Partial<ICookieOptions> = {}, serializer?: Serializer<T>) {
		super(name, fallback, serializer);
		this.domain = options?.domain;
		this.expires = options?.expires;
		this.hostOnly = options?.hostOnly;
		this.httpOnly = options?.httpOnly;
		this.path = options?.path;
		this.sameSite = options?.sameSite;
		this.secure = options?.secure;
	}

	/** @inheritdoc */
	protected get storageName(): string {
		return "cookies";
	}

	/** @inheritdoc */
	public override pull(): T {
		if (typeof document === "undefined") return this.fallback;

		const str = document.cookie
			.split("; ")
			.find((row) => row.startsWith(`${this.key}=`))
			?.split("=")[1];
		if (typeof str === "undefined") return this.fallback;

		return this.deserialize(str);
	}

	/** @inheritdoc */
	public override push(value: T): void {
		if (typeof document === "undefined") return;

		const str = this.serializer.serialize(value);
		const cookieComponents: string[] = [`${encodeURI(str)}`];
		if (this.sameSite) cookieComponents.push(`SameSite=${this.sameSite}`);
		if (this.domain) cookieComponents.push(`Domain=${this.domain}`);
		if (this.secure) cookieComponents.push("Secure");
		if (this.expires) cookieComponents.push(`Expires=${this.expires.toUTCString()}`);
		else if (this.maxAge) cookieComponents.push(`Expires=${new Date(Date.now() + this.maxAge.totalMilliseconds)}`);
		if (this.hostOnly) cookieComponents.push("HostOnly");
		if (this.httpOnly) cookieComponents.push("HttpOnly");
		if (this.path) cookieComponents.push(`Path=${this.path}`);

		document.cookie = `${this.key}=${cookieComponents.join("; ")}`;
	}

	/** @inheritdoc */
	public override clear(): void {
		if (typeof document === "undefined") return;
		document.cookie = `${this.key}=; SameSite=Strict; Max-Age=0`;
	}
}
