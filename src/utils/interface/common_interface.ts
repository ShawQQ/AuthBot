export interface HeaderRequest{
	'Client-ID'?: String,
	'Authorization'?: String,
	'Content-Type'?: String
};

export interface RequestParameter{
	host?: String,
	path?: String,
	method?: String,
	headers?: HeaderRequest
};