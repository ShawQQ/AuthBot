import { DatabaseFactory } from "./src/utils/database/db";
import { Database } from "./src/utils/database/interfaces";
import { RouterFactory } from "./src/utils/routing/route";
import { Router } from "src/utils/routing/router";
import { Utils } from "src/utils/utils";
import 'dotenv/config';

let db: Database = DatabaseFactory.getDatabase();
let router: Router = RouterFactory.getRouter();
db.open().then(async () => {
	await db.createBaseTable();
	await db.close();
	router.setRoute();

	/* AUTOBAN */
	let timeout = 30 * 24 * 60 * 60 * 1000;
	//max 32 bit integer;
	let upperMsBound = 2147483647;
	let extraAwait = timeout - upperMsBound;
	if(extraAwait){
		setInterval(() => {
			setInterval(Utils.autoban, extraAwait);
		}, upperMsBound);
	}else{
		setInterval(Utils.autoban, timeout);
	}
});