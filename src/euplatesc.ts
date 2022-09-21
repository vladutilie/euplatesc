import * as crypto from 'crypto';
import axios from 'axios';
import FormData from 'form-data';

import { EUPLATESC_GATEWAY_URL, EUPLATESC_TEST_MERCHANT_ID, EUPLATESC_TEST_SECRET_KEY } from './utils/constants';
import { BaseOrder, Config, Hmac, Methods, Order } from './types';
import { BaseHmac, BaseTransactionHmac, CaptureHmac } from './types/Hmac.type';
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

  get privateKey(): string {
    return this._secretKey;
  }

  get testMode(): boolean {
    return this._testMode;
  }

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
      amount: this._testMode ? '1.00' : data.amount.toString(),
      curr: data.currency,
      invoice_id: data.invoiceId,
      order_desc: data.orderDescription,
      merch_id: this._testMode ? EUPLATESC_TEST_MERCHANT_ID : this.merchantId,
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

  public getTransaction = async ({ epid, invoiceId }: { epid?: string; invoiceId?: string }) => {
    if (!epid && !invoiceId) {
      throw new Error('Please pass either epid or invoiceId parameter.');
    }

    const data = this.getTransactionPayload({ epid, invoiceId });
    const response = await axios.post(this.baseUrl, data);

    return response.data;
  };

  public getTransactionPayload = ({ epid, invoiceId }: { epid?: string; invoiceId?: string }): string => {
    const data: BaseTransactionHmac = {
      method: Methods.CHECK_STATUS,
      mid: this._merchantId,
      ...(epid ? { epid } : { invoice_id: invoiceId }),
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

    return formBody.join('&');
  };

  /**
   * Capture or reversal a transaction
   *
   * @since 1.0.0
   * @param epid The EPID of the transaction.
   * @param isReversal Optional. Whether it's a reversal or capture. Default: false
   * @returns Promise<{ success: string } | { error: string }>
   */
  public captureReversalTransaction = async (
    epid: string,
    isReversal = false
  ): Promise<{ success: string } | { error: string }> => {
    if (!this._userKey || !this._userApi) {
      throw new Error(
        'To use this method you should instantiate the EuPlatesc client with "userKey" and "userApi" keys.'
      );
    }

    const data: CaptureHmac = {
      method: isReversal ? Methods.REVERSAL : Methods.CAPTURE,
      ukey: this._userKey,
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

  public refund = () => {};

  public cancelRecurring = () => {};

  public updateInvoiceId = () => {};

  public getInvoices = () => {};

  public getInvoiceTransactions = () => {};

  public getCapturedTotal = () => {};

  public getCardArtData = () => {};

  public getSavedCards = () => {};

  public removeSavedCard = () => {};

  public checkMid = () => {};

  public computeHmac = (data: BaseHmac | BaseTransactionHmac | CaptureHmac, useSecretKey = true): string => {
    let hmac: string = '';
    for (const key in data) {
      if (0 === data[key as keyof (BaseHmac | BaseTransactionHmac | CaptureHmac)]?.toString()?.length) {
        hmac += '-';
      } else {
        hmac += `${data[key as keyof (BaseHmac | BaseTransactionHmac | CaptureHmac)]?.toString()?.length}${
          data[key as keyof (BaseHmac | BaseTransactionHmac | CaptureHmac)]
        }`;
      }
    }
    const secretKey = this._testMode ? EUPLATESC_TEST_SECRET_KEY : useSecretKey ? this._secretKey : this._userApi;
    const binKey = Buffer.from(secretKey, 'hex');
    const hash = crypto.createHmac('md5', binKey).update(hmac, 'utf8').digest('hex');

    return hash;
  };
}
