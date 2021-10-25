import { RequestParameter } from "./interface/common_interface";
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
			result.on('error', (e: any) => {
				console.log(e);
				handleError(e);
			});
			let body = '';
			result.on('data', (chunk: String) => {
				body += chunk;
			}).on('end', () => {
				try{
					let data = JSON.parse(body);
					cb(data);
				}catch(e){
					console.log(e);
				}
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
}