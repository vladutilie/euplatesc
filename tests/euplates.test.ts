import * as chai from 'chai';

import { EUPLATESC_TEST_MERCHANT_ID, EUPLATESC_TEST_SECRET_KEY } from '../src/constants';
import { EuPlatesc } from '../src/euplatesc';
import { Config, Hmac } from '../src/types';
import { BaseHmac } from '../src/types/Hmac.type';

chai.should();

describe('euplatesc unit tests', (): void => {
  let euplatescClient: EuPlatesc;

  describe('constructor()', (): void => {
    let euplatescConfig: Config = {
      merchantId: 'my-merchant-id',
      secretKey: 'some-private-key',
      testMode: false
    };

    beforeEach(() => {
      euplatescClient = new EuPlatesc(euplatescConfig);
    });

    it('check the merchant id', (): void => {
      euplatescClient.merchantId.should.be.a('string');
      euplatescClient.merchantId.should.equal(euplatescConfig.merchantId);
    });

    it('check the private key', (): void => {
      euplatescClient.privateKey.should.be.a('string');
      euplatescClient.privateKey.should.equal(euplatescConfig.secretKey);
    });

    it('check the test mode', (): void => {
      euplatescClient.testMode.should.be.a('boolean');
      euplatescClient.testMode.should.equal(euplatescConfig.testMode);
    });
  });

  describe('paymentUrl()', (): void => {
    beforeEach(() => {
      let euplatescConfig: Config = {
        merchantId: EUPLATESC_TEST_MERCHANT_ID,
        secretKey: EUPLATESC_TEST_SECRET_KEY,
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);
    });

    it('check the amount', (): void => {
      const data: Hmac = {
        amount: 1,
        currency: 'RON',
        invoiceId: 'some-invoice-id',
        orderDescription: 'A description of the order.'
      };
      (() => euplatescClient.paymentUrl(data)).should.not.throw(Error);
    });
  });

  describe('computeHmac()', (): void => {
    it('check computation', (): void => {
      let euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      const hmacData: BaseHmac = {
        amount: '1.00',
        curr: 'RON',
        invoice_id: '00012',
        order_desc: 'Test order',
        merch_id: EUPLATESC_TEST_MERCHANT_ID,
        timestamp: '20190101000000',
        nonce: 'f7d93357a7040619bc416881c479687f'
      };
      euplatescClient.computeHmac(hmacData).should.be.equal('7c92021205130ab01aaa014e4b47222a');
    });
  });
});
