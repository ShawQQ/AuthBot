const url = require('url');
const path = require('path');
const request = require('../utils/request');
const constants = require('../utils/constant');
const telegram = require('../telegram/app');
const { Database } = require('../utils/db');
let authToken = {
    creationDate: 0,
    expires: 0,
    token: ""
};

const adminAuth = (req, res) => {
	req.setEncoding('utf-8');
	let data = url.parse(req.url, true).query;
	let authParam = {
		host: constants.connection.base_url,
		path: "/completeAdminAuth",
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		}};
	let authBody = {
		code: data.code
	};
	request.send(authParam, authBody);
	res.sendFile(path.join(__dirname+'/webpage/confirm.html'));
}

const confirmAdminAuth = (req, res) => {
	req.setEncoding('utf-8');
	req.on('data', (d) => {
		try{
			let data = JSON.parse(d);
			let authParam = {
				host: "id.twitch.tv",
				path: "/oauth2/token?client_id="+constants.twitch.client_id+"&client_secret="+constants.twitch.client_secret+"&code="+data.code+"&grant_type=authorization_code&redirect_uri="+process.env.OAUTH2_COMPLETE,
				method: 'POST',
			}
			request.send(authParam, {}, async (data) => {
				let db = new Database();
				await db.open();
				await db.updateAccessToken(data.access_token, data.refresh_token);
				await db.close();
			});
		}catch(e){
			console.log(e);
		}
	});
	req.on('error', (e) => {
		console.log(e)
	});
	res.send("");
}

const updateAdminToken = async () => {
	let db = new Database();
	await db.open();
	let oldToken = await db.getCurrentToken();
	var updateParam = {
		host: "id.twitch.tv",
        path: "/oauth2/token/?grant_type=refresh_token&refresh_token="+oldToken.refresh_token+"client_id="+constants.twitch.client_id+"client_secret="+constants.twitch.client_secret,
        method: 'POST',
	}

	request.send(updateParam, {}, async (data) => {
		await db.updateAccessToken(data.access_token, data.refresh_token);
		await db.close();
	})
}

const getCurrentSubs = async () => {
	let db = new Database();
	await updateAdminToken(); 
	await db.open();
	let token = await db.getCurrentToken();
	let broadcaster_id = await getUserFromToken(token);
	var authParam = {
		host: "api.twitch.tv",
        path: "helix/subscriptions?broadcaster_id="+broadcaster_id,
        method: 'GET',
        headers: {
            "Client-ID": constants.twitch.client_id,
            "Authorization": "Bearer "+ token
        }
	}

	request.send(authParam, {}, (data) => {
		console.log(data);
	});
}

const getUser = async (username) => {
    await updateAuthToken();
    var userParam = {
        host: "api.twitch.tv",
        path: "helix/users?login="+username,
        method: 'GET',
        headers: {
            "Client-ID": constants.twitch.client_id,
            "Authorization": "Bearer "+ authToken.token
        }
    }
    return _getUser(userParam);
}

const completeAuth = (req, res) => {
	req.setEncoding('utf-8');
	req.on('data', (d) => {
		try{
			let data = JSON.parse(d);
			let authParam = {
				host: "id.twitch.tv",
				path: "/oauth2/token?client_id="+constants.twitch.client_id+"&client_secret="+constants.twitch.client_secret+"&code="+data.code+"&grant_type=authorization_code&redirect_uri="+process.env.OAUTH2_COMPLETE,
				method: 'POST',
			}
			request.send(authParam, {}, (data) => checkUserSub(data.access_token));
		}catch(e){
			console.log(e);
		}
	});
	req.on('error', (e) => {
		console.log(e)
	});
	res.send("");
}

async function checkUserSub(access_token){
	let broadcaster_id = await getUser(process.env.USER);
	let user_id = await getUserFromToken(access_token);
	let reqParam = {
		host: "api.twitch.tv",
		path: "/helix/subscriptions/user?broadcaster_id="+broadcaster_id+'&user_id='+user_id,
		headers: {
			"Content-Type": "application/json",
			"Client-ID": constants.twitch.client_id,
			"Authorization": "Bearer "+ access_token
		},
		method: "GET"
	};
	request.send(reqParam, {}, (data) => {
		telegram.finalize(data.error !== undefined, user_id);
	});
}

async function getUserFromToken(access_token){
	let reqParam = {
		host: "api.twitch.tv",
		path: "/helix/users",
		headers: {
			"Content-Type": "application/json",
			"Client-ID": constants.twitch.client_id,
			"Authorization": "Bearer "+ access_token
		},
		method: "GET"
	}
	return _getUser(reqParam);
}

function _getUser(opt){
	return new Promise((resolve, reject) => {
		request.send(opt, {}, (data) => {
			console.log(data);
			if(data.data.length == 0){
				reject("Utente non trovato");
				return;
			}
			resolve(data.data[0].id);
		}, (e) => reject(e));
	});
}

function updateAuthToken(){
    let now = new Date();
    if(authToken.creationDate - now > authToken.expires && authToken.token.length != 0) return authToken;
	return new Promise(getAuthToken);
}

function getAuthToken(resolve, reject){
    var param = {
        client_id: constants.twitch.client_id,
        client_secret: constants.twitch.client_secret,
        grant_type: "client_credentials"
    };
    var authParam = {
        host: "id.twitch.tv",
        path: "/oauth2/token?client_id="+param.client_id+"&client_secret="+param.client_secret+"&grant_type=client_credentials",//+(new URLSearchParams(param).toString()),
        method: "POST",
    };
	request.send(authParam, {}, (data) => {
		authToken = {
			creationDate: new Date(),
			expires: data.expires_in,
			token: data.access_token
		};
		resolve(authToken);
	}, (e) => reject(e));
}

module.exports = {
    getUser: getUser,
	completeAuth: completeAuth,
	adminAuth: adminAuth,
	confirmAdminAuth: confirmAdminAuth,
	updateAdminToken: updateAdminToken,
	getCurrentSubs: getCurrentSubs
}