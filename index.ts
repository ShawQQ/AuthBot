import { DatabaseFactory } from "./src/utils/database/db";
import { Database } from "./src/utils/database/interfaces";
import { Router } from "./src/utils/routing/route";
import 'dotenv/config';

let db: Database = DatabaseFactory.getDatabase();
db.open().then(async () => {
	await db.createBaseTable();
	await db.close();
	Router.setRoute();
});

//AUTOBAN
/*
db.open().then(async () => {
	let users = await twitch.getCurrentSubs();
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
	console.log(toBan);
});
*/