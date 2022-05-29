import * as express from "express";
import { apiCall } from "../utils/web/web";
import { ApiRequest } from "../utils/web/types/web";
import {
	ChatMessageRequest,
	TelegramBot,
	UpdateContext,
	InviteLink,
	Chat,
} from "../telegram/types/telegram";
import { TelegramBotInstance } from "../telegram/telegram";
import { Twitch } from "../twitch/types/twitch";
import { TwitchInstance } from "../twitch/twitch";
import { DatabaseFactory } from "../utils/database/db";

const app = express();
const url = require("url");

/**
* Start telegram webhook
*/
export async function setWebHook(): Promise<void> {
	const webHookParam: ApiRequest = {
		url:
		"api.telegram.org/bot" +
		process.env.TELEGRAM_TOKEN +
		"/setWebhook?url=" +
		process.env.URL +
		"/" +
		process.env.TELEGRAM_TOKEN +
		"/getUpdate",
		method: "POST",
	};
	await apiCall<any>(webHookParam);
}

/**
 * Set application routes
 */
export function setRoute(): void {
	app.use(express.json());
	app.listen(process.env.PORT, () => {
		console.log("Bot started on port:" + process.env.PORT);
	});
	
	app.post("/" + process.env.TELEGRAM_TOKEN + "/getUpdate", (req, res) => {
		const telegram: TelegramBot = new TelegramBotInstance();
		const ctx: UpdateContext = req.body;
		telegram.getUpdate(ctx);
	});
	app.post("/completeAdminAuth", (req, res) => {
		console.log("Ups");
	});
	app.get("/auth", async (req, res) => {
		const data = url.parse(req.url, true).query;
		if(!data.state){
			throw new Error("Missing Telegram Chat ID");
		}
		const twitch: Twitch = new TwitchInstance();
		const telegram: TelegramBot = new TelegramBotInstance();
		const chat: Chat = await telegram.getChat(data.state);
		const msg: ChatMessageRequest = {
			chat_id: chat.id,
			text: "",
		};
		const authResult = await twitch.completeAuth(data.code);
		if (authResult.is_sub) {
			const inviteLink: InviteLink = await telegram.createInviteLink({
				chat_id: process.env.TELEGRAM_GROUP as unknown as number,
				expire_date: 0,
				member_limit: 1,
			});
			msg.text = inviteLink.result.invite_link;
			const db = DatabaseFactory.getDatabase();
			db.insert({
				twitch_id: authResult.twitch_id,
				telegram_id: chat.id,
				telegram_handle: chat.username,
				is_vip: false,
			});
		} else {
			msg.text = "Non risulti abbonato";
		}
		telegram.sendMessage(msg);
		const html = require("./views/auth.html").html;
		res.send(html);
	});
}
