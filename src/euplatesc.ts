import * as crypto from 'crypto';
import axios from 'axios';
import FormData from 'form-data';

import {
  BaseOrder,
  CapturedTotal,
  CardArt,
  Config,
  Hmac,
  Invoice,
  InvoiceTransaction,
  Merchant,
  Methods,
  Order,
  SavedCard
} from './types';
import { Base, BaseHmac, Payload } from './types/Hmac.type';

export class EuPlatesc {
  private _merchantId: string;
  private _secretKey: string;
  private _testMode: boolean = false;

  private _testMerchantId: string = 'testaccount';
  private _testSecretKey: string = '00112233445566778899AABBCCDDEEFF';

  private _userKey: string;
  private _userApi: string;

  protected baseUrl = 'https://manager.euplatesc.ro/v3/index.php?action=ws';
  protected gatewayUrl = 'https://secure.euplatesc.ro/tdsprocess/tranzactd.php';

  /**
   * EuPlătesc class constructor
   *
   * @since 1.0.0
   * @param {string} param.merchantId Merchant ID.
   * @param {string} param.secretKey  Secret key.
   * @param {string} param.testMode   Optional. Test mode flag. Default: false.
   * @param {string} param.userKey    Optional. User key. You can find it in EuPlătesc panel > Settings > User settings. Default: ''.
   * @param {string} param.userApi    Optional. User API key. You can find it in EuPlătesc panel > Settings > User settings. Default: ''.
   */
  public constructor({ merchantId, secretKey, testMode, userKey, userApi }: Config) {
    this._merchantId = merchantId;
    this._secretKey = secretKey;
    this._testMode = 'boolean' === typeof testMode ? testMode : false;
    this._userKey = userKey || '';
    this._userApi = userApi || '';
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
   * Generate EuPlatesc payment URL
   *
   * @since   1.0.0
   * @param   {Object} data         Data to generate the payment URL.
   * @returns {paymentUrl: string}  The URL where a payment can be made on euplatesc.ro website.
   */
  public paymentUrl = (data: Hmac & Order): { paymentUrl: string } => {
    if (!data.amount) {
      throw new Error('The field amount is missing.');
    }
    if ('number' !== typeof data.amount) {
      throw new Error('The amount type should be numeric.');
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

    const dt = new Date();
    const date: { [k: string]: string } = {
      y: dt.getUTCFullYear().toString(),
      m: (dt.getUTCMonth() + 1).toString().padStart(2, '0'),
      d: dt.getUTCDate().toString().padStart(2, '0')
    };

    let hmacData: BaseHmac & BaseOrder = {
      amount: this.testMode ? '1.00' : data.amount.toString(),
      curr: data.currency,
      invoice_id: data.invoiceId,
      order_desc: data.orderDescription,
      merch_id: this.testMode ? this.testMerchantId : this.merchantId,
      timestamp: this.prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex') // 32 bytes for 64 chars
    };
    if (data.frequency) {
      hmacData.recurent_freq = data.frequency?.days.toString() || '30';
      if (data.frequency.expiresAt) {
        if (!(data.frequency.expiresAt instanceof Date)) {
          throw new Error('The frequency.expiresAt type should be Date.');
        }
        const expiresAt = new Date(data.frequency.expiresAt);
        hmacData.recurent_exp = [
          expiresAt.getUTCFullYear().toString(),
          (expiresAt.getUTCMonth() + 1).toString().padStart(2, '0'),
          expiresAt.getUTCDate().toString().padStart(2, '0')
        ].join('');
      } else {
        hmacData.recurent_exp = [date.y + 1, date.m, date.d].join('');
      }
    }
    if (data.valability) {
      const valability = new Date(data.valability);
      hmacData.valability = [
        valability.getFullYear(),
        (valability.getUTCMonth() + 1).toString().padStart(2, '0'),
        valability.getUTCDate().toString().padStart(2, '0'),
        valability.getUTCHours().toString().padStart(2, '0'),
        valability.getUTCMinutes().toString().padStart(2, '0'),
        valability.getUTCSeconds().toString().padStart(2, '0')
      ].join('');
    }

    data.c2pId && (hmacData.c2p_id = data.c2pId);
    data.c2pCid && (hmacData.c2p_cid = data.c2pCid);

    hmacData.fp_hash = this.computeHmac(hmacData);
    if (data.frequency) {
      hmacData.recurent = 'Base';
    }

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
    data.generateEpid && (hmacData.generate_epid = data.generateEpid);
    data.lang && (hmacData.lang = data.lang);

    const params = new URLSearchParams(hmacData);

    return { paymentUrl: `${this.gatewayUrl}?${params}` };
  };

  /**
   * Get status of a transaction
   *
   * @since   1.0.0
   * @param   {string}  params.epid      The EPID of the transaction.
   * @param   {string}  params.invoiceId The EPID of the transaction.
   * @returns {Promise}                  Either {success: string} for success or { error, ecode } for error.
   */
  public getStatus = async (params: {
    epid?: string;
    invoiceId?: string;
  }): Promise<{ success: string } | { error: string; ecode: string }> => {
    if (!params?.epid && !params?.invoiceId) {
      throw new Error('Please pass either "epid" or "invoiceId" param to "getTransactionPayload" method.');
    }

    const payload: Payload = {
      method: Methods.CHECK_STATUS,
      mid: this.merchantId,
      ...(params.epid ? { epid: params.epid } : { invoice_id: params.invoiceId })
    };

    return await this.genericRequest<Payload, { success: string } | { error: string; ecode: string }>(payload);
  };

  /**
   * Capture or reversal a transaction
   *
   * @since   1.0.0
   * @param   {string}  epid        The EPID of the transaction.
   * @param   {boolean} isReversal  Optional. Whether it's a reversal or capture. Default: false
   * @returns {Promise}             Either { success: "1" } for success or { error: string } for error.
   */
  public captureReversal = async (
    epid: string,
    isReversal: boolean = false
  ): Promise<{ success: string } | { error: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const payload: Payload = {
      method: isReversal ? Methods.REVERSAL : Methods.CAPTURE,
      ukey: this.userKey,
      epid
    };

    const useSecretKey = false;

    return await this.genericRequest<Payload, { success: string } | { error: string }>(payload, useSecretKey);
  };

  /**
   * Partial capture a transaction
   *
   * @since   1.0.0
   * @param   {string}  epid    The EPID of the transaction.
   * @param   {number}  amount  Amount to be captured.
   * @returns {Promise}         Either { success: "1" } for success or { error?: string; message?: string; ecode: string } for error.
   */
  public partialCapture = async (
    epid: string,
    amount: number
  ): Promise<{ success: string } | { error?: string; message?: string; ecode: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const payload: Payload = {
      method: Methods.PARTIAL_CAPTURE,
      ukey: this.userKey,
      amount: amount.toFixed(2).toString(),
      epid
    };

    const useSecretKey = false;

    return await this.genericRequest<
      Payload,
      { success: string } | { error?: string; message?: string; ecode: string }
    >(payload, useSecretKey);
  };

  /**
   * (Partial) Refund of a transaction
   *
   * @since   1.0.0
   * @param   {string}  epid    The EPID of the transaction.
   * @param   {string}  amount  Amount to be captured.
   * @param   {string}  reason  Optional. The reason why the transaction will be refunded.
   * @returns {Promise}         Either { success: "1" } for success or { error?: string; message?: string; ecode: string } for error.
   */
  public refund = async (
    epid: string,
    amount: number,
    reason: string = ''
  ): Promise<{ success: string } | { error?: string; message?: string; ecode: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const payload: Payload = {
      method: Methods.REFUND,
      ukey: this.userKey,
      amount: amount.toFixed(2).toString(),
      reason,
      epid
    };

    const useSecretKey = false;

    return await this.genericRequest<
      Payload,
      { success: string } | { error?: string; message?: string; ecode: string }
    >(payload, useSecretKey);
  };

  /**
   * Cancel recurring transaction
   *
   * Watch out: if you just test this method with a failed EPID, a valid recurring payment will be canceled :(
   * It might be an EuPlatesc bug.
   *
   * @since   1.0.0
   * @param   {string}  epid    The EPID of the transaction.
   * @param   {string}  reason  Optional. The reason why the transaction will be refunded.
   * @returns {Promise}         Either { success } for success or { error?: string; message?: string; ecode: string } for error.
   */
  public cancelRecurring = async (
    epid: string,
    reason: string = ''
  ): Promise<{ success: string } | { error?: string; message?: string; ecode: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const payload: Payload = {
      method: Methods.CANCEL_RECURRING,
      ukey: this.userKey,
      epid,
      reason
    };

    const useSecretKey = false;

    return await this.genericRequest<
      Payload,
      { success: string } | { error?: string; message?: string; ecode: string }
    >(payload, useSecretKey);
  };

  /**
   * Update invoice ID of transaction
   *
   * @since   1.0.0
   * @param   {string}  epid      The EPID of the transaction.
   * @param   {string}  invoiceId The invoice ID which will be updated the transaction with.
   * @returns {Promise}           Either { success: "1" } for success or { error } for error.
   */
  public updateInvoiceId = async (
    epid: string,
    invoiceId: string
  ): Promise<{ success: string } | { error: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const payload: Payload = {
      method: Methods.UPDATE_IID,
      ukey: this.userKey,
      epid,
      invoice_id: invoiceId
    };

    const useSecretKey = false;

    return await this.genericRequest<Payload, { success: string } | { error: string }>(payload, useSecretKey);
  };

  /**
   * Get invoice transaction list
   *
   * If `from` and `to` are sent empty will search invoices in last 3 months.
   * Returns max 100 records.
   *
   * @since   1.0.0
   * @param   {Date}    params.from Optional. Date the filter starts to search invoices from.
   * @param   {Date}    params.to   Optional. Date the filter ends to search invoices to.
   * @returns {Promise}             Either invoice list or error.
   */
  public getInvoiceList = async (params?: {
    from?: Date;
    to?: Date;
  }): Promise<{ success: Invoice[] } | { error: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const start = params?.from instanceof Date ? params.from.toISOString().split('T')[0] : '';
    const end = params?.to instanceof Date ? params.to.toISOString().split('T')[0] : '';

    const payload: Payload = {
      method: Methods.INVOICES,
      ukey: this.userKey,
      mid: this.merchantId,
      from: start,
      to: end
    };

    const useSecretKey = false;

    return await this.genericRequest<Payload, { success: Invoice[] } | { error: string }>(payload, useSecretKey);
  };

  /**
   * Get invoice transaction list
   *
   * @since   1.0.0
   * @param   {string}  invoice  Settlement invoice number.
   * @returns {Promise}          Either invoice transaction list or error.
   */
  public getInvoiceTransactions = async (
    invoice: string
  ): Promise<{ success: InvoiceTransaction[] } | { error: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const payload: Payload = {
      method: Methods.INVOICE,
      ukey: this.userKey,
      invoice
    };

    const useSecretKey = false;

    return await this.genericRequest<Payload, { success: InvoiceTransaction[] } | { error: string }>(
      payload,
      useSecretKey
    );
  };

  /**
   * Get captured total
   *
   * If `params.from` and `params.to` are sent empty will search in last month.
   *
   * @since   1.0.0
   * @param   {string} params.mid   Optional. Merchant IDs sepparated by comma. If empty, it will setup the merchant ID from client initialization.
   * @param   {Date}   params.from  Optional. Date the filter starts to search totals from.
   * @param   {Date}   params.to    Optional. Date the filter ends to search totals to.
   * @returns {Promise}             Either totals of captured amounts or error.
   */
  public getCapturedTotal = async (params?: {
    mids?: string;
    from?: Date;
    to?: Date;
  }): Promise<{ success: CapturedTotal } | { error: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const start = params?.from instanceof Date ? params.from.toISOString().split('T')[0] : '';
    const end = params?.to instanceof Date ? params.to.toISOString().split('T')[0] : '';

    const payload: Payload = {
      method: Methods.CAPTURED_TOTAL,
      ukey: this.userKey,
      mids: params?.mids ? params?.mids.replaceAll(' ', '') : this.merchantId,
      from: start,
      to: end
    };

    const useSecretKey = false;

    return await this.genericRequest<Payload, { success: CapturedTotal } | { error: string }>(payload, useSecretKey);
  };

  /**
   * Get card art data
   *
   * @since   1.0.0
   * @param   {string}  epid  The EPID of the transaction.
   * @returns {Promise}       Either the card art data or error.
   */
  public getCardArt = async (epid: string): Promise<{ success: CardArt } | { error: string; ecode: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const payload: Payload = {
      method: Methods.CARDART,
      ukey: this.userKey,
      ep_id: epid
    };

    const useSecretKey = false;

    return await this.genericRequest<Payload, { success: CardArt } | { error: string; ecode: string }>(
      payload,
      useSecretKey
    );
  };

  /**
   * Get saved cards of a customer
   *
   * @since   1.0.0
   * @param   {string}  clientId  The ID of the client.
   * @param   {string}  mid       Optional. Merchant ID. If empty, it will setup the merchant ID from client initialization.
   * @returns {Promise}           Either list of cards or error.
   */
  public getSavedCards = async (
    clientId: string,
    mid?: string
  ): Promise<{ cards: SavedCard[] } | { error: string; ecode: string }> => {
    const payload: Payload = {
      method: Methods.C2P_CARDS,
      mid: mid ?? this.merchantId,
      c2p_id: clientId
    };

    return await this.genericRequest<Payload, { cards: SavedCard[] } | { error: string; ecode: string }>(payload);
  };

  /**
   * Remove card of a customer
   *
   * @since   1.0.0
   * @param   {string}  clientId  The ID of the client.
   * @param   {string}  cardId    The ID of the card.
   * @param   {string}  mid       Optional. Merchant ID. If empty, it will setup the merchant ID from client initialization.
   * @returns {Promise}           Either { success: "1" } for success or { error, ecode } for error.
   */
  public removeCard = async (
    clientId: string,
    cardId: string,
    mid?: string
  ): Promise<{ success: string } | { error: string; ecode: string }> => {
    const payload: Payload = {
      method: Methods.C2P_DELETE,
      mid: mid ?? this.merchantId,
      c2p_id: clientId,
      c2p_cid: cardId
    };

    return await this.genericRequest<Payload, { success: string } | { error: string; ecode: string }>(payload);
  };

  /**
   * Check merchant ID
   *
   * @since   1.0.0
   * @param   {string}  mid Optional. Merchant ID. If empty, it will setup the merchant ID from client initialization.
   * @returns {Promise}     Merchant data or error.
   */
  public checkMid = async (mid?: string): Promise<Merchant | { error: string }> => {
    const payload: Payload = {
      method: Methods.CHECK_MID,
      mid: mid ?? this.merchantId
    };

    return await this.genericRequest<Payload, Merchant | { error: string }>(payload);
  };

  /**
   * Compute Hmac from data object
   *
   * @since   1.0.0
   * @param   {Base<T>} data          Object data created in order to generate the hash.
   * @param   {boolean} useSecretKey  Whether to use the secret key or the user API key.
   * @returns {string}                The hash generated from passed data.
   */
  public computeHmac = <T>(data: Base<T>, useSecretKey: boolean = true): string => {
    let hmac: string = '';
    for (const key in data) {
      if (0 === data[key as keyof Base<T>]?.toString()?.length) {
        hmac += '-';
      } else {
        hmac += `${data[key as keyof Base<T>]?.toString()?.length}${data[key as keyof Base<T>] as string}`;
      }
    }
    const secretKey = this.testMode ? this.testSecretKey : useSecretKey ? this.secretKey : this.userApi;
    const binKey = Buffer.from(secretKey, 'hex');
    const hash = crypto.createHmac('md5', binKey).update(hmac, 'utf8').digest('hex');

    return hash;
  };

  /**
   * Wrapper for generic method that makes request with dynamic payload
   *
   * @since   1.0.0
   * @param   {T}       payload       Data passed to make requests to EuPlatesc with.
   * @param   {boolean} useSecretKey  Optional. Whether to use secret key or user API key for Hmac hashing. Default: true.
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
      formData.append(key, data[key as keyof T]);
    }

    const response = await axios.post(this.baseUrl, formData);

    return response.data;
  };

  /**
   * Format timestamp as YYYYMMDDHHMMSS
   *
   * @since   1.0.0
   * @returns {string} Formatted timestamp.
   */
  protected prepareTS = (): string => {
    const dt = new Date();
    const date: { [k: string]: string } = {
      y: dt.getUTCFullYear().toString(),
      mo: (dt.getUTCMonth() + 1).toString().padStart(2, '0'),
      d: dt.getUTCDate().toString().padStart(2, '0'),
      h: dt.getUTCHours().toString().padStart(2, '0'),
      mi: dt.getUTCMinutes().toString().padStart(2, '0'),
      s: dt.getUTCSeconds().toString().padStart(2, '0')
    };

    let timestamp: string = '';
    Object.keys(date).map((k) => (timestamp += date[k]));

    return timestamp;
  };
}
