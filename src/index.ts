import { setWebHook, setRoute } from "./routing/router";
import { DatabaseFactory } from "./utils/database/db";

const db = DatabaseFactory.getDatabase();

/**
 * Start the application
 */
async function start() {
  await db.open();
  await db.createBaseTable();
  await setWebHook();
  setRoute();
}

start();
