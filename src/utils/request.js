const https = require('https');

const send = (reqParam = {}, reqBody = {}, cb = () => {}, handleError = () => {}) => {
	let req = https.request(reqParam, (result) => {
		result.setEncoding('utf-8');
		result.on('error', (e) => {
			console.log(e);
			handleError(e);
		});
		result.on('data', (d) => {
			try{
				let data = JSON.parse(d);
				cb(data);
			}catch(e){
				console.log(e);
			}
		});
	});
	if(reqBody){
		console.log(reqBody);
		req.write(JSON.stringify(reqBody));
	}
	console.log("request end");
	req.end();
}

module.exports = {
	send: send
};