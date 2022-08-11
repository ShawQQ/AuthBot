export interface TelegramBot {
	getUpdate(ctx: UpdateContext): void;
	checkMessage(msg: ChatMessageResponse): boolean;
	sendMessage(msg: ChatMessageRequest): void;
	deleteMessage(msg: DeleteMessageRequest): void;
	createInviteLink(data: InviteLinkRequest): Promise<InviteLink>;
	getChat(chatId: BigInt): Promise<Chat>;
	userInGroup(userId: BigInt): Promise<boolean>;
	banUser(userId: BigInt): Promise<void>;
	getUser(userId: BigInt): Promise<TelegramUser>;
}

export type UpdateContext = {
	update_id: BigInt;
	message?: ChatMessageResponse;
	edited_message?: ChatMessageResponse;
};

export type ChatMessageResponse = {
	message_id: BigInt;
	date: number;
	text?: string;
	chat?: Chat;
};

export type ChatMessageRequest = {
	chat_id: BigInt;
	text: string;
	reply_markup?: InlineKeyboardMarkup;
	parse_mode?: MessageParseMode;
};

export enum MessageParseMode{
	"MarkdownV2",
	"HTML",
}

export type InlineKeyboardMarkup = {
	inline_keyboard: Array<Array<InlineKeyboardButton>>;
};

export type InlineKeyboardButton = {
	text: string;
	url?: string;
};

export type Chat = {
	id: BigInt;
	username: string;
};

export type DeleteMessageRequest = {
	chat_id: BigInt;
	message_id: BigInt;
};

export type InviteLinkRequest = {
	chat_id: BigInt;
	expire_date: number;
	member_limit: number;
};

export type InviteLink = {
	result: {
		invite_link: string;
	}
};

export type TelegramUser = {
	id: BigInt;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
	can_join_groups?: boolean;
	can_read_all_group_messages?: boolean;
	supports_inline_queries?: boolean;
}