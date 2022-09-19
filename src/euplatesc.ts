import * as crypto from 'crypto';

import { EUPLATESC_GATEWAY_URL, EUPLATESC_TEST_MERCHANT_ID, EUPLATESC_TEST_SECRET_KEY } from './utils/constants';
import { BaseOrder, Config, Hmac, Order } from './types';
import { BaseHmac, BaseTransactionHmac } from './types/Hmac.type';
import { prepareTS } from './utils/helpers';
export class EuPlatesc {
  _merchantId: string;
  _secretKey: string;
  _testMode = false;

  public constructor({ merchantId, secretKey, testMode }: Config) {
    this._merchantId = merchantId;
    this._secretKey = secretKey;
    this._testMode = 'boolean' === typeof testMode ? testMode : false;
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
      throw new Error('Please pass either epid or invoiceId field.');
    }

    const data: BaseTransactionHmac = {
      method: 'check_status',
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

    const response = await fetch('https://manager.euplatesc.ro/v3/?action=ws', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.join('&')
    }).then((response) => response.json());

    return JSON.parse(response as string);
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

  public computeHmac = (data: BaseHmac | BaseTransactionHmac): string => {
    let hmac: string = '';
    for (const key in data) {
      if (data[key as keyof (BaseHmac | BaseTransactionHmac)]?.toString()?.length == 0) {
        hmac += '-';
      } else {
        hmac += `${data[key as keyof (BaseHmac | BaseTransactionHmac)]?.toString()?.length}${
          data[key as keyof (BaseHmac | BaseTransactionHmac)]
        }`;
      }
    }
    const secretKey = this._testMode ? EUPLATESC_TEST_SECRET_KEY : this._secretKey;
    const binKey = Buffer.from(secretKey, 'hex');
    const hash = crypto.createHmac('md5', binKey).update(hmac, 'utf8').digest('hex');

    return hash;
  };
}
