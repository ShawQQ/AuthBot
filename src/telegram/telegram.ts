import {
	ChatMessageRequest,
	ChatMessageResponse,
	TelegramBot,
	UpdateContext,
	DeleteMessageRequest,
	InviteLink,
	InviteLinkRequest,
	Chat,
	TelegramUser,
} from "./types/telegram";
import { TwitchInstance } from "../twitch/twitch";
import { ApiRequest } from "../utils/web/types/web";
import { apiCall, generateQuery } from "../utils/web/web";
import { Logger } from "tslog";

const log: Logger = new Logger();
/**
* Implementations of core telegram functionality
*/
export class TelegramBotInstance implements TelegramBot {
	static token: string = process.env.TELEGRAM_TOKEN;
	static TELEGRAM_API: string = "api.telegram.org";
	static TELEGRAM_URL: string =
	"api.telegram.org/bot" + TelegramBotInstance.token;
	chatId: BigInt;
	
	/**
	* Receive and handle message sent to the bot
	* @param {UpdateContext} ctx Telegram update object
	*/
	getUpdate(ctx: UpdateContext): void {
		const msg: ChatMessageResponse = ctx.message ?? ctx.edited_message;
		if (!!msg) {
			log.info(msg);
			if (this.checkMessage(msg)) return;
			let botMsg: ChatMessageRequest = null;
			switch (msg.text) {
				case "/start":
				botMsg = {
					chat_id: msg.chat?.id,
					text: "Effettua il login su twitch per confermare di essere abbonato",
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: "Login",
									url:
									"https://" +
									TwitchInstance.OAUTH2_START +
									"&state=" +
									msg.chat?.id
								},
							],
						],
					},
				};
				break;
				default:
				break;
			}
			if (botMsg) {
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
					chat_id: msg.chat?.id,
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
			url: TelegramBotInstance.TELEGRAM_URL + "/createChatInviteLink",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: data,
		};
		return await apiCall<InviteLink>(opt);
	}

	/**
	 * Get Chat from the specified id
	 * @param {BigInt} chatId chat id
	 * @return {Chat} the requested Chat
	 */
	async getChat(chatId: BigInt): Promise<Chat>{
		const opt: ApiRequest = {
			url: TelegramBotInstance.TELEGRAM_URL + "/getChat",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: {
				chat_id: chatId
			},
		}
		const result = await apiCall<{
			result: Chat
		}>(opt);
		return result.result;
	}

	async userInGroup(userId: BigInt): Promise<boolean>{
		const opt: ApiRequest = {
			url: TelegramBotInstance.TELEGRAM_URL + "/getChatMember",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: {
				chat_id: process.env.TELEGRAM_GROUP,
				user_id: userId
			},
		}
		const result = await apiCall<{
			ok: boolean
		}>(opt);
		return result.ok;
	}

	async banUser(userId: BigInt): Promise<void>{
		const query = generateQuery({
			chat_id: process.env.TELEGRAM_GROUP,
			user_id: userId,
			until_date: Date.now() + 1 * 100 * 600,
			revoke_messages: false
		});
		const opt: ApiRequest = {
			url: TelegramBotInstance.TELEGRAM_URL + "/banChatMember?" + query,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		}

		await apiCall<any>(opt);
	}

	/**
	 * Get the user data from the user id
	 * @param {BigInt} userId telegram user id
	 * @returns {Promise<TelegramUser>} telegram user data
	 */
	async getUser(userId: BigInt): Promise<TelegramUser>{
		const opt: ApiRequest = {
			url: TelegramBotInstance.TELEGRAM_URL + "/getChatMember",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			data: {
				chat_id: process.env.TELEGRAM_GROUP,
				user_id: userId
			},
		}

		const result = await apiCall<{
			result: {
				user: TelegramUser
			}
		}>(opt);
		return result.result.user;
	}
}
