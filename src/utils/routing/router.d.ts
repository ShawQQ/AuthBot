import { Telegram } from "src/telegram/app";
import { Twitch } from "src/twitch/app";

export interface Router{
	telegram: Telegram,
	twitch: Twitch,
	setRoute: () => void
}