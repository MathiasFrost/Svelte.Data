import { WSClient } from "$lib/ws/index.js";
import { Deserializable, deserialize, Type } from "$lib/http/index.js";
import { WSMessageContainer } from "$lib/ws/WSClient.js";

@Deserializable
class ChatMessage {
	@Type(String)
	public readonly name: string = "";
	@Type(String)
	public readonly text: string = "";
	@Type(Boolean)
	public readonly received: boolean = false;
}

class ChatMessageContainer extends WSMessageContainer {
	public chatMessages(): ChatMessage[] {
		return this.messages().map((message) => deserialize(ChatMessage, { received: message.received, ...(message.arguments[0] as object) }));
	}
}

export class ChatWs extends WSClient<ChatMessageContainer> {
	public constructor() {
		super("ws://localhost:5000/Chat", { container: ChatMessageContainer });
	}

	public async postMessage(text: string): Promise<void> {
		await this.sendMessage("postMessage", text);
	}
}
