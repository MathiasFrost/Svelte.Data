import type { Writable } from "svelte/store";

export interface WSClientOptions {}

/** TODOC */
export class WSClient {
	/** Base address for requests made with this client */
	public readonly baseAddress: URL;

	/** @see WSClientOptions */
	private readonly options: Partial<WSClientOptions>;

	/** ctor */
	public constructor(baseAddress = "", options: Partial<WSClientOptions> = {}) {
		this.baseAddress = new URL(baseAddress);
		this.options = options;
	}

	public webSocket: WebSocket | null = null;

	private connectionPromise: Promise<void> | null = null;

	public async connect(): Promise<void> {
		this.connectionPromise ??= this._connect();
		await this.connectionPromise;
	}

	private async _connect(): Promise<void> {
		if (typeof window === "undefined") throw new Error("Cannot connect to WebSockets server-side");

		if (this.webSocket) {
			this.close();
		}

		const negotiateResponse = await fetch(this.baseAddress.toString().replace(/^ws/, "http") + "/negotiate?negotiateVersion=1", { method: "POST" });
		if (!negotiateResponse.ok) throw new Error("Unable to negotiate with WebSocket endpoint");

		const json = await negotiateResponse.json();
		const token = json["connectionToken"];

		this.baseAddress.searchParams.append("id", token);

		this.webSocket = new WebSocket(this.baseAddress);
		this.webSocket.addEventListener("message", this.handleMessage.bind(this));
		this.webSocket.addEventListener("close", (ev) => console.log(ev));
		this.webSocket.addEventListener("error", (ev) => console.warn(ev));
		this.webSocket.addEventListener("open", (ev) => {
			console.log(ev);
			this.webSocket?.send('{"protocol":"json","version":1}');
		});
	}

	public close(): void {
		this.webSocket?.close();
		this.webSocket = null;
	}

	private handleMessage(e: MessageEvent): void {
		try {
			const data = JSON.parse(e.data.substring(0, e.data.length - 1));
			const store = this.stores.get(data.target);
			if (!store) return;
			const deserializer = this.deserializers.get(data.target) || ((json) => JSON.parse(json));
			store.set(deserializer(data.arguments[0]));
		} catch (e) {
			console.warn(e);
		}
	}

	public async send(str: string): Promise<void> {
		await this.connect();
		this.webSocket?.send(`{"type":1,"target":"Ping","arguments":["${str}"]}`);
	}

	private stores: Map<string, Writable<unknown | undefined>> = new Map();
	private deserializers: Map<string, (json: string) => unknown> = new Map();

	public async receive<T>(target: string, deserializer: (json: string) => T): Promise<Writable<T | undefined>> {
		this.deserializers.set(target, deserializer);
		if (this.stores.has(target)) return this.stores.get(target) as Writable<T | undefined>;

		await this.connect();
		const store = customStore<T | undefined>(void 0);
		this.stores.set(target, store);
		return store;
	}
}

function customStore<T>(initialValue: T): Writable<T> {
	let value = initialValue;
	const subscribers: ((value: T) => void)[] = [];

	return {
		set(newValue: T) {
			value = newValue;
			// Notify all subscribers whenever set is called, regardless of whether the value has changed
			subscribers.forEach((s) => s(value));
		},
		update() {},
		subscribe(subscriber: (value: T) => void) {
			subscribers.push(subscriber);
			// Provide the initial value when first subscribing
			subscriber(value);

			return () => {
				// Unsubscribe logic
				const index = subscribers.indexOf(subscriber);
				if (index !== -1) {
					subscribers.splice(index, 1);
				}
			};
		}
	};
}
