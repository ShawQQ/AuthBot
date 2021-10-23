const https = require('https');

const send = (reqParam = {}, reqBody = {}, cb = () => {}, handleError = () => {}) => {
	let req = https.request(reqParam, (result) => {
		result.setEncoding('utf-8');
		result.on('error', (e) => {
			console.log(e);
			handleError(e);
		});
		let body = '';
		result.on('data', (chunk) => {
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

module.exports = {
	send: send
};