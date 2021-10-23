require('dotenv').config();
const { Database } = require('./src/utils/db');
const constants = require('./src/utils/constant');
const db = new Database();
db.open().then(async () => {
	await db.createBaseTable();
	await db.close();
	require('./src/utils/route').setRoute();
});
console.log(constants.twitch.adminOauthUrl);