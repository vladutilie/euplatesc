export type Currency = 'RON' | 'USD' | 'EUR';

export type Hmac = {
  amount: number;
  currency: Currency;
  invoiceId: string;
  orderDescription: string;
  frequency?: {
    days: number;
    expiresAt: Date;
  };
};

export type BaseHmac = {
  amount: string;
  curr: Currency;
  invoice_id: string;
  order_desc: string;
  merch_id: string;
  timestamp: string;
  nonce: string;
  recurent_freq?: string;
  recurent_exp?: string;
};
