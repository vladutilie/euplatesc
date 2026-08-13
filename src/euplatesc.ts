import * as crypto from 'crypto';

import {
  Base,
  BaseHmac,
  BaseOrder,
  CapturedTotal,
  CardArt,
  Config,
  Currency,
  Hmac,
  Invoice,
  InvoiceTransaction,
  Merchant,
  Methods,
  Order,
  Payload,
  Response,
  ResponseHmac,
  ResponseResult,
  SavedCard,
  TransactionFilter,
  TransactionStatus
} from './types';

/** Result shape shared by most of the web service methods. */
type Result<T> = { success: T } | { error: string; ecode?: string; message?: string };

export class EuPlatesc {
  private _merchantId: string;
  private _secretKey: string;
  private _testMode: boolean;

  private _testMerchantId: string = 'testaccount';
  private _testSecretKey: string = '00112233445566778899AABBCCDDEEFF';

  private _userKey: string;
  private _userApi: string;

  private _timeout: number;

  protected baseUrl = 'https://manager.euplatesc.ro/v3/index.php?action=ws';
  protected gatewayUrl = 'https://secure.euplatesc.ro/tdsprocess/tranzactd.php';

  /**
   * EuPlătesc class constructor.
   *
   * @since 1.0.0
   * @param {string}  param.merchantId Merchant ID.
   * @param {string}  param.secretKey  Secret key.
   * @param {boolean} param.testMode   Optional. Test mode flag. Default: false.
   * @param {string}  param.userKey    Optional. User key. You can find it in EuPlătesc panel > Settings > User settings. Default: ''.
   * @param {string}  param.userApi    Optional. User API key. You can find it in EuPlătesc panel > Settings > User settings. Default: ''.
   * @param {number}  param.timeout    Optional. Request timeout in milliseconds. Default: 30000.
   */
  public constructor({ merchantId, secretKey, testMode, userKey, userApi, timeout }: Config) {
    if (!merchantId || !secretKey) {
      throw new Error('Please instantiate the EuPlătesc client with both "merchantId" and "secretKey".');
    }

    this._merchantId = merchantId;
    this._secretKey = secretKey;
    this._testMode = 'boolean' === typeof testMode ? testMode : false;
    this._userKey = userKey || '';
    this._userApi = userApi || '';
    this._timeout = timeout ?? 30_000;
  }

  get merchantId(): string {
    return this._merchantId;
  }

  get testMerchantId(): string {
    return this._testMerchantId;
  }

  get testSecretKey(): string {
    return this._testSecretKey;
  }

  get secretKey(): string {
    return this._secretKey;
  }

  get testMode(): boolean {
    return this._testMode;
  }

  get userKey(): string {
    return this._userKey;
  }

  get userApi(): string {
    return this._userApi;
  }

