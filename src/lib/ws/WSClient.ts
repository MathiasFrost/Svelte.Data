import { type Writable, writable } from "svelte/store";
import { indefinitePromise } from "$lib/async";
import { WSMessage } from "$lib/ws/WSMessage";

/** TODOC */
export interface WSClientOptions {}

/** TODOC */
export class WSClient {
	/** Base address for requests made with this client */
	public readonly baseAddress: URL;

	/** TODOC */
	public webSocket: WebSocket | null = null;

	/** @see WSClientOptions */
	private readonly options: Partial<WSClientOptions>;

	/** TODOC */
	private connectionPromise: Promise<void> | null = null;

	/** TODOC */
	private pingInterval = 0;

	/** TODOC */
	private stores: Map<string, Writable<WSMessage | null>> = new Map();

	/** ctor */
	public constructor(baseAddress = "", options: Partial<WSClientOptions> = {}) {
		this.baseAddress = new URL(baseAddress);
		this.options = options;
	}

	/** TODOC */
	public async connect(): Promise<void> {
		this.connectionPromise ??= this._connect();
		await this.connectionPromise;
	}

	/** TODOC */
	public close(): void {
		if (typeof window !== "undefined") {
			window.clearInterval(this.pingInterval);
		}
		this.webSocket?.close();
		this.webSocket = null;
	}

	/** TODOC */
	public async send(target: string, ...args: unknown[]): Promise<void> {
		await this.connect();
		this.webSocket?.send(`{"type":1,"target":"${target}","arguments":${JSON.stringify(args)}}`);
	}

	/** TODOC */
	public async receive(target: string): Promise<Writable<WSMessage | null>> {
		if (this.stores.has(target)) return this.stores.get(target) as Writable<WSMessage | null>;

		await this.connect();
		const store = writable<WSMessage | null>(null);
		this.stores.set(target, store);
		return store;
	}

	/** TODOC */
	private async _connect(): Promise<void> {
		if (typeof window === "undefined") {
			await indefinitePromise<never>();
		}

		if (this.webSocket) {
			this.close();
		}

		const negotiateResponse = await fetch(this.baseAddress.toString().replace(/^ws/, "http") + "/negotiate?negotiateVersion=1", { method: "POST" });
		if (!negotiateResponse.ok) throw new Error("Unable to negotiate with WebSocket endpoint");

		const json = await negotiateResponse.json();
		const token = json["connectionToken"];

		const baseAddress = new URL(this.baseAddress);
		baseAddress.searchParams.append("id", token);

		this.webSocket = new WebSocket(baseAddress);
		this.webSocket.addEventListener("message", this.handleMessage.bind(this));
		this.webSocket.addEventListener("close", (ev) => console.info(`${this.baseAddress}: WebSocket closed with code ${ev.code}`));
		this.webSocket.addEventListener("error", (ev) => console.error(ev));
		this.webSocket.addEventListener("open", () => {
			console.info(`${this.baseAddress}: WebSocket connected, switching to JSON protocol`);
			this.webSocket?.send('{"protocol":"json","version":1}');
			this.pingInterval = window.setInterval(() => this.webSocket?.send('{"type":6}'), 15_000);
		});
	}

	/** TODOC */
	private handleMessage(e: MessageEvent): void {
		const data = new WSMessage(e.data);
		const store = this.stores.get(data.target);
		if (!store) return;
		store.set(data);
	}
}
