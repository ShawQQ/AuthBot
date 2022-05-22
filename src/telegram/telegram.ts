import {
	ChatMessageRequest,
	ChatMessageResponse,
	TelegramBot,
	UpdateContext,
	DeleteMessageRequest,
	InviteLink,
	InviteLinkRequest,
} from "./types/telegram";
import { TwitchInstance } from "../twitch/twitch";
import { ApiRequest } from "../utils/web/types/web";
import { apiCall } from "../utils/web/web";
require("dotenv");

/**
* Implementations of core telegram functionality
*/
export class TelegramBotInstance implements TelegramBot {
	static token: string = process.env.TELEGRAM_TOKEN;
	static TELEGRAM_API: string = "api.telegram.org";
	static TELEGRAM_URL: string =
	"api.telegram.org/bot" + TelegramBotInstance.token;
	chatId: number;
	
	/**
	* Receive and handle message sent to the bot
	* @param {UpdateContext} ctx Telegram update object
	*/
	getUpdate(ctx: UpdateContext): void {
		const msg: ChatMessageResponse = ctx.message ?? ctx.edited_message;
		if (msg !== null) {
			if (this.checkMessage(msg)) return;
			let botMsg: ChatMessageRequest = null;
			switch (msg.text) {
				case "/start":
				botMsg = {
					chat_id: msg.sender_chat?.id,
					text: "Effettua il login su twitch per confermare di essere abbonato",
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: "Login",
									url:
									"https://" +
									TwitchInstance.OAUTH2_START +
									"&chat_id=" +
									msg.sender_chat?.id,
								},
							],
						],
					},
				};
				break;
				default:
				break;
			}
			if (botMsg != null) {
				this.sendMessage(botMsg);
			}
		}
	}
	
	/**
	* Check if the msg contains any banned words 
	* @param {ChatMessageResponse} msg Message received
	* @return {boolean} true if the message is deleted, false otherwise
	*/
	checkMessage(msg: ChatMessageResponse): boolean {
		const banned: Array<string> = require("./utils/word.json");
		let deleted = false;
		for (const word of banned) {
			if (msg.text.toLocaleLowerCase().includes(word)) {
				this.deleteMessage({
					message_id: msg.message_id,
					chat_id: msg.sender_chat?.id,
				});
				deleted = true;
				break;
			}
		}
		return deleted;
	}
	
	/**
	* Send a message
	* @param {ChatMessageRequest}msg Message to send
	* @return {void}
	*/
	sendMessage(msg: ChatMessageRequest): void {
		const opt: ApiRequest = {
			url: TelegramBotInstance.TELEGRAM_URL + "/sendMessage",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: msg,
		};
		apiCall<ChatMessageResponse>(opt);
	}
	
	/**
	* Delete a messsage
	* @param {DeleteMessageRequest} msg Message to delete
	* @return {void}
	*/
	deleteMessage(msg: DeleteMessageRequest): void {
		const opt: ApiRequest = {
			url: TelegramBotInstance.TELEGRAM_URL + "/deleteMessage",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: msg,
		};
		apiCall<ChatMessageResponse>(opt);
	}
	
	/**
	* Create a new invite link for the specified group
	* @param {InviteLinkRequest} data InviteLink options
	* @return {Promise<InviteLink>} new invite link
	*/
	async createInviteLink(data: InviteLinkRequest): Promise<InviteLink> {
		const opt: ApiRequest = {
			url: TelegramBotInstance.TELEGRAM_URL + "/deleteMessage",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: data,
		};
		return await apiCall<InviteLink>(opt);
	}
}
