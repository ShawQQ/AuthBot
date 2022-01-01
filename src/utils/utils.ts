import { RequestParameter } from "./interface/common_interface";
import { Telegram } from "./../../src/telegram/app";
import { Twitch } from "./../../src/twitch/app";
import { DatabaseFactory } from "./database/db";
import { Database } from "./database/interfaces";
import 'dotenv/config';
const https = require('https');

export abstract class Utils{
	private static constants = {
		telegram: {
			token: process.env.TELEGRAM_TOKEN,
			group: process.env.TELEGRAM_GROUP,
			api_host: "api.telegram.org",
			base_url: '/bot'+process.env.TELEGRAM_TOKEN,
			update_url: '/'+process.env.TELEGRAM_TOKEN+'/getUpdate'
		},
		twitch: {
			client_id: process.env.TWITCH_CLIENT_ID,
			client_secret: process.env.TWITCH_CLIENT_SECRET,
			oauth2_uri: process.env.OAUTH2_URI,
			oauth2_admin_complete: process.env.OAUTH2_ADMIN_COMPLETE,
			oauth2_complete: process.env.OAUTH2_COMPLETE,
			user: process.env.USER,
			oauth2_param: {
				host: "id.twitch.tv",
				path: "/oauth2/authorize?client_id="+process.env.TWITCH_CLIENT_ID+'&redirect_uri='+process.env.OAUTH2_URI+'&response_type=code&scope=user:read:subscriptions&prompt=none',
			},
			adminOauthUrl: "https://id.twitch.tv/oauth2/authorize?client_id="+process.env.TWITCH_CLIENT_ID+'&redirect_uri='+process.env.OAUTH2_ADMIN_URI+'&response_type=code&scope=channel:read:subscriptions&prompt=none'
		},
		connection: {
			base_url: process.env.URL,
			port: process.env.PORT
		}
	}

	public static getTelegramConst(){
		return this.constants.telegram;
	}

	public static getTwitchConst(){
		return this.constants.twitch;
	}

	public static getConConst(){
		return this.constants.connection;
	}

	public static send(reqParam?: RequestParameter, reqBody?: any, cb: (data?: any) => any = () => {}, handleError: (e: any) => any = () => {}){
		let req = https.request(reqParam, (result: any) => {
			result.setEncoding('utf-8');
			let body = '';
			result.on('data', (chunk: String) => {
				body += chunk;
			}).on('end', () => {
				try{
					let data = JSON.parse(body);
					cb(data);
				}catch(e){
					console.log(body);
					console.log(e);
				}
			}).on('error', (e: any) => {
				console.log(e);
				handleError(e);
			});
		});
		if(reqBody){
			req.write(JSON.stringify(reqBody));
		}
		req.end();
	}

	public static generateQuery(queryArg: any): string {
		return new URLSearchParams(queryArg).toString();
	}

	public static async autoban(){
		console.log("Inizio ban gruppo telegram");
		const telegram: Telegram = new Telegram();
		const twitch: Twitch = new Twitch();
		const db: Database = DatabaseFactory.getDatabase();

		try{
			let users = await twitch.getCurrentSubs();
			let currentUser = await db.getUsers();
			let toBan = [];
			
			for(const current of currentUser){
				let ban = true;
				for(const id of users){
					if(id == current.twitch_id){
						ban = false;
						break;
					}
				}
				if(ban){
					toBan.push(current.telegram_id);
				}
			}
			console.log(toBan);
			telegram.banUsers(toBan);
			await db.close();
		}catch(e){
			console.error("Autoban error: "+e);
		}
		console.log("Fine ban gruppo telegram");
	}
}