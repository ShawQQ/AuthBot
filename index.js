require('dotenv').config();
const { Database } = require('./src/utils/db');
const constants = require('./src/utils/constant');
const twitch = require('./src/twitch/app');
const telegram = require('./src/telegram/app');
const db = new Database();
db.open().then(async () => {
	await db.createBaseTable();
	await db.close();
	require('./src/utils/route').setRoute();
	//AUTOBAN
	setInterval(async () => {
		try{
			let users = await twitch.getCurrentSubs();
			if(!db._connected) await db.open();
			let currentUser = await db.getUsers();
			let toBan = [];
			
			for(const current of currentUser){
				let ban = true;
				for(const user of users){
					if(user.id == current.twitch_id){
						ban = false;
						break;
					}
				}
				if(ban){
					toBan.push(current.telegram_id);
				}
			}
			telegram.banUsers(toBan);
			await db.close();
		}catch(e){
			console.error("Autoban error: "+e);
		}
	}, 30 * 24 * 60 * 60 * 1000);
});
