import { type Invalidator, type Readable, type Subscriber, type Unsubscriber, type Writable, writable } from "svelte/store";
import { indefinitePromise } from "$lib/utils/async.js";
import { WSMessage } from "$lib/ws/WSMessage.js";

export class WSMessageContainer {
	private readonly _messages: WSMessage[];
	public constructor(messages: WSMessage[]) {
		this._messages = messages;
	}
	public messages(target?: string): WSMessage[] {
		if (!target) return this._messages;
		return this._messages.filter((message) => message.target === target);
	}
	public messagesTo(target?: string): WSMessage[] {
		if (!target) return this._messages.filter((message) => !message.received);
		return this._messages.filter((message) => message.target === target && !message.received);
	}
	public messagesFrom(target?: string): WSMessage[] {
		if (!target) return this._messages.filter((message) => message.received);
		return this._messages.filter((message) => message.target === target && message.received);
	}
}

/** TODOC */
export interface WSClientOptions<TContainer extends WSMessageContainer> {
	/** Don't */
	readonly silentRetry?: boolean;

	readonly container: new (messages: WSMessage[]) => TContainer;
}

/** TODOC */
export class WSClient<TContainer extends WSMessageContainer = WSMessageContainer> implements Readable<TContainer> {
	/** Base address for requests made with this client */
	public readonly baseAddress: URL;

	/** TODOC */
	public webSocket: WebSocket | null = null;

	/** @see WSClientOptions */
	private readonly options: WSClientOptions<TContainer>;

	/** TODOC */
	private connectionPromise: Promise<void> | null = null;

	/** TODOC */
	private pingInterval = 0;

	/** TODOC */
	private store: Writable<TContainer>;

	public connecting: Promise<Event>;

	private resolve: (e: Event) => void = () => {};

	private reject: (reason?: unknown) => void = () => {};

	/** ctor */
	public constructor(
		baseAddress = "",
		options: WSClientOptions<TContainer> = { container: WSMessageContainer as new (messages: WSMessage[]) => TContainer }
	) {
		this.baseAddress = new URL(baseAddress);
		this.options = options;
		this.store = writable<TContainer>(new this.options.container([]));
		this.connecting = new Promise<Event>((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
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
	public async sendMessage(target: string, ...args: unknown[]): Promise<void> {
		await this.connect();
		const data = `{"type":1,"target":"${target}","arguments":${JSON.stringify(args)}}`;
		this.webSocket?.send(data);

		const message = new WSMessage(data, false);
		this.store.update((prev) => new this.options.container([...prev.messages(), message]));
	}

	/** TODOC */
	private async _connect(): Promise<void> {
		if (typeof window === "undefined") {
			await indefinitePromise<never>();
		}

		if (this.webSocket) {
			this.close();
		}

		const negotiateResponse = await window.fetch(this.baseAddress.toString().replace(/^ws/, "http") + "/negotiate?negotiateVersion=1", { method: "POST" });
		if (!negotiateResponse.ok) throw new Error("Unable to negotiate with WebSocket endpoint");

		const json = await negotiateResponse.json();
		const token = json["connectionToken"];

		const baseAddress = new URL(this.baseAddress);
		baseAddress.searchParams.append("id", token);

		this.webSocket = new WebSocket(baseAddress);
		this.webSocket.addEventListener("message", this.receiveMessage.bind(this));
		this.webSocket.addEventListener("close", this.connectionClosed.bind(this));
		this.webSocket.addEventListener("error", this.connectionError.bind(this));
		this.webSocket.addEventListener("open", this.connectionOpen.bind(this));
	}

	private connectionClosed(e: CloseEvent): void {
		console.info(`${this.baseAddress}: WebSocket closed with code ${e.code}`);
	}

	private connectionError(e: Event): void {
		this.reject(e);
	}

	public connectionOpen(e: Event): void {
		console.log(e);
		this.resolve(e);
		console.info(`${this.baseAddress}: WebSocket connected, switching to JSON protocol`);
		this.webSocket?.send('{"protocol":"json","version":1}');
		this.pingInterval = window.setInterval(() => this.webSocket?.send('{"type":6}'), 15_000);
	}

	/** TODOC */
	private receiveMessage(e: MessageEvent): void {
		const data = new WSMessage(e.data, true);
		this.store.update((prev) => new this.options.container([...prev.messages(), data]));
	}

	/** @inheritdoc */
	public subscribe(run: Subscriber<TContainer>, invalidate?: Invalidator<TContainer>): Unsubscriber {
		return this.store.subscribe(run, invalidate);
	}
}
