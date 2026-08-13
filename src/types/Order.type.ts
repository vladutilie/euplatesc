export type Order = BillingDetails & ShippingDetails & Extra;

export type BillingDetails = {
  billingFirstName?: string;
  billingLastName?: string;
  billingCompany?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  billingPhone?: string;
  billingEmail?: string;
};

export type ShippingDetails = {
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingCompany?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  shippingPhone?: string;
  shippingEmail?: string;
};

/**
 * Payment channels accepted by `ExtraData[ep_channel]`.
 *
 * @since 1.1.0
 */
export type PaymentChannel = 'CC' | 'OP' | 'C2P' | 'GPAY' | 'APAY' | 'TBI' | 'paypo';

export type Extra = {
  Extra?: string;
  silentUrl?: string;
  /**
   * SecStatus callback URL (server to server POST request).
   *
   * @since 1.1.0
   */
  silentUrlSec?: string;
  successUrl?: string;
  failedUrl?: string;
  epTarget?: string;
  /** "post", "get" or "getclean" (keeping the original query params). */
  epMethod?: 'post' | 'get' | 'getclean' | (string & {});
  backToSite?: string;
  backToSiteMethod?: 'post' | 'get' | (string & {});
  expireUrl?: string;
  rate?: string;
  filterRate?: string;
  /** Comma-separated {@link PaymentChannel} values, ex: `'CC,APAY'`. */
  channel?: PaymentChannel | (string & {});
  generateEpId?: string;
  /**
   * Allow card validation with an amount of 0.
   *
   * @since 1.1.0
   */
  validateCc?: boolean;
  valability?: Date;
  c2pId?: string;
  c2pCid?: string;
  lang?: 'ro' | 'en' | 'fr' | 'de' | 'it' | 'es' | 'hu';
};

export type BaseOrder = {
  fp_hash?: string;
  recurent?: string;
} & BaseBillingDetails &
  BaseShippingDetails &
  BaseExtra;

export type BaseBillingDetails = {
  fname?: string;
  lname?: string;
  company?: string;
  add?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
};

export type BaseShippingDetails = {
  sfname?: string;
  slname?: string;
  scompany?: string;
  sadd?: string;
  scity?: string;
  sstate?: string;
  szip?: string;
  scountry?: string;
  sphone?: string;
  semail?: string;
};

export type BaseExtra = {
  ExtraData?: string;
  'ExtraData[silenturl]'?: string;
  'ExtraData[silenturlsec]'?: string;
  'ExtraData[successurl]'?: string;
  'ExtraData[failedurl]'?: string;
  'ExtraData[ep_target]'?: string;
  'ExtraData[ep_method]'?: string;
  'ExtraData[backtosite]'?: string;
  'ExtraData[backtosite_method]'?: string;
  'ExtraData[expireurl]'?: string;
  'ExtraData[rate]'?: string;
  'ExtraData[filtru_rate]'?: string;
  'ExtraData[ep_channel]'?: string;
  generate_epid?: string;
  validate_cc?: string;
  valability?: string;
  c2p_id?: string;
  c2p_cid?: string;
  lang?: 'ro' | 'en' | 'fr' | 'de' | 'it' | 'es' | 'hu';
};
