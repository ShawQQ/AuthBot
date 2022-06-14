export type UserAuthToken = {
  creationDate: number;
  expires: number;
  access_token: string;
};

export type AdminToken = {
  access_token: string;
  refresh_token: string;
};

export type TwitchUser = {
  data?: Array<{
    id: number;
  }>;
};

export type TwitchSub = {
  data?: Array<{
    user_id: number;
  }>;
  pagination?: {
    cursor: string;
  };
};

export type AuthResult = {
  is_sub: boolean;
  twitch_id: number;
};

export interface Twitch {
  getUser(user: UserAuthToken): Promise<number>;
  getCurrentSubs(): Promise<Array<number>>;
  completeAuth(code: string): Promise<AuthResult>;
  adminAuth(): void;
  confirmAdminAuth(): void;
}