  /**
   * Build the full field set posted to the EuPlătesc gateway.
   *
   * Prefer {@link paymentUrl} to redirect a customer. Use this method when you
   * need to POST the fields yourself - which is the only supported way to run a
   * subsequent recurring transaction (`recurrentType: 'Recurent'`), as that call
   * is made server to server, without the customer being present.
   *
   * @since   1.1.0
   * @param   {Hmac & Order} data Data to generate the payment fields.
   * @returns {Record<string, string>} The fields to send to the gateway endpoint.
   */
  public paymentParams = (data: Hmac & Order): Record<string, string> => {
    if (undefined === data.amount || null === data.amount) {
      throw new Error('The field amount is missing.');
    }
    if ('number' !== typeof data.amount || !Number.isFinite(data.amount)) {
      throw new Error('The amount type should be numeric.');
    }
    if (data.amount < 0) {
      throw new Error('The amount should not be negative.');
    }
    if (!data.currency) {
      throw new Error('The field currency is missing.');
    }
    if (!data.invoiceId) {
      throw new Error('The field invoiceId is missing.');
    }
    if (!data.orderDescription) {
      throw new Error('The field orderDescription is missing.');
    }
    if (data.frequency && ('number' !== typeof data.frequency.days || data.frequency.days < 1)) {
      throw new Error('The frequency.days should be a positive number.');
    }

    const hmacData: BaseHmac & BaseOrder = {
      // `baseEPID` takes part in the hash before `amount`, hence it is set first.
      ...(data.baseEpId ? { baseEPID: data.baseEpId } : {}),
      amount: this.testMode ? '1.00' : data.amount.toFixed(2),
      curr: data.currency,
      invoice_id: data.invoiceId.trim(),
      order_desc: data.orderDescription,
      merch_id: this.testMode ? this.testMerchantId : this.merchantId,
      timestamp: this.prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };

    // Every field below is appended to the hash after `nonce`, in this exact order.
    if (data.frequency) {
      hmacData.recurent_freq = data.frequency.days.toString();
      hmacData.recurent_exp = this.formatDate(
        data.frequency.expiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      );
    }
    if (data.valability) {
      hmacData.valability = this.formatDate(data.valability, true);
    }
    data.c2pId && (hmacData.c2p_id = data.c2pId);
    data.c2pCid && (hmacData.c2p_cid = data.c2pCid);

    hmacData.fp_hash = this.computeHmac(hmacData);

    // Fields outside the hash.
    const recurrentType = data.recurrentType ?? (data.frequency ? 'Base' : data.baseEpId ? 'Recurent' : undefined);
    recurrentType && (hmacData.recurent = recurrentType);

    data.billingFirstName && (hmacData.fname = data.billingFirstName);
    data.billingLastName && (hmacData.lname = data.billingLastName);
    data.billingCompany && (hmacData.company = data.billingCompany);
    data.billingAddress && (hmacData.add = data.billingAddress);
    data.billingCity && (hmacData.city = data.billingCity);
    data.billingState && (hmacData.state = data.billingState);
    data.billingZip && (hmacData.zip = data.billingZip);
    data.billingCountry && (hmacData.country = data.billingCountry);
    data.billingPhone && (hmacData.phone = data.billingPhone);
    data.billingEmail && (hmacData.email = data.billingEmail);

    data.shippingFirstName && (hmacData.sfname = data.shippingFirstName);
    data.shippingLastName && (hmacData.slname = data.shippingLastName);
    data.shippingCompany && (hmacData.scompany = data.shippingCompany);
    data.shippingAddress && (hmacData.sadd = data.shippingAddress);
    data.shippingCity && (hmacData.scity = data.shippingCity);
    data.shippingState && (hmacData.sstate = data.shippingState);
    data.shippingZip && (hmacData.szip = data.shippingZip);
    data.shippingCountry && (hmacData.scountry = data.shippingCountry);
    data.shippingPhone && (hmacData.sphone = data.shippingPhone);
    data.shippingEmail && (hmacData.semail = data.shippingEmail);

    data.Extra && (hmacData.ExtraData = data.Extra);
    data.silentUrl && (hmacData['ExtraData[silenturl]'] = data.silentUrl);
    data.silentUrlSec && (hmacData['ExtraData[silenturlsec]'] = data.silentUrlSec);
    data.successUrl && (hmacData['ExtraData[successurl]'] = data.successUrl);
    data.failedUrl && (hmacData['ExtraData[failedurl]'] = data.failedUrl);
    data.epTarget && (hmacData['ExtraData[ep_target]'] = data.epTarget);
    data.epMethod && (hmacData['ExtraData[ep_method]'] = data.epMethod);
    data.backToSite && (hmacData['ExtraData[backtosite]'] = data.backToSite);
    data.backToSiteMethod && (hmacData['ExtraData[backtosite_method]'] = data.backToSiteMethod);
    data.expireUrl && (hmacData['ExtraData[expireurl]'] = data.expireUrl);
    data.rate && (hmacData['ExtraData[rate]'] = data.rate);
    data.filterRate && (hmacData['ExtraData[filtru_rate]'] = data.filterRate);
    data.channel && (hmacData['ExtraData[ep_channel]'] = data.channel);
    data.generateEpId && (hmacData.generate_epid = data.generateEpId);
    data.validateCc && (hmacData.validate_cc = '1');
    data.lang && (hmacData.lang = data.lang);

    return hmacData as Record<string, string>;
  };

