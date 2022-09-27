import { Methods } from './Methods.enum';

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
  merch_id: string; // action message approval
  timestamp: string;
  nonce: string;
  recurent_freq?: string;
  recurent_exp?: string;
};

export type Base<T> = { timestamp: string; nonce: string; fp_hash?: string } & T;

export type Payload = Partial<{
  method: Methods;
  mid: string;
  epid: string;
  invoice_id: string;
  ukey: string;
  amount: string;
  reason: string;
  from: string;
  to: string;
  invoice: string;
  mids: string;
  ep_id: string;
  c2p_id: string;
  c2p_cid: string;
}>;

export type ResponseHmac = Omit<BaseHmac, 'order_desc'> & {
  ep_id: string;
  action: string;
  message: string;
  approval: string;
};
