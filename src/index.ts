import { setWebHook, setRoute } from "./routing/router";
import { DatabaseFactory } from "./utils/database/db";
import { Logger } from 'tslog';
import { TelegramCron } from './utils/cron/telegramCron';
const CronJob = require('cron').CronJob;
const db = DatabaseFactory.getDatabase();
const log: Logger = new Logger();
/**
 * Start the application
 */
async function start() {
  await db.open();
  await db.createBaseTable();
  await setWebHook();
  setRoute();
//   const cron = new TelegramCron();
//   new CronJob(
// 	'0 0 1 * *',
// 	cron.banWarning,
// 	null,
// 	true,
// 	'Europe/Rome'
//   );
//   new CronJob(
// 	'0 0 2 * *',
// 	cron.autoban,
// 	null,
// 	true,
// 	'Europe/Rome'
//   );
}
start();
