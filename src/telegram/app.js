const url = require('url');
const path = require('path');
const request = require('../utils/request');
const constants = require('../utils/constant');
let group_id = constants.telegram.group;
let chat_id = 0;

const getUpdate = (req, res) => {
	req.setEncoding('utf-8');
	req.on('data', (d) => {
		try{
			data = JSON.parse(d);
			sendStart(data);
		}catch(e){
			console.log(e);
		}
	});
	req.on('error', (e) => {
		console.log(e)
	});
	res.send("");
}

const confirmAuth = (req, res) => {
	req.setEncoding('utf-8');
	let data = url.parse(req.url, true).query;
	let authParam = {
		host: constants.connection.base_url,
		path: "/completeAuth",
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		}};
	let authBody = {
		code: data.code
	};
	request.send(authParam, authBody);
	res.sendFile(path.join(__dirname+'/webpage/auth.html'));
}

const finalize = (error) => {
	if(error){
		let msgOpt = {
			chat_id: chat_id,
			text: "Non risulti abbonato"
		}
		sendMessage(msgOpt);
	}else{
		joinGroup();
	}
}

function sendStart(data){
	if(data.message === undefined){
		console.log(data);
		return;
	}
	if(data.message.chat.type !== 'private'){
		console.log(data.message.chat.id);
		if(group_id == 0) group_id = data.message.chat.id;
		return;
	}
	chat_id = data.message.chat.id;
	if(data.message.text !== '/start') return;
	let oauthParam = constants.twitch.oauth2_param;
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
	sendMessage(opt);
}

function joinGroup(){
	let opt = {
		host: constants.telegram.api_host,
		path: constants.telegram.base_url+'/createChatInviteLink',
		headers: {
			"Content-type": "application/json"
		},
		method: "POST"
	};
	let groupBody = {
		chat_id: group_id,
		member_limit: 1
	}
	request.send(opt, groupBody, (data) => {
		let messageOpt = {
			chat_id: chat_id,
			text: data.result.invite_link
		};
		sendMessage(messageOpt);
	});
}

function sendMessage(opt){
	let reqOpt = {
		host: constants.telegram.api_host,
		path: constants.telegram.base_url+'/sendMessage',
		method: 'POST',
		headers: {
			'Content-type': 'application/json'
		}
	};
	request.send(reqOpt, opt, (data) => {
		setTimeout(() => {
			let opt = {
				chat_id: data.result.chat.id,
				message_id: data.result.message_id
			};
			deleteMessage(opt);
		}, 30000);
	});
}

function deleteMessage(opt){
	let reqOpt = {
		host: constants.telegram.api_host,
		path: constants.telegram.base_url+'/deleteMessage',
		method: 'POST',
		headers: {
			'Content-type': 'application/json'
		}
	};
	request.send(reqOpt, opt);
}

module.exports = {
	getUpdate: getUpdate,
	confirmAuth: confirmAuth,
	finalize: finalize
}