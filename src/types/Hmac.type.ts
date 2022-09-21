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
  merch_id: string;
  timestamp: string;
  nonce: string;
  recurent_freq?: string;
  recurent_exp?: string;
};

export type BaseTransactionHmac = {
  method: Methods;
  mid: string;
  epid?: string;
  invoice_id?: string;
  timestamp: string;
  nonce: string;
  fp_hash?: string;
};

export type CaptureHmac = {
  method: Methods;
  ukey: string;
  epid?: string;
  ep_id?: string;
  timestamp: string;
  nonce: string;
  fp_hash?: string;
};

export type PartialCaptureHmac = CaptureHmac & { amount: string };

export type RefundHmac = PartialCaptureHmac & { reason: string };

export type CancelHmac = CaptureHmac & { reason: string };

export type UpdateInvoiceIdHmac = CaptureHmac & { invoice_id: string };

export type InvoiceListHmac = Omit<CaptureHmac, 'epid'> & { mid?: string; mids?: string; from: string; to: string };

export type InvoiceTransactionHmac = Omit<CaptureHmac, 'epid'> & { invoice: string };

export type SavedCardsHmac = BaseTransactionHmac & { c2p_id: string };

export type RemoveCardHmac = SavedCardsHmac & { c2p_cid: string };

export type ComputeHmacData =
  | BaseHmac
  | BaseTransactionHmac
  | CaptureHmac
  | PartialCaptureHmac
  | RefundHmac
  | CancelHmac
  | UpdateInvoiceIdHmac
  | InvoiceListHmac
  | InvoiceTransactionHmac;