  /**
   * Generate EuPlătesc payment URL.
   *
   * @since   1.0.0
   * @param   {Hmac & Order}        data  Data to generate the payment URL.
   * @returns {paymentUrl: string}        The URL to euplatesc.ro payment form.
   */
  public paymentUrl = (data: Hmac & Order): { paymentUrl: string } => {
    const params = new URLSearchParams(this.paymentParams(data));

    return { paymentUrl: `${this.gatewayUrl}?${params}` };
  };

  /**
   * Check the response after the user makes the payment and returns to the website.
   *
   * The additional fields (`secStatus`, `rrn`, `mcard`, ...) are only sent when
   * enabled for the MID in the EuPlătesc panel. Pass exactly the ones you
   * received: they take part in the hash and any extra or missing one makes the
   * verification fail.
   *
   * @since 1.0.0
   * @param {Response} param
   * @param {string}   param.amount     The paid transaction's amount.
   * @param {Currency} param.currency   The paid transaction's currency.
   * @param {string}   param.invoiceId  The paid transaction's invoice ID.
   * @param {string}   param.epId       The paid transaction's ep ID.
   * @param {string}   param.merchantId The transaction's merchant ID.
   * @param {string}   param.action     The paid transaction's action.
   * @param {string}   param.message    The paid transaction's message.
   * @param {string}   param.approval   The paid transaction's approval value.
   * @param {string}   param.timestamp  The paid transaction's timestamp.
   * @param {string}   param.nonce      The paid transaction's nonce.
   * @param {string}   param.fpHash     The paid transaction's hash.
   * @returns {ResponseResult}          The verifications' response.
   */
  public checkResponse = ({
    amount,
    currency,
    invoiceId,
    epId,
    merchantId,
    action,
    message,
    approval,
    timestamp,
    nonce,
    fpHash,
    secStatus,
    rrn,
    mcard,
    cardExp,
    discountAmount,
    paymentChannel,
    cardType,
    bin,
    rate,
    cardHolder,
    email,
    rtype,
    cce
  }: Response): ResponseResult => {
    const data: ResponseHmac = {
      amount,
      curr: currency as Currency,
      invoice_id: invoiceId,
      ep_id: epId,
      merch_id: merchantId,
      action,
      message,
      approval,
      timestamp,
      nonce
    };

    // Order matters: the gateway appends the enabled fields after `nonce` exactly like this.
    const additional: [string, string | undefined][] = [
      ['sec_status', secStatus],
      ['rrn', rrn],
      ['mcard', mcard],
      ['card_exp', cardExp],
      ['discount_amount', discountAmount],
      ['payment_channel', paymentChannel],
      ['card_type', cardType],
      ['bin', bin],
      ['rate', rate],
      ['card_holder', cardHolder],
      ['email', email],
      ['rtype', rtype],
      ['cce', cce]
    ];
    for (const [key, value] of additional) {
      if (undefined !== value) {
        (data as Record<string, string>)[key] = value;
      }
    }

    if (!this.safeCompare(fpHash, this.computeHmac<ResponseHmac>(data))) {
      return { success: false, response: 'invalid' };
    }

    return '0' === action ? { success: true, response: 'complete' } : { success: false, response: 'failed' };
  };

  /**
   * Get the status of a transaction.
   *
   * @since   1.0.0
   * @param   {string}  params.epId      The transaction's ep ID.
   * @param   {string}  params.invoiceId The transaction's invoice ID.
   * @returns {Promise}                  Either { success } for success or { error, ecode } for error.
   */
  public getStatus = (params: {
    epId?: string;
    invoiceId?: string;
  }): Promise<Result<string | TransactionStatus[]>> => {
    if (!params?.epId && !params?.invoiceId) {
      throw new Error('Please pass either "epId" or "invoiceId" param to "getStatus" method.');
    }

    const payload: Payload = {
      method: Methods.CHECK_STATUS,
      mid: this.merchantId,
      ...(params.epId ? { epid: params.epId } : { invoice_id: params.invoiceId })
    };

    return this.genericRequest<Payload, Result<string | TransactionStatus[]>>(payload);
  };

