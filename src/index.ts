import { DatabaseFactory } from "./utils/database/db";
import { Database } from "./utils/database/interfaces";
import { RouterFactory } from "./utils/routing/route";
import { Router } from "./utils/routing/router";
import { Utils } from "./utils/utils";
import 'dotenv/config';

var cron = require('node-cron');
let db: Database = DatabaseFactory.getDatabase();
let router: Router = RouterFactory.getRouter();

db.open().then(async () => {
	await db.createBaseTable();
	router.setRoute();

	cron.schedule('*/5 * * * *', () => {
		console.log("Inizio ban gruppo telegram");
		Utils.autoban();
		console.log("Fine ban gruppo telegram");
	});
});