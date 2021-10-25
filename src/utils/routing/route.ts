import { Router } from "./router";
import { Telegram } from "../../telegram/app";
import { Twitch } from "../../twitch/app";
import { RequestParameter } from "../interface/common_interface";
import { Utils } from "../utils";

const express = require('express');
const app = express();

class BaseRouter implements Router{
	private telegram: Telegram;
	private twitch: Twitch;

	constructor(){
		this.telegram = new Telegram();
		this.twitch = new Twitch();
	}
	
	public setRoute(){
		this.setPost();
		this.setGet();
		this.setWebhook();
		app.listen(Utils.getConConst().port, () => {
			console.log(`Started`);
		});
	}

	private setPost(){
		app.post(Utils.getTelegramConst().update_url, this.telegram.getUpdate.bind(this.telegram));
		app.post('/finalizeRequest', this.telegram.finalize.bind(this.telegram));
		app.post('/completeAuth', this.twitch.completeAuth.bind(this.twitch));
		app.post('/completeAdminAuth', this.twitch.confirmAdminAuth.bind(this.twitch));
	}

	private setGet(){
		app.get('/auth', this.telegram.confirmAuth.bind(this.telegram));
		app.get("/adminAuth", this.twitch.adminAuth.bind(this.twitch));
	}

	private setWebhook(){
		let telegramWebhookParameter: RequestParameter = {
			host: Utils.getTelegramConst().api_host,
			path: "/bot"+Utils.getTelegramConst().token+'/setWebhook?url='+"https://"+Utils.getConConst().base_url+Utils.getTelegramConst().update_url,
			method: 'POST'
		};
		Utils.send(telegramWebhookParameter);
	}
}

export abstract class RouterFactory{
	private static router: Router;

	public static getRouter(): Router{
		if(this.router === undefined){
			this.router = new BaseRouter();
		}
		return this.router;
	}
}