  /**
   * Get the transaction receipt as a base64 encoded PDF.
   *
   * @since   1.1.0
   * @param   {string}  epId  The transaction's ep ID.
   * @returns {Promise}       Either { success: '1', file } for success or { error, ecode } for error.
   */
  public printTransaction = (
    epId: string
  ): Promise<{ success: string; file: string } | { error: string; ecode?: string }> => {
    const payload: Payload = { method: Methods.PRINT, mid: this.merchantId, epid: epId };

    return this.genericRequest<Payload, { success: string; file: string } | { error: string; ecode?: string }>(payload);
  };

  /**
   * Capture a transaction.
   *
   * @since   1.0.0
   * @param   {string}  epId  The transaction's ep ID.
   * @returns {Promise}       Either { success: '1' } for success or { error, ecode } for error.
   */
  public capture = (epId: string): Promise<Result<string>> => {
    this.requireUserCredentials('capture');

    const payload: Payload = { method: Methods.CAPTURE, ukey: this.userKey, epid: epId };

    return this.genericRequest<Payload, Result<string>>(payload, false);
  };

  /**
   * Reversal of a transaction.
   *
   * @since   1.0.0
   * @param   {string}  epId  The transaction's ep ID.
   * @returns {Promise}       Either { success: '1' } for success or { error, ecode } for error.
   */
  public reversal = (epId: string): Promise<Result<string>> => {
    this.requireUserCredentials('reversal');

    const payload: Payload = { method: Methods.REVERSAL, ukey: this.userKey, epid: epId };

    return this.genericRequest<Payload, Result<string>>(payload, false);
  };

  /**
   * Partial capture of a transaction.
   *
   * @since   1.0.0
   * @param   {string}  epId    The transaction's ep ID.
   * @param   {number}  amount  Partially captured amount.
   * @returns {Promise}         Either { success: '1' } for success or { error, ecode } for error.
   */
  public partialCapture = (epId: string, amount: number): Promise<Result<string>> => {
    this.requireUserCredentials('partialCapture');

    const payload: Payload = {
      method: Methods.PARTIAL_CAPTURE,
      ukey: this.userKey,
      amount: amount.toFixed(2),
      epid: epId
    };

    return this.genericRequest<Payload, Result<string>>(payload, false);
  };

  /**
   * (Partial) Refund a transaction.
   *
   * @since   1.0.0
   * @param   {string}  epId    The transaction's ep ID.
   * @param   {number}  amount  The refunded amount. It can be smaller than the total amount of the transaction.
   * @param   {string}  reason  Optional. The reason, the transaction is to be refunded. Must be 5-55 characters when set.
   * @returns {Promise}         Either { success: '1' } for success or { error, ecode } for error.
   */
  public refund = (epId: string, amount: number, reason: string = ''): Promise<Result<string>> => {
    this.requireUserCredentials('refund');

    const payload: Payload = {
      method: Methods.REFUND,
      ukey: this.userKey,
      amount: amount.toFixed(2),
      reason,
      epid: epId
    };

    return this.genericRequest<Payload, Result<string>>(payload, false);
  };

  /**
   * Cancel a recurring transaction.
   *
   * Watch out: if you just test this method with a failed EPID, a valid recurring payment will be canceled :(
   * It might be an EuPlătesc bug.
   *
   * @since   1.0.0
   * @param   {string}  epId    The base EPID of the recurring chain, or any EPID that follows it.
   * @param   {string}  reason  Optional. The reason, the transaction is to be canceled.
   * @returns {Promise}         Either { success: baseEPID } for success or { error, ecode } for error.
   */
  public cancelRecurring = (epId: string, reason: string = ''): Promise<Result<string>> => {
    this.requireUserCredentials('cancelRecurring');

    const payload: Payload = {
      method: Methods.CANCEL_RECURRING,
      ukey: this.userKey,
      epid: epId,
      reason
    };

    return this.genericRequest<Payload, Result<string>>(payload, false);
  };

  /**
   * Update invoice ID of a transaction.
   *
   * @since   1.0.0
   * @param   {string}  epId      The transaction's ep ID.
   * @param   {string}  invoiceId The ID of the invoice to be updated.
   * @returns {Promise}           Either { success: '1' } for success or { error } for error.
   */
  public updateInvoiceId = (epId: string, invoiceId: string): Promise<Result<string>> => {
    this.requireUserCredentials('updateInvoiceId');

    const payload: Payload = {
      method: Methods.UPDATE_IID,
      ukey: this.userKey,
      epid: epId,
      invoice_id: invoiceId
    };

    return this.genericRequest<Payload, Result<string>>(payload, false);
  };

  /**
   * Get invoice list.
   *
   * If `from` and `to` are sent empty, it will look for invoices from the last three months.
   * It returns max 100 records.
   *
   * @since   1.0.0
   * @param   {Date}    params.from Optional. The date from which the filter starts to search invoices.
   * @param   {Date}    params.to   Optional. The date to which the filter ends to search invoices.
   * @returns {Promise}             Either invoice list or error.
   */
  public getInvoiceList = (params?: { from?: Date; to?: Date }): Promise<Result<Invoice[]>> => {
    this.requireUserCredentials('getInvoiceList');

    const payload: Payload = {
      method: Methods.INVOICES,
      ukey: this.userKey,
      mid: this.merchantId,
      from: this.formatIsoDate(params?.from),
      to: this.formatIsoDate(params?.to)
    };

    return this.genericRequest<Payload, Result<Invoice[]>>(payload, false);
  };

  /**
   * Get invoice transaction list.
   *
   * @since   1.0.0
   * @param   {string}  invoice  Settlement invoice number.
   * @returns {Promise}          Either invoice transaction list or error.
   */
  public getInvoiceTransactions = (invoice: string): Promise<Result<InvoiceTransaction[]>> => {
    this.requireUserCredentials('getInvoiceTransactions');

    const payload: Payload = { method: Methods.INVOICE, ukey: this.userKey, invoice };

    return this.genericRequest<Payload, Result<InvoiceTransaction[]>>(payload, false);
  };

  /**
   * Get captured total.
   *
   * If `params.from` and `params.to` are sent empty will search in last month.
   *
   * @since   1.0.0
   * @param   {string} params.mids  Optional. Separated merchant IDs by commas. If empty, it will set up the merchant ID from client initialization.
   * @param   {Date}   params.from  Optional. The date from which the filter starts to search totals.
   * @param   {Date}   params.to    Optional. The date to which the filter ends to search totals.
   * @returns {Promise}             Either totals of captured amounts or error.
   */
  public getCapturedTotal = (params?: {
    mids?: string;
    from?: Date;
    to?: Date;
  }): Promise<Result<CapturedTotal>> => {
    this.requireUserCredentials('getCapturedTotal');

    const payload: Payload = {
      method: Methods.CAPTURED_TOTAL,
      ukey: this.userKey,
      mids: params?.mids ? params.mids.replace(/\s/g, '') : this.merchantId,
      from: this.formatIsoDate(params?.from),
      to: this.formatIsoDate(params?.to)
    };

    return this.genericRequest<Payload, Result<CapturedTotal>>(payload, false);
  };

  /**
   * Get the transaction list.
   *
   * Returns max. 5000 transactions per page and the searched interval cannot be
   * longer than one year.
   *
   * @since   1.1.0
   * @param   {string} params.mid    Optional. Merchant ID. If empty, it will set up the merchant ID from client initialization.
   * @param   {Date}   params.from   Optional. The date from which the filter starts to search transactions.
   * @param   {Date}   params.to     Optional. The date to which the filter ends to search transactions.
   * @param   {string} params.by     Optional. The date field the interval applies to. Default: 'complete'.
   * @param   {string} params.status Optional. Transaction status filter. Default: 'all'.
   * @param   {number} params.limit  Optional. Number of returned records, 1-5000. Default: 5000.
   * @param   {number} params.page   Optional. Result page. Default: 1.
   * @returns {Promise}              Either the transaction list or error.
   */
  public getTransactionList = (params?: TransactionFilter): Promise<Result<string | TransactionStatus[]>> => {
    if (undefined !== params?.limit && (params.limit < 1 || params.limit > 5000)) {
      throw new Error('The limit should be between 1 and 5000.');
    }
    if (undefined !== params?.page && params.page < 1) {
      throw new Error('The page should be greater than 0.');
    }

    const payload: Payload = {
      method: Methods.TRANSACTIONS,
      mid: params?.mid ?? this.merchantId,
      from: this.formatDateTime(params?.from),
      to: this.formatDateTime(params?.to),
      ...(params?.by ? { by: params.by } : {}),
      status: params?.status ?? 'all',
      ...(undefined !== params?.limit ? { limit: params.limit.toString() } : {}),
      ...(undefined !== params?.page ? { page: params.page.toString() } : {})
    };

    return this.genericRequest<Payload, Result<string | TransactionStatus[]>>(payload);
  };

