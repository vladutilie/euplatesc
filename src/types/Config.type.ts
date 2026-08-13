export type Config = {
  merchantId: string;
  secretKey: string;
  testMode?: boolean;
  userKey?: string;
  userApi?: string;
  /** Optional. HTTP request timeout in milliseconds. Default: 30000. */
  timeout?: number;
};
