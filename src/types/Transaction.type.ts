/**
 * Filter for the `transactions` web service.
 *
 * @since 1.1.0
 */
export type TransactionFilter = {
  /** Optional. Merchant ID. If empty, the merchant ID from the client initialization is used. */
  mid?: string;
  /** Optional. Start of the searched interval. Max. interval length: 1 year. */
  from?: Date;
  /** Optional. End of the searched interval. Max. interval length: 1 year. */
  to?: Date;
  /** Optional. The date field the interval applies to. Default: `complete`. */
  by?: TransactionBy;
  /** Optional. Transaction status filter. Default: `all`. */
  status?: TransactionStatusFilter;
  /** Optional. Number of returned records, 1-5000. Default: 5000. */
  limit?: number;
  /** Optional. Result page, 1-based. Default: 1. */
  page?: number;
};

export type TransactionBy = 'complete' | 'auth' | 'capture' | 'refund' | 'recurent_cancel';

export type TransactionStatusFilter =
  | 'all'
  | 'success'
  | 'fail'
  | 'captured'
  | 'notcaptured'
  | 'refunded'
  | 'base'
  | 'recurent';

export type Transaction = {
  merch_id: string;
  invoice_id: string;
  amount: string;
  ep_id: string;
  rrn: string;
  action: string;
  sec_status: string;
  message: string;
  captured: string;
  refunded: string;
  pending_status: string;
  masked_card: string;
  card_expire: string;
  name_on_card: string;
  email: string;
  timestamp: string;
};

/**
 * Transaction returned by the `check_status` web service.
 *
 * The gateway only fills in the extra fields when the MID is set to the v1.2
 * response format, which is why everything but the core set is optional.
 *
 * @since 1.1.0
 */
export type TransactionStatus = Transaction & {
  tran_type?: string;
  recurent_exp?: string;
  recurent_cancel_date?: string;
  sec_status_text?: string;
  captured_amount?: string;
  refunded_amount?: string | number;
  card_hash?: string;
  approval?: string;
  fname?: string;
  lname?: string;
  recurent_amount?: string | null;
  discount_amount?: string | null;
  channel?: string;
  installments?: unknown[];
  rrn_org?: string;
};
