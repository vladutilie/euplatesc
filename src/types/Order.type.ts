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

export type Extra = {
  Extra?: string;
  silentUrl?: string;
  successUrl?: string;
  failedUrl?: string;
  epTarget?: string;
  epMethod?: string;
  backToSite?: string;
  backToSiteMethod?: string;
  expireUrl?: string;
  rate?: string;
  filterRate?: string;
  channel?: string;
  generateEpid?: string;
  valability?: Date;
  c2pId?: string;
  c2pCid?: string;
  lang?: 'ro' | 'en' | 'fr' | 'de' | 'it' | 'es' | 'hu';
};

export type BaseOrder = {
  fp_hash?: string;
  recurent?: 'Base';
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
  valability?: string;
  c2p_id?: string;
  c2p_cid?: string;
  lang?: 'ro' | 'en' | 'fr' | 'de' | 'it' | 'es' | 'hu';
};
