let telegram = {
	token: process.env.TELEGRAM_TOKEN,
	group: process.env.TELEGRAM_GROUP,
	api_host: "api.telegram.org",
	base_url: '/bot'+process.env.TELEGRAM_TOKEN,
	update_url: '/'+process.env.TELEGRAM_TOKEN+'/getUpdate'
};

let twitch = {
	client_id: process.env.TWITCH_CLIENT_ID,
	client_secret: process.env.TWITCH_CLIENT_SECRET,
	oauth2_uri: process.env.OAUTH2_URI,
	oauth2_complete: process.env.OAUTH2_COMPLETE,
	user: process.env.USER
};

let connection = {
	base_url: process.env.URL,
	port: process.env.PORT
}

module.exports = {
	telegram: telegram,
	twitch: twitch,
	connection: connection
};