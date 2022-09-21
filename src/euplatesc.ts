import * as crypto from 'crypto';
import axios from 'axios';
import FormData from 'form-data';

import { EUPLATESC_GATEWAY_URL, EUPLATESC_TEST_MERCHANT_ID, EUPLATESC_TEST_SECRET_KEY } from './utils/constants';
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
import {
  BaseHmac,
  BaseTransactionHmac,
  CancelHmac,
  CaptureHmac,
  ComputeHmacData,
  InvoiceListHmac,
  InvoiceTransactionHmac,
  PartialCaptureHmac,
  RefundHmac,
  RemoveCardHmac,
  SavedCardsHmac,
  UpdateInvoiceIdHmac
} from './types/Hmac.type';
import { prepareTS } from './utils/helpers';

export class EuPlatesc {
  protected baseUrl = 'https://manager.euplatesc.ro/v3/?action=ws';

  _merchantId: string;
  _secretKey: string;
  _testMode = false;

  _userKey: string;
  _userApi: string;

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
      merch_id: this.testMode ? EUPLATESC_TEST_MERCHANT_ID : this.merchantId,
      timestamp: prepareTS(),
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

    return { paymentUrl: `${EUPLATESC_GATEWAY_URL}?${params}` };
  };

  /**
   * Get status of a transaction
   *
   * @since 1.0.0
   * @param   {string}  params.epid      The EPID of the transaction.
   * @param   {string}  params.invoiceId The EPID of the transaction.
   * @returns {Promise}                  Either
   */
  public getStatus = async (params: {
    epid?: string;
    invoiceId?: string;
  }): Promise<{ success: string } | { error: string; ecode: string }> => {
    if (!params?.epid && !params?.invoiceId) {
      throw new Error('Please pass either "epid" or "invoiceId" param to "getTransactionPayload" method.');
    }

    const data: BaseTransactionHmac = {
      method: Methods.CHECK_STATUS,
      mid: this.merchantId,
      ...(params.epid ? { epid: params.epid } : { invoice_id: params.invoiceId }),
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    data.fp_hash = this.computeHmac(data);

    const formBody = [];
    for (const key in data) {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(data[key as keyof BaseTransactionHmac] as string);

      formBody.push(`${encodedKey}=${encodedValue}`);
    }

    const response = await axios.post(this.baseUrl, formBody.join('&'));

    return response.data;
  };

  /**
   * Capture or reversal a transaction
   *
   * @since 1.0.0
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

    const data: CaptureHmac = {
      method: isReversal ? Methods.REVERSAL : Methods.CAPTURE,
      ukey: this.userKey,
      epid,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    const useSecretKey = false;
    data.fp_hash = this.computeHmac(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof CaptureHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Partial capture a transaction
   *
   * @since 1.0.0
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

    const data: PartialCaptureHmac = {
      method: Methods.PARTIAL_CAPTURE,
      ukey: this.userKey,
      amount: amount.toFixed(2).toString(),
      epid,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    const useSecretKey = false;
    data.fp_hash = this.computeHmac(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof PartialCaptureHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * (Partial) Refund of a transaction
   *
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

    const data: RefundHmac = {
      method: Methods.REFUND,
      ukey: this.userKey,
      amount: amount.toFixed(2).toString(),
      reason,
      epid,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    const useSecretKey = false;
    data.fp_hash = this.computeHmac(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof RefundHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Cancel recurring transaction
   *
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

    const data: CancelHmac = {
      method: Methods.CANCEL_RECURRING,
      ukey: this.userKey,
      epid,
      reason,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    const useSecretKey = false;
    data.fp_hash = this.computeHmac(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof CancelHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Update invoice ID of transaction
   *
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

    const data: UpdateInvoiceIdHmac = {
      method: Methods.UPDATE_IID,
      ukey: this.userKey,
      epid,
      invoice_id: invoiceId,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    const useSecretKey = false;
    data.fp_hash = this.computeHmac(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof UpdateInvoiceIdHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Get invoice transaction list
   *
   * If `from` and `to` are sent empty will search invoices in last 3 months.
   * Returns max 100 records.
   *
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

    const data: InvoiceListHmac = {
      method: Methods.INVOICES,
      ukey: this.userKey,
      mid: this.merchantId,
      from: start,
      to: end,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    const useSecretKey = false;
    data.fp_hash = this.computeHmac(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof InvoiceListHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Get invoice transaction list
   *
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

    const data: InvoiceTransactionHmac = {
      method: Methods.INVOICE,
      ukey: this.userKey,
      invoice,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    const useSecretKey = false;
    data.fp_hash = this.computeHmac(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof InvoiceTransactionHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Get captured total
   *
   * If `params.from` and `params.to` are sent empty will search in last month.
   *
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

    const { mids, from, to } = params!;

    const start = from instanceof Date ? from.toISOString().split('T')[0] : '';
    const end = to instanceof Date ? to.toISOString().split('T')[0] : '';

    const data: InvoiceListHmac = {
      method: Methods.CAPTURED_TOTAL,
      ukey: this.userKey,
      mids: mids ? mids.replaceAll(' ', '') : this.merchantId,
      from: start,
      to: end,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    const useSecretKey = false;
    data.fp_hash = this.computeHmac(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof InvoiceListHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Get card art data
   *
   * @param   {string}  epid  The EPID of the transaction.
   * @returns {Promise}       Either the card art data or error.
   */
  public getCardArt = async (epid: string): Promise<{ success: CardArt } | { error: string; ecode: string }> => {
    if (!this.userKey || !this.userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const data: CaptureHmac = {
      method: Methods.CARDART,
      ukey: this.userKey,
      ep_id: epid,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    const useSecretKey = false;
    data.fp_hash = this.computeHmac(data, useSecretKey);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof CaptureHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Get saved cards of a customer
   *
   * @param   {string}  clientId  The ID of the client.
   * @param   {string}  mid       Optional. Merchant ID. If empty, it will setup the merchant ID from client initialization.
   * @returns {Promise}           Either list of cards or error.
   */
  public getSavedCards = async (
    clientId: string,
    mid?: string
  ): Promise<{ cards: SavedCard[] } | { error: string; ecode: string }> => {
    const data: SavedCardsHmac = {
      method: Methods.C2P_CARDS,
      mid: mid ?? this.merchantId,
      c2p_id: clientId,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    data.fp_hash = this.computeHmac(data);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof SavedCardsHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Remove card of a customer
   *
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
    const data: RemoveCardHmac = {
      method: Methods.C2P_DELETE,
      mid: mid ?? this.merchantId,
      c2p_id: clientId,
      c2p_cid: cardId,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    data.fp_hash = this.computeHmac(data);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof RemoveCardHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Check merchant ID
   *
   * @param   {string}  mid   Optional. Merchant ID. If empty, it will setup the merchant ID from client initialization.
   * @returns {Promise}       Merchant data or error.
   */
  public checkMid = async (mid?: string): Promise<Merchant | { error: string }> => {
    const data: BaseTransactionHmac = {
      method: Methods.CHECK_MID,
      mid: mid ?? this.merchantId,
      timestamp: prepareTS(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    data.fp_hash = this.computeHmac(data);

    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key as keyof BaseTransactionHmac]);
    }

    const response = await axios.post(this.baseUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data;
  };

  /**
   * Compute Hmac from data object
   *
   * @param   {ComputeHmacData} data Object data created in order to generate the hash.
   * @param   {boolean}         useSecretKey Whether to use the secret key or the user API key.
   * @returns {string}          The hash generated from passed data.
   */
  public computeHmac = (data: ComputeHmacData, useSecretKey: boolean = true): string => {
    let hmac: string = '';
    for (const key in data) {
      if (0 === data[key as keyof ComputeHmacData]?.toString()?.length) {
        hmac += '-';
      } else {
        hmac += `${data[key as keyof ComputeHmacData]?.toString()?.length}${data[key as keyof ComputeHmacData]}`;
      }
    }
    const secretKey = this.testMode ? EUPLATESC_TEST_SECRET_KEY : useSecretKey ? this.secretKey : this.userApi;
    const binKey = Buffer.from(secretKey, 'hex');
    const hash = crypto.createHmac('md5', binKey).update(hmac, 'utf8').digest('hex');

    return hash;
  };
}
