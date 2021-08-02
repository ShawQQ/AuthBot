const url = require('url');
const path = require('path');
const request = require('../utils/request');
const twitch = require('../twitch/app');
const constants = require('../utils/constant');
let group_id = 0;
let chat_id = 0;

const getUpdate = (req, res) => {
	req.setEncoding('utf-8');
	req.on('data', (d) => {
		data = JSON.parse(d);
		sendStart(data);
	});
	req.on('error', (e) => {
		console.log(e)
	});
	res.send("");
}

const confirmAuth = (req, res) => {
	req.setEncoding('utf-8');
	let data = url.parse(req.url, true).query;
	twitch.completeAuth(data.code);
	res.sendFile(path.join(__dirname+'/webpage/auth.html'));
}

const finalize = (req, res) => {
	req.setEncoding('utf-8');
	req.on('data', (d) => {
		let data = JSON.parse(d);
		if(data.error){
			let msgOpt = {
				chat_id: chat_id,
				text: "Non risulti abbonato"
			}
			sendMessage(msgOpt);
		}else{
			joinGroup();
		}
	});
	req.on('error', (e) => {
		console.log(e);
		res.status(403).send("Forbidden");
	});
	res.send();
}

function sendStart(data){
	if(data.message.chat.type !== 'private'){
		if(group_id == 0) group_id = data.message.chat.id;
		return;
	}
	chat_id = data.message.chat.id;
	let oauthParam = twitch.getOauthParameters();
	let opt = {
		chat_id: data.message.chat.id,
		text: "azioni",
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Effettua il login",
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
	request.send(reqOpt, opt);
}

module.exports = {
	getUpdate: getUpdate,
	confirmAuth: confirmAuth,
	finalize: finalize
}