  /**
   * Get card art data.
   *
   * @since   1.0.0
   * @param   {string}  epId  The EPID of the Base transaction.
   * @returns {Promise}       Either the card art data or error.
   */
  public getCardArt = (epId: string): Promise<CardArt | { error: string; ecode?: string }> => {
    this.requireUserCredentials('getCardArt');

    const payload: Payload = { method: Methods.CARDART, ukey: this.userKey, ep_id: epId };

    return this.genericRequest<Payload, CardArt | { error: string; ecode?: string }>(payload, false);
  };

  /**
   * Get saved cards of a customer.
   *
   * @since   1.0.0
   * @param   {string}  clientId  The ID of the client.
   * @param   {string}  mid       Optional. Merchant ID. If empty, it will set up the merchant ID from client initialization.
   * @returns {Promise}           Either list of cards or error.
   */
  public getSavedCards = (
    clientId: string,
    mid?: string
  ): Promise<{ cards: SavedCard[] } | { error: string; ecode?: string }> => {
    const payload: Payload = {
      method: Methods.C2P_CARDS,
      mid: mid ?? this.merchantId,
      c2p_id: clientId
    };

    return this.genericRequest<Payload, { cards: SavedCard[] } | { error: string; ecode?: string }>(payload);
  };

  /**
   * Remove a saved card of a customer.
   *
   * @since   1.0.0
   * @param   {string}  clientId  The ID of the client.
   * @param   {string}  cardId    The ID of the card.
   * @param   {string}  mid       Optional. Merchant ID. If empty, it will set up the merchant ID from client initialization.
   * @returns {Promise}           Either { success: '1' } for success or { error, ecode } for error.
   */
  public removeCard = (clientId: string, cardId: string, mid?: string): Promise<Result<string>> => {
    const payload: Payload = {
      method: Methods.C2P_DELETE,
      mid: mid ?? this.merchantId,
      c2p_id: clientId,
      c2p_cid: cardId
    };

    return this.genericRequest<Payload, Result<string>>(payload);
  };

  /**
   * Check a merchant ID.
   *
   * @since   1.0.0
   * @param   {string}  mid Optional. Merchant ID. If empty, it will set up the merchant ID from client initialization.
   * @returns {Promise}     Merchant data or error.
   */
  public checkMid = (mid?: string): Promise<Merchant | { error: string }> => {
    const payload: Payload = { method: Methods.CHECK_MID, mid: mid ?? this.merchantId };

    return this.genericRequest<Payload, Merchant | { error: string }>(payload);
  };

  /**
   * Compute Hmac from the data object.
   *
   * The gateway builds the signed string by concatenating, for every field in
   * order, its length followed by its value - or a single `-` when the field is
   * empty or not set.
   *
   * @since   1.0.0
   * @param   {Base<T>} data          Created object data to generate the hash.
   * @param   {boolean} useSecretKey  Whether to use the secret key or the user API key.
   * @returns {string}                The generated hash from the passed data.
   */
  public computeHmac = <T>(data: Base<T>, useSecretKey: boolean = true): string => {
    let hmac: string = '';
    for (const key in data) {
      const value = data[key as keyof Base<T>];
      const stringified = null === value || undefined === value ? '' : String(value);
      hmac += 0 === stringified.length ? '-' : `${stringified.length}${stringified}`;
    }

    const secretKey = this.testMode ? this.testSecretKey : useSecretKey ? this.secretKey : this.userApi;
    const binKey = Buffer.from(secretKey, 'hex');
    const hash = crypto.createHmac('md5', binKey).update(hmac, 'utf8').digest('hex');

    return hash.toUpperCase();
  };

