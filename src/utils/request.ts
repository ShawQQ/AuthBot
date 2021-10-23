const https = require('https');

export interface HeaderRequest{
	'Client-ID'?: String,
	'Authorization'?: String
};

export interface RequestParameter{
	host?: String,
	path?: String,
	method?: String,
	headers?: HeaderRequest
};

export const send = 
	(
		reqParam: RequestParameter = {}, 
		reqBody: any = {}, 
		cb: (data: any) => {}, 
		handleError: (e: any) => {}
	) => {
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