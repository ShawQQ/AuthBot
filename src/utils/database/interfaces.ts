import { AdminToken } from "../../twitch/types/twitch";
export type UserEdit = {
  twitch_id: BigInt,
  telegram_id: BigInt,
  telegram_handle: string,
  is_vip: boolean,
}

export interface Database {
  insert(edit: UserEdit): Promise<void>;
  delete(edit: UserEdit): Promise<void>;
  update(edit: UserEdit): Promise<void>;
  open(): Promise<void>;
  close(): Promise<void>;
  createBaseTable(): Promise<void>;
  getCurrentToken(): Promise<AdminToken>;
  updateAccessToken(token: AdminToken): Promise<void>;
  getUsers(): Promise<UserEdit[]>;
}
