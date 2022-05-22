export interface TelegramBot {
  chatId: number;
  getUpdate(ctx: UpdateContext): void;
  checkMessage(msg: ChatMessageResponse): boolean;
  sendMessage(msg: ChatMessageRequest): void;
  deleteMessage(msg: DeleteMessageRequest): void;
  createInviteLink(data: InviteLinkRequest): Promise<InviteLink>;
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
  sender_chat?: Chat;
};

export type ChatMessageRequest = {
  chat_id: number;
  text: string;
  reply_markup?: InlineKeyboardMarkup;
};

export type InlineKeyboardMarkup = {
  inline_keyboard: Array<Array<InlineKeyboardButton>>;
};

export type InlineKeyboardButton = {
  text: string;
  url?: string;
};

export type Chat = {
  id: number;
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
  invite_link: string;
};
