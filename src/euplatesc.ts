import * as crypto from 'crypto';

import { EuPlatescConfig } from './types';

export class EuPlatesc {
  _merchantId: string;
  _privateKey: string;
  _testMode = false;

  public constructor({ merchantId, privateKey, testMode }: EuPlatescConfig) {
    this._merchantId = merchantId;
    this._privateKey = privateKey;
    this._testMode = 'boolean' === typeof testMode ? testMode : false;
  }

  get merchantId(): string {
    return this._merchantId;
  }

  get privateKey() {
    return this._privateKey;
  }

  get testMode(): boolean {
    return this._testMode;
  }

  public generatePaymentUrl = () => {};

  public getStatus = () => {};

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

  private computeHmac = (data: any) => {
    let hmac: string = '';
    for (const key in data) {
      if (data[key]?.length == 0) {
        hmac += '-';
      } else {
        hmac += `${data[key]?.length}${data[key]}`;
      }
    }
  };
}
