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
    id: BigInt;
  }>;
};

export type TwitchSub = {
  data?: Array<{
    user_id: BigInt;
  }>;
  pagination?: {
    cursor: string;
  };
};

export type AuthResult = {
  is_sub: boolean;
  twitch_id: BigInt;
};

export interface Twitch {
  getUser(user: UserAuthToken): Promise<BigInt>;
  getCurrentSubs(): Promise<Array<BigInt>>;
  completeAuth(code: string): Promise<AuthResult>;
  adminAuth(): void;
  confirmAdminAuth(): void;
}
