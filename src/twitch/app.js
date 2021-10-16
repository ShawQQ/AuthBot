const request = require('../utils/request');
const constants = require('../utils/constant');
const telegram = require('../telegram/app');
let authToken = {
    creationDate: 0,
    expires: 0,
    token: ""
};
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
	completeAuth: completeAuth
}