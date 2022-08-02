export interface TelegramBot {
	getUpdate(ctx: UpdateContext): void;
	checkMessage(msg: ChatMessageResponse): boolean;
	sendMessage(msg: ChatMessageRequest): void;
	deleteMessage(msg: DeleteMessageRequest): void;
	createInviteLink(data: InviteLinkRequest): Promise<InviteLink>;
	getChat(chatId: number): Promise<Chat>;
	userInGroup(userId: number): Promise<boolean>;
	banUser(userId: number): Promise<void>;
	getUser(userId: number): Promise<TelegramUser>;
}

export type UpdateContext = {
	update_id: number;
	message?: ChatMessageResponse;
	edited_message?: ChatMessageResponse;
};

export type ChatMessageResponse = {
	message_id: number;
	date: number;
	text?: string;
	chat?: Chat;
};

export type ChatMessageRequest = {
	chat_id: number;
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
	id: number;
	username: string;
};

export type DeleteMessageRequest = {
	chat_id: number;
	message_id: number;
};

export type InviteLinkRequest = {
	chat_id: number;
	expire_date: number;
	member_limit: number;
};

export type InviteLink = {
	result: {
		invite_link: string;
	}
};

export type TelegramUser = {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
	can_join_groups?: boolean;
	can_read_all_group_messages?: boolean;
	supports_inline_queries?: boolean;
}