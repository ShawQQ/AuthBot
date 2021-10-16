const telegram = {
	token: process.env.TELEGRAM_TOKEN,
	group: process.env.TELEGRAM_GROUP,
	api_host: "api.telegram.org",
	base_url: '/bot'+process.env.TELEGRAM_TOKEN,
	update_url: '/'+process.env.TELEGRAM_TOKEN+'/getUpdate'
};

const twitch = {
	client_id: process.env.TWITCH_CLIENT_ID,
	client_secret: process.env.TWITCH_CLIENT_SECRET,
	oauth2_uri: process.env.OAUTH2_URI,
	oauth2_complete: process.env.OAUTH2_COMPLETE,
	user: process.env.USER,
	oauth2_param: {
		host: "id.twitch.tv",
		path: "/oauth2/authorize?client_id="+process.env.TWITCH_CLIENT_ID+'&redirect_uri='+process.env.OAUTH2_URI+'&response_type=code&scope=user:read:subscriptions&prompt=none',
	}
};

const connection = {
	base_url: process.env.URL,
	port: process.env.PORT
}

module.exports = {
	telegram: telegram,
	twitch: twitch,
	connection: connection
};