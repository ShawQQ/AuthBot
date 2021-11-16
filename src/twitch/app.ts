import { Telegram } from "../telegram/app";
import { DatabaseFactory } from "../utils/database/db";
import { AccessToken, Database } from "../utils/database/interfaces";
import { RequestParameter } from "../utils/interface/common_interface";
import { Utils } from "../utils/utils";
import { html } from "./views/confirm.html";
const url = require('url');
const path = require('path');

interface UserAuthToken{
	creationDate: number,
	expires: number,
	token: String
};

export class Twitch{
	twitch_const = Utils.getTwitchConst();
	db: Database = DatabaseFactory.getDatabase();
	authToken: UserAuthToken;

	constructor(){
		this.authToken = {
			creationDate: 0,
			expires: 0,
			token: ""
		};
	}
	
	public async getUser(username: String): Promise<number>{
		await this.updateAuthToken();
		let queryParam: String = Utils.generateQuery({
			login: username
		});
		let userParam: RequestParameter = {
			host: "api.twitch.tv",
			path: "helix/users?"+queryParam,
			method: 'GET',
			headers: {
				"Client-ID": this.twitch_const.client_id,
				"Authorization": "Bearer "+ this.authToken.token
			}
		}
		return this._getUser(userParam);
	}

	public async getUserFromToken(access_token: AccessToken): Promise<number>{
		let reqParam: RequestParameter = {
			host: "api.twitch.tv",
			path: "/helix/users",
			headers: {
				"Content-Type": "application/json",
				"Client-ID": this.twitch_const.client_id,
				"Authorization": "Bearer "+ access_token.access
			},
			method: "GET"
		}
		return this._getUser(reqParam);
	}

	public completeAuth(req: any, res: any){
		req.setEncoding('utf-8');
		req.on('data', (d: string) => {
			try{
				let data: any = JSON.parse(d);
				let queryParam = Utils.generateQuery({
					client_id: this.twitch_const.client_id,
					client_secret: this.twitch_const.client_secret,
					code: data.code,
					grant_type: 'authorization_code',
					redirect_uri: this.twitch_const.oauth2_complete
				});
				let authParam: RequestParameter = {
					host: "id.twitch.tv",
					path: "/oauth2/token?"+ queryParam,
					method: 'POST',
				}
				Utils.send(authParam, {}, (data: any) => this.checkUserSub(data.access_token));
			}catch(e){
				console.log(e);
			}
		});
		req.on('error', (e: any) => {
			console.log(e)
		});
		res.send("");
	}

