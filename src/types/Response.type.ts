export type Response = {
  amount: string;
  currency: string;
  invoiceId: string;
  epId: string;
  merchantId: string;
  action: string;
  message: string;
  approval: string;
  timestamp: string;
  nonce: string;
  fpHash: string;
};

export type ResponseResult = {
  success: boolean;
  response: 'complete' | 'failed' | 'invalid';
};
