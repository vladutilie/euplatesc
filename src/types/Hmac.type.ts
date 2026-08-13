import { Methods } from './Methods.enum';

export type Currency = 'RON' | 'EUR' | 'USD' | 'HUF' | 'MDL' | 'BGN' | 'GBP' | 'PLN';

/**
 * Subsequent recurring transactions are POSTed server to server and need the
 * `recurent` flag set accordingly:
 * - `Base`         - the initial (enrolling) transaction;
 * - `Recurent`     - subsequent transactions;
 * - `Recurent2CIT` - subsequent 3-D Secure transaction.
 */
export type RecurrentType = 'Base' | 'Recurent' | 'Recurent2CIT';

export type Hmac = {
  amount: number;
  currency: Currency;
  invoiceId: string;
  orderDescription: string;
  frequency?: {
    days: number;
    expiresAt?: Date;
  };
  /**
   * The `ep_id` of the initial `Base` transaction. Required for `Recurent` and
   * `Recurent2CIT` transactions when the merchant - and not the EuPlătesc cron -
   * initiates them.
   */
  baseEpId?: string;
  /** Defaults to `Base` when `frequency` is set, `Recurent` when only `baseEpId` is set. */
  recurrentType?: RecurrentType;
};

export type BaseHmac = {
  /** Present only for subsequent recurring transactions, hashed before `amount`. */
  baseEPID?: string;
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
  by: string;
  status: string;
  limit: string;
  page: string;
  invoice: string;
  mids: string;
  ep_id: string;
  c2p_id: string;
  c2p_cid: string;
}>;

/**
 * Field set hashed to verify a gateway response. The key order is significant:
 * it is the exact order the gateway uses to build the MAC.
 */
export type ResponseHmac = {
  amount: string;
  curr: Currency | string;
  invoice_id: string;
  ep_id: string;
  merch_id: string;
  action: string;
  message: string;
  approval: string;
  timestamp: string;
  nonce: string;
} & Partial<{
  sec_status: string;
  rrn: string;
  mcard: string;
  card_exp: string;
  discount_amount: string;
  payment_channel: string;
  card_type: string;
  bin: string;
  rate: string;
  card_holder: string;
  email: string;
  rtype: string;
  cce: string;
}>;