	public adminAuth = (req: any, res: any) => {
		req.setEncoding('utf-8');
		let data = url.parse(req.url, true).query;
		let authParam: RequestParameter = {
			host: Utils.getConConst().base_url,
			path: "/completeAdminAuth",
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}};
		let authBody = {
			code: data.code
		};
		Utils.send(authParam, authBody);
		res.sendFile(html);
	}
	
	public confirmAdminAuth = (req: any, res: any) => {
		req.setEncoding('utf-8');
		req.on('data', (d: string) => {
			try{
				let data = JSON.parse(d);
				let queryParam: String = Utils.generateQuery({
					client_id: this.twitch_const.client_id,
					client_secret: this.twitch_const.client_secret,
					code: data.code,
					grant_type: 'authorization_code',
					redirect_uri: this.twitch_const.oauth2_admin_complete
				})
				let authParam = {
					host: "id.twitch.tv",
					path: "/oauth2/token?" + queryParam,
					method: 'POST',
				}
				Utils.send(authParam, {}, async (data: any) => {
					let token: AccessToken = {
						access: data.access_token,
						refresh: data.refresh_token
					};
					await this.db.updateAccessToken(token);
				});
			}catch(e){
				console.log(e);
			}
		});
		req.on('error', (e: any) => {
			console.log(e)
		});
		res.send("");
	}

	public async updateAdminToken(){
		let oldToken: AccessToken = await this.db.getCurrentToken();
		if(oldToken === undefined) throw new Error("Token non disponibile");
		let queryParam: String = Utils.generateQuery({
			grant_type: 'refresh_token',
			refresh_token: oldToken.refresh,
			client_id: this.twitch_const.client_id,
			client_secret: this.twitch_const.client_secret,

		})
		var updateParam = {
			host: "id.twitch.tv",
			path: "/oauth2/token?" + queryParam,
			method: 'POST',
		}
		Utils.send(updateParam, {}, async (data) => {
			let token: AccessToken = {
				access: data.access_token,
				refresh: data.refresh_token
			};
			await this.db.updateAccessToken(token);
		});
	}

	public async getCurrentSubs(){
		await this.updateAdminToken();
		let token: AccessToken = await this.db.getCurrentToken();
		if(token === undefined) throw new Error("Token non disponibile");
		let broadcaster_id: number = await this.getUserFromToken(token);
		return await this._getCurrentSubs('', token, broadcaster_id);
	}

	private async checkUserSub(access_token: AccessToken){
		let broadcaster_id: number = await this.getUser(process.env.USER);
		let user_id: number = await this.getUserFromToken(access_token);
		let queryParam: String = Utils.generateQuery({
			broadcaster_id: broadcaster_id,
			user_id: user_id
		});
		let reqParam: RequestParameter = {
			host: "api.twitch.tv",
			path: "/helix/subscriptions/user?" + queryParam,
			headers: {
				"Content-Type": "application/json",
				"Client-ID": this.twitch_const.client_id,
				"Authorization": "Bearer "+ access_token
			},
			method: "GET"
		};
		Utils.send(reqParam, {}, (data: any) => {
			const telegram: Telegram = new Telegram();
			telegram.finalize(data.error !== undefined, user_id);
		});
	}
	
	private updateAuthToken(): UserAuthToken | Promise<UserAuthToken>{
		let now: number = Date.now();
		if(this.authToken.creationDate - now > this.authToken.expires && this.authToken.token.length != 0) return this.authToken;
		return new Promise(this.getAuthToken.bind(this));
	}
	
	private getAuthToken(resolve?: Function, reject?: Function){
		var queryParam: String = Utils.generateQuery({
			client_id: this.twitch_const.client_id,
			client_secret: this.twitch_const.client_secret,
			grant_type: "client_credentials"
		});
		var authParam: RequestParameter = {
			host: "id.twitch.tv",
			path: "/oauth2/token?" + queryParam,
			method: "POST",
		};
		Utils.send(authParam, {}, (data) => {
			this.authToken = {
				creationDate: Date.now(),
				expires: data.expires_in,
				token: data.access_token
			};
			resolve(this.authToken);
		}, (e: any) => reject(e));
	}
	
	private _getUser(opt: RequestParameter): Promise<number>{
		return new Promise((resolve, reject) => {
			Utils.send(opt, {}, (data: any) => {
				console.log(data);
				if(data === undefined || data.data === undefined || data.data.length == 0){
					reject("Utente non trovato");
					return;
				}
				resolve(data.data[0].id);
			}, (e: any) => reject(e));
		});
	}

	private async _getCurrentSubs(pagination: string, token: AccessToken, broadcaster_id: number): Promise<number[]>{
		let queryParam = {
			broadcaster_id: broadcaster_id,
			first: 100,
			path: ''
		};
		if(pagination){
			queryParam.path = pagination;
		}
		var authParam = {
			host: "api.twitch.tv",
			path: "helix/subscriptions?" + Utils.generateQuery(queryParam),
			method: 'GET',
			headers: {
				"Client-ID": this.twitch_const.client_id,
				"Authorization": "Bearer "+ token.access
			}
		}
		let data: any;
		Utils.send(authParam, {}, (d: any) => {
			data = d;
		});
		//????????????????????????????????????????????????????????????????????????????????????
		await new Promise(r => setTimeout(r, 500));
		let users: number[] = [];
		for(const user of data.data){
			users.push(user.user_id);
		}
		if(data.data.length !== 0){
			users = users.concat(await this._getCurrentSubs(data.pagination.cursor, token, broadcaster_id));
		}
		return users;
	}
}