import { Telegram } from "../../telegram/app";
import { Twitch } from "../../twitch/app";
import { RequestParameter } from "../interface/common_interface";
import { Utils } from "../utils";

const express = require('express');
const app = express();

export abstract class Router{
	private static telegram: Telegram = new Telegram();
	private static twitch: Twitch = new Twitch();

	public static setRoute(){
		this.setPost();
		this.setGet();
		this.setWebhook();
		app.listen(Utils.getConConst().port, () => {
			console.log(`Started`);
		});
	}

	private static setPost(){
		app.post(Utils.getTelegramConst().update_url, Router.telegram.getUpdate);
		app.post('/finalizeRequest', Router.telegram.finalize);
		app.post('/completeAuth', Router.twitch.completeAuth);
		app.post('/completeAdminAuth', Router.twitch.confirmAdminAuth);
	}

	private static setGet(){
		app.get('/auth', Router.telegram.confirmAuth);
		app.get("/adminAuth", Router.twitch.adminAuth);
	}

	private static setWebhook(){
		let telegramWebhookParameter: RequestParameter = {
			host: Utils.getTelegramConst().api_host,
			path: "/bot"+Utils.getTelegramConst().token+'/setWebhook?url='+"https://"+Utils.getConConst().base_url+Utils.getTelegramConst().update_url,
			method: 'POST'
		};
		Utils.send(telegramWebhookParameter);
	}
}