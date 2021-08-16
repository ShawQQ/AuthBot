const telegram = require('../telegram/app');
const twitch = require('../twitch/app');
const constants = require('./constant');
const request = require('./request');
const express = require('express');
const app = express();

const setRoute = async () => {
	setPost();
	setGet();
	setWebhook();
	app.listen(constants.connection.port, () => {
        console.log(`Started`);
    });
}

function setPost(){
	app.post(constants.telegram.update_url, telegram.getUpdate);
	app.post('/finalizeRequest', telegram.finalize);
	app.post('/completeAuth', twitch.completeAuth);
}

function setGet(){
	app.get('/auth', telegram.confirmAuth);
}

function setWebhook(){
	let telegramWebhookParameter = {
		host: constants.telegram.api_host,
        path: "/bot"+constants.telegram.token+'/setWebhook?url='+"https://"+constants.connection.base_url+constants.telegram.update_url,
        method: 'POST'
	};
	request.send(telegramWebhookParameter);
}

module.exports = {
    setRoute: setRoute
};