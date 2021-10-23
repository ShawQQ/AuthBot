const telegram = require('../telegram/app');
const twitch = require('../twitch/app');
const constants = require('./constant');
const request = require('./request');
const express = require('express');
const app = express();

export class Router{
	public static setRoute(){
		this.setPost();
		this.setGet();
		this.setWebhook();
		app.listen(constants.connection.port, () => {
			console.log(`Started`);
		});
	}

	private static setPost(){
		app.post(constants.telegram.update_url, telegram.getUpdate);
		app.post('/finalizeRequest', telegram.finalize);
		app.post('/completeAuth', twitch.completeAuth);
		app.post('/completeAdminAuth', twitch.confirmAdminAuth);
	}

	private static setGet(){
		app.get('/auth', telegram.confirmAuth);
		app.get("/adminAuth", twitch.adminAuth);
	}

	private static setWebhook(){
		let telegramWebhookParameter = {
			host: constants.telegram.api_host,
			path: "/bot"+constants.telegram.token+'/setWebhook?url='+"https://"+constants.connection.base_url+constants.telegram.update_url,
			method: 'POST'
		};
		request.send(telegramWebhookParameter);
	}
}