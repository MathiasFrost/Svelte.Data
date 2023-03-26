import { PUBLIC_BACKEND_URL, PUBLIC_ENVIRONMENT } from "$env/static/public";
import { HttpClient } from "./HttpClient";

/** @static */
export class LogClient {
	/** */
	private static client: HttpClient = new HttpClient(`${PUBLIC_BACKEND_URL}Log/`, "backend");

	/** */
	private static lastMessage = "";

	/** */
	public static async log(logLevel: number, message: string): Promise<void> {
		if (PUBLIC_ENVIRONMENT === "Development" || this.lastMessage === message) return;
		try {
			this.lastMessage = message;
			const form = new FormData();
			form.append("message", message);
			await this.client.post(`Log/${logLevel}`, form);
		} catch (e) {
			console.log(e);
		}
	}

	/** @returns User information */
	public static async notifyIt(userMessage: string, userEmail: string, errorMessage: string): Promise<void> {
		try {
			await this.client.post(`NotifyIt?${new URLSearchParams({ userMessage, errorMessage, userEmail })}`);
		} catch (e) {
			console.log(e);
		}
	}
}
