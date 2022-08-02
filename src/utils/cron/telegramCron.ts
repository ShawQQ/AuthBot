import { TelegramBotInstance } from "../../telegram/telegram";
import { Logger } from "tslog";
import { Database, UserEdit } from '../database/interfaces';
import { DatabaseFactory } from '../database/db';
import { Twitch } from '../../twitch/types/twitch';
import { TwitchInstance } from '../../twitch/twitch';
import { MessageParseMode, TelegramBot, TelegramUser } from '../../telegram/types/telegram';

/**
 * Telegram cron functions
 */
export class TelegramCron{
	private log: Logger;
	private db: Database;
	private telegram: TelegramBot;
	private twitch: Twitch;

	constructor(){
		this.log = new Logger();
		this.db = DatabaseFactory.getDatabase();
		this.telegram = new TelegramBotInstance();
		this.twitch = new TwitchInstance();
	}
	
	/**
	 * Send message to warn user with expired sub
	 */
	async banWarning(){
		this.log.info("Start ban warning");
		const users: UserEdit[] = await this.getBanUser();
		let msg: string = "Signori e signore, domani il bot passa a salutare chi non ha la sub. Se siete in questa lista ricordatevi di rinnovare<br />";
		for(let user of users){
			if(!this.telegram.userInGroup(user.telegram_id)) continue;
			if(!user.telegram_handle){
				let telegramUser: TelegramUser = await this.telegram.getUser(user.telegram_id);
				user.telegram_handle = telegramUser.first_name;
				await this.db.update({
					twitch_id: user.twitch_id,
					telegram_id: user.telegram_id,
					telegram_handle: user.telegram_handle,
					is_vip: user.is_vip
				});
			}
			msg += "@"+user.telegram_handle;
		}
		this.telegram.sendMessage({
			chat_id: process.env.TELEGRAM_GROUP as unknown as number,
			text: msg,
			parse_mode: MessageParseMode.MarkdownV2
		});
		this.log.info("End ban warning");
	}

	/**
	* Ban users from telegram group
	*/
	async autoban(){
		this.log.info("Start ban");
		const users: UserEdit[] = await this.getBanUser();
		for(const user of users){
			await this.telegram.banUser(user.telegram_id);
			await this.db.delete(user);
		}
		this.log.info("End ban");
	}
	
	private async getBanUser(): Promise<UserEdit[]>{
		const twitchSubs: number[] = await this.twitch.getCurrentSubs();
		let users: UserEdit[] = await this.db.getUsers();
		users = users.filter((user) => {
			twitchSubs.includes(user.twitch_id);
		});
		return users;
	}
}