import { DatabaseFactory } from "../utils/database/db";
import { Database } from "../utils/database/interfaces";
import { RequestParameter } from "../utils/interface/common_interface";
import { Utils } from "../utils/utils";

const url = require('url');
const path = require('path');

export class Telegram{
	db: Database = DatabaseFactory.getDatabase();
	telegram_const = Utils.getTelegramConst();
	group_id: string = this.telegram_const.group;
	chat_id: number;
	user_id: number;

	public getUpdate(req: any, res: any){
		req.setEncoding('utf-8');
		req.on('data', (d: string) => {
			try{
				let data = JSON.parse(d);
				this.sendStart(data);
			}catch(e){
				console.log(e);
			}
		});
		req.on('error', (e) => {
			console.log(e)
		});
		res.send("");
	}

	public confirmAuth(req: any, res: any){
		req.setEncoding('utf-8');
		let data = url.parse(req.url, true).query;
		let authParam: RequestParameter = {
			host: Utils.getConConst().base_url,
			path: "/completeAuth",
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			}};
		let authBody = {
			code: data.code
		};
		Utils.send(authParam, authBody);
		res.sendFile(path.join(__dirname+'/webpage/auth.html'));
	}

	
	public async finalize(error: boolean, twitch_id: number){
		if(error){
			let msgOpt = {
				chat_id: this.chat_id,
				text: "Non risulti abbonato"
			}
			this.sendMessage(msgOpt);
		}else{
			this.joinGroup();
			await this.db.insert({
				twitch_id: twitch_id,
				telegram_id: this.user_id,
				is_vip: false
			});
			console.log("Utente inserito: Twitch: " + twitch_id + "Telegram: " + this.user_id);
		}
	}
	
	public banUsers(ids: number[]){
		let reqOpt: RequestParameter = {
			host: this.telegram_const.api_host,
			path: this.telegram_const.base_url+'/banChatMember',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		};
		for(const id of ids){
			let opt = {
				chat_id: this.chat_id,
				user_id: id,
				until_date: Date.now() + 1 * 100 * 600,
				revoke_messages: false
			}
			Utils.send(reqOpt, opt);
		}
	}

	private sendStart(data: any){
		if(data.message === undefined){
			console.log(data);
			return;
		}
		if(data.message.chat.type !== 'private'){
			console.log(data.message.chat.id);
			return;
		}
		if(data.message.text !== '/start') return;
		this.chat_id = data.message.chat.id;
		this.user_id = data.message.from.id;
		let oauthParam = Utils.getTwitchConst().oauth2_param;
		let opt = {
			chat_id: data.message.chat.id,
			text: "Effettua il login su twitch per confermare di essere abbonato",
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: "Login",
							url: "https://"+oauthParam.host + oauthParam.path,
						}
					]
				]
			}
		};
		console.log([this.chat_id, this.user_id]);
		this.sendMessage(opt);
	}

	private joinGroup(){
		let opt: RequestParameter = {
			host: this.telegram_const.api_host,
			path: this.telegram_const.base_url+'/createChatInviteLink',
			headers: {
				'Content-Type': "application/json"
			},
			method: "POST"
		};
		let groupBody = {
			chat_id: this.group_id,
			member_limit: 1
		};
		Utils.send(opt, groupBody, (data) => {
			let messageOpt = {
				chat_id: this.chat_id,
				text: data.result.invite_link
			};
			this.sendMessage(messageOpt);
		});
	}

	
	private sendMessage(opt){
		let reqOpt: RequestParameter = {
			host: this.telegram_const.api_host,
			path:this.telegram_const.base_url+'/sendMessage',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		};
		Utils.send(reqOpt, opt, (data) => {
			setTimeout(() => {
				let opt = {
					chat_id: data.result.chat.id,
					message_id: data.result.message_id
				};
				this.deleteMessage(opt);
			}, 30000);
		});
	}

	private deleteMessage(opt){
		let reqOpt: RequestParameter = {
			host: this.telegram_const.api_host,
			path: this.telegram_const.base_url+'/deleteMessage',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		};
		Utils.send(reqOpt, opt);
	}
}