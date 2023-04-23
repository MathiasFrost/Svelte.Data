import type { ITransformer } from "$lib/types/ITransformer.js";
import { Syncer } from "./Syncer.js";

/** Cookie options */
export interface ICookieOptions {
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
}

/** Replicate data to `cookie` */
export class CookieSyncer<T> extends Syncer<T> implements ICookieOptions {
	/** @inheritdoc */
	protected get storageName(): string {
		return "cookies";
	}

	/** Domain to set on cookie */
	public domain?: string;

	/** Expire time to set on cookie. Leave empty for session cookies */
	public expires?: Date;

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
	 * @param options Optional parameters */
	public constructor(name: string, fallback: T, options: Partial<ICookieOptions> = {}, transformer?: ITransformer<T>) {
		super(name, fallback, transformer);
		this.domain = options?.domain;
		this.expires = options?.expires;
		this.hostOnly = options?.hostOnly;
		this.httpOnly = options?.httpOnly;
		this.path = options?.path;
		this.sameSite = options?.sameSite;
		this.secure = options?.secure;
	}

	/** @inheritdoc */
	public override pull(): T {
		if (typeof document === "undefined") return this.fallback;

		const str = document.cookie
			.split("; ")
			.find((row) => row.startsWith(`${this.key}=`))
			?.split("=")[1];
		if (typeof str === "undefined") return this.fallback;

		return this.transformer.deserialize(str);
	}

	/** @inheritdoc */
	public override push(value: T): void {
		if (typeof document === "undefined") return;

		const str = this.transformer.serialize(value);
		const cookieComponents: string[] = [`${encodeURI(str)}`];
		if (this.sameSite) cookieComponents.push(`SameSite=${this.sameSite}`);
		if (this.domain) cookieComponents.push(`Domain=${this.domain}`);
		if (this.secure) cookieComponents.push("Secure");
		if (this.expires) cookieComponents.push(`Expires=${this.expires.toUTCString()}`);
		if (this.hostOnly) cookieComponents.push("HostOnly");
		if (this.httpOnly) cookieComponents.push("HttpOnly");
		if (this.path) cookieComponents.push(`Path=${this.path}`);

		document.cookie = `${this.key}=${cookieComponents.join("; ")}`;
	}

	/** @inheritdoc */
	public override clear(): void {
		if (typeof document === "undefined") return;
		document.cookie = `${this.key}=; Max-Age=0`;
	}
}
