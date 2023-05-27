export interface AsyncDataOptions<T> {
	/** Function that returns the promise */
	promiseFactory: () => Promise<T>;

	/** Milliseconds required to pass before allowed to re-invoke promise */
	cooldown: number;

	/** Milliseconds between each automatic re-invocation */
	milliseconds: number;

	/** @inheritdoc */
	onInvoked: (e: Promise<T>) => void;

	/** @inheritdoc */
	onResolved: (e: T) => void;

	/** @inheritdoc */
	onReject: (e: Error) => void;

	/** @param remaining remaining milliseconds */
	onBlockedByCooldown: (remaining: number) => void;
}

/** Manage refreshing of async data */
export class AsyncData<T> {
	/** Function that returns the promise */
	public promiseFactory?: () => Promise<T>;

	/** Milliseconds required to pass before allowed to re-invoke promise */
	public cooldown: number;

	/** When promise was last invoked */
	public lastInvoked?: Date;

	/** Milliseconds between each automatic re-invocation */
	public get milliseconds(): number {
		return this._milliseconds;
	}

	/** Milliseconds between each automatic re-invocation */
	public set milliseconds(value: number) {
		this._milliseconds = value < 0 ? 0 : value; // Clamp to min 0
		if (this._milliseconds === 0) {
			this.stop();
		} else {
			this.start();
		}
	}

	/** @inheritdoc */
	public onInvoked?: (e: Promise<T>) => void;

	/** @inheritdoc */
	public onResolved?: (e: T) => void;

	/** @inheritdoc */
	public onReject?: (e: Error) => void;

	/** */
	public onBlockedByCooldown?: (remaining: number) => void;

	/** Milliseconds between each automatic re-invocation */
	private _milliseconds: number;

	/** */
	private interval = 0;

	/** */
	public constructor(options: Partial<AsyncDataOptions<T>> = {}) {
		this._milliseconds = options.milliseconds ?? 0;
		this.cooldown = options.cooldown ?? 0;
		this.promiseFactory = options.promiseFactory;
		this.onInvoked = options.onInvoked;
		this.onResolved = options.onResolved;
		this.onReject = options.onReject;
		this.onBlockedByCooldown = options.onBlockedByCooldown;
	}

	/** */
	public stop(): AsyncData<T> {
		if (typeof window !== "undefined") window.clearInterval(this.interval);
		this.interval = 0;
		return this;
	}

	/** */
	public start(): AsyncData<T> {
		if (typeof window === "undefined" || this.milliseconds <= 0) return this;

		if (this.interval !== 0) window.clearInterval(this.interval);
		this.interval = window.setInterval(() => this.invoke(), this.milliseconds);
		return this;
	}

	/** Call to re-invoke promise
	 * @param skipOnInvoked Set to true to skip calling `onInvoked` */
	public invoke(skipOnInvoked = false): AsyncData<T> {
		if (typeof window === "undefined" || typeof this.promiseFactory === "undefined") return this;
		if (this.cooldown > 0 && this.lastInvoked) {
			const diff = new Date().getTime() - this.lastInvoked.getTime();
			if (diff < this.cooldown) {
				if (typeof this.onBlockedByCooldown === "function") this.onBlockedByCooldown(this.cooldown - diff);
				else console.info(`Refresh on cooldown (${this.cooldown - diff}ms)`);
				return this;
			}
		}

		const promise = this.promiseFactory();
		if (!skipOnInvoked) this.onInvoked?.(promise);
		promise.then((res) => this.onResolved?.(res)).catch((e) => this.onReject?.(e));

		this.lastInvoked = new Date();
		return this;
	}

	/** */
	public withPromiseFactory(promiseFactory?: () => Promise<T>): AsyncData<T> {
		this.promiseFactory = promiseFactory;
		return this;
	}

	/**
	 * @param fallback The value to return resolved if `promiseFactory` is unavailable
	 * @returns The promise from `promiseFactory` if available. If unavailable and no fallback is provided, rejected promise is returned. */
	public copyPromise(fallback?: T): Promise<T> {
		if (typeof this.promiseFactory !== "function" || typeof window === "undefined") {
			if (typeof fallback === "undefined") return Promise.reject("No fallback provided");
			return Promise.resolve(fallback);
		}
		return this.promiseFactory();
	}
}