  /**
   * Wrapper for a generic method that requests with dynamic payload.
   *
   * @since   1.0.0
   * @param   {T}       payload       Passed data to request the EuPlătesc with.
   * @param   {boolean} useSecretKey  Optional. Whether to use the secret key or user API key for Hmac hashing. Default: true.
   * @returns {Promise}
   */
  protected genericRequest = async <T, U>(payload: T, useSecretKey: boolean = true): Promise<U> => {
    const data: Base<T> = {
      ...payload,
      timestamp: this.prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    data.fp_hash = this.computeHmac<T>(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      const value = data[key as keyof Base<T>];
      formData.append(key, null === value || undefined === value ? '' : String(value));
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(this._timeout)
    });

    // The gateway replies with JSON, but not always with a JSON content type.
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`EuPlătesc responded with ${response.status} ${response.statusText}: ${body.slice(0, 200)}`);
    }

    try {
      return JSON.parse(body) as U;
    } catch {
      throw new Error(`EuPlătesc returned a malformed response: ${body.slice(0, 200)}`);
    }
  };

  /**
   * Throw a descriptive error for the methods signed with the user API key.
   *
   * @since 1.1.0
   * @param {string} method The name of the calling method, used in the message.
   */
  protected requireUserCredentials = (method: string): void => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        `To use the "${method}()" method you should instantiate the EuPlătesc client with both "userKey" and "userApi" keys.`
      );
    }
  };

  /**
   * Compare two hashes without leaking their content through the comparison time.
   *
   * @since   1.1.0
   * @param   {string}  a First hash.
   * @param   {string}  b Second hash.
   * @returns {boolean}   Whether the hashes match, case-insensitively.
   */
  protected safeCompare = (a: string, b: string): boolean => {
    const bufferA = Buffer.from((a ?? '').toUpperCase(), 'utf8');
    const bufferB = Buffer.from((b ?? '').toUpperCase(), 'utf8');

    return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
  };

  /**
   * Format a date in GMT, as YYYYMMDD or YYYYMMDDHHmmSS.
   *
   * @since   1.1.0
   * @param   {Date}    date      The date to format.
   * @param   {boolean} withTime  Optional. Whether to append the time part. Default: false.
   * @returns {string}            Formatted date.
   */
  protected formatDate = (date: Date, withTime: boolean = false): string => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new Error('An invalid date was passed.');
    }

    const parts = [
      date.getUTCFullYear().toString(),
      (date.getUTCMonth() + 1).toString().padStart(2, '0'),
      date.getUTCDate().toString().padStart(2, '0')
    ];

    if (withTime) {
      parts.push(
        date.getUTCHours().toString().padStart(2, '0'),
        date.getUTCMinutes().toString().padStart(2, '0'),
        date.getUTCSeconds().toString().padStart(2, '0')
      );
    }

    return parts.join('');
  };

  /**
   * Format a date as YYYY-mm-dd, or an empty string when not set.
   *
   * @since   1.1.0
   * @param   {Date}   date Optional. The date to format.
   * @returns {string}      Formatted date.
   */
  protected formatIsoDate = (date?: Date): string =>
    date instanceof Date ? date.toISOString().split('T')[0] : '';

  /**
   * Format a date as YYYY-mm-dd HH:mm:ss, or an empty string when not set.
   *
   * @since   1.1.0
   * @param   {Date}   date Optional. The date to format.
   * @returns {string}      Formatted date.
   */
  protected formatDateTime = (date?: Date): string =>
    date instanceof Date ? date.toISOString().replace('T', ' ').slice(0, 19) : '';

  /**
   * Format the current timestamp in GMT, as YYYYMMDDHHmmSS.
   *
   * @since   1.0.0
   * @returns {string} Formatted timestamp.
   */
  protected prepareTS = (): string => this.formatDate(new Date(), true);
}
