import { describe, expect, test } from '@jest/globals';

import { EUPLATESC_TEST_MERCHANT_ID, EUPLATESC_TEST_SECRET_KEY } from '../utils/constants';
import { EuPlatesc } from '../euplatesc';
import { Config, Hmac, BaseHmac, Order } from '../types';

describe('euplatesc unit tests', (): void => {
  let euplatescClient: EuPlatesc;
  let euplatescConfig: Config = {
    merchantId: 'my-other-merchant-id',
    secretKey: 'some-other-secret-key',
    testMode: false
  };

  describe('constructor()', (): void => {
    beforeEach(() => {
      euplatescClient = new EuPlatesc(euplatescConfig);
    });

    it('check the merchant id', (): void => {
      expect(typeof euplatescClient.merchantId).toBe('string');
      expect(euplatescClient.merchantId).toBe(euplatescConfig.merchantId);
    });

    it('check the private key', (): void => {
      expect(typeof euplatescClient.privateKey).toBe('string');
      expect(euplatescClient.privateKey).toBe(euplatescConfig.secretKey);
    });

    it('check the test mode', (): void => {
      expect(typeof euplatescClient.testMode).toBe('boolean');
      expect(euplatescClient.testMode).toBe(euplatescConfig.testMode);
    });
  });

  describe('paymentUrl()', (): void => {
    let data: Hmac & Order;

    beforeEach(() => {
      euplatescClient = new EuPlatesc(euplatescConfig);

      data = {
        amount: 12.34,
        currency: 'USD',
        invoiceId: 'unique-ish-string',
        orderDescription: 'the description of the order'
      };
    });

    it('Check base params in the final URL', (): void => {
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      expect(params.get('amount')).toBe(data.amount.toString());
      expect(params.get('curr')).toBe(data.currency);
      expect(params.get('invoice_id')).toBe(data.invoiceId);
      expect(params.get('order_desc')).toBe(data.orderDescription);
    });

    it('Check frequency params in the final URL', (): void => {
      const expiresAt = new Date(2022, 5 + 1, 4);
      data.frequency = {
        days: 7,
        expiresAt
      };
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      expect(params.get('recurent_freq')).toBe(data.frequency.days.toString());

      const expiresAtAssert = [
        expiresAt.getUTCFullYear(),
        (expiresAt.getUTCMonth() + 1).toString().padStart(2, '0'),
        expiresAt.getUTCDate().toString().padStart(2, '0')
      ].join('');
      expect(params.get('recurent_exp')).toBe(expiresAtAssert);
      expect(params.get('recurent')).toBe('Base');
    });

    it('Check billing data is missing', (): void => {
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      expect(null === params.get('fname')).toBe(true);
      expect(null === params.get('lname')).toBe(true);
      expect(null === params.get('company')).toBe(true);
      expect(null === params.get('add')).toBe(true);
      expect(null === params.get('city')).toBe(true);
      expect(null === params.get('state')).toBe(true);
      expect(null === params.get('zip')).toBe(true);
      expect(null === params.get('country')).toBe(true);
      expect(null === params.get('phone')).toBe(true);
      expect(null === params.get('email')).toBe(true);
    });

    it('Check billing data is present', (): void => {
      data = {
        ...data,
        billingFirstName: 'First name',
        billingLastName: 'Last name',
        billingCompany: 'Company Name',
        billingAddress: 'My billing address',
        billingCity: 'Tecuci',
        billingState: 'Galați',
        billingZip: '123654',
        billingCountry: 'România',
        billingPhone: '+40712345678',
        billingEmail: 'some_email@domain.ro'
      };
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      expect(params.get('fname')).toBe(data.billingFirstName);
      expect(params.get('lname')).toBe(data.billingLastName);
      expect(params.get('company')).toBe(data.billingCompany);
      expect(params.get('add')).toBe(data.billingAddress);
      expect(params.get('city')).toBe(data.billingCity);
      expect(params.get('state')).toBe(data.billingState);
      expect(params.get('zip')).toBe(data.billingZip);
      expect(params.get('country')).toBe(data.billingCountry);
      expect(params.get('phone')).toBe(data.billingPhone);
      expect(params.get('email')).toBe(data.billingEmail);
    });

    it('Check shipping data is missing', (): void => {
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      expect(null === params.get('fname')).toBe(true);
      expect(null === params.get('lname')).toBe(true);
      expect(null === params.get('company')).toBe(true);
      expect(null === params.get('add')).toBe(true);
      expect(null === params.get('city')).toBe(true);
      expect(null === params.get('state')).toBe(true);
      expect(null === params.get('zip')).toBe(true);
      expect(null === params.get('country')).toBe(true);
      expect(null === params.get('phone')).toBe(true);
      expect(null === params.get('email')).toBe(true);
    });

    it('Check shipping data is present', (): void => {
      data = {
        ...data,
        shippingFirstName: 'First another name',
        shippingLastName: 'Last another name',
        shippingCompany: 'Company Another Name',
        shippingAddress: 'My other billing address',
        shippingCity: 'Lugoj',
        shippingState: 'Timiș',
        shippingZip: '678943',
        shippingCountry: 'România',
        shippingPhone: '+40712345679',
        shippingEmail: 'banat@domain.ro'
      };
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      expect(params.get('sfname')).toBe(data.shippingFirstName);
      expect(params.get('slname')).toBe(data.shippingLastName);
      expect(params.get('scompany')).toBe(data.shippingCompany);
      expect(params.get('sadd')).toBe(data.shippingAddress);
      expect(params.get('scity')).toBe(data.shippingCity);
      expect(params.get('sstate')).toBe(data.shippingState);
      expect(params.get('szip')).toBe(data.shippingZip);
      expect(params.get('scountry')).toBe(data.shippingCountry);
      expect(params.get('sphone')).toBe(data.shippingPhone);
      expect(params.get('semail')).toBe(data.shippingEmail);
    });

    it('Check extra data is missing', (): void => {
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      expect(null === params.get('ExtraData')).toBe(true);
      expect(null === params.get('ExtraData[silenturl]')).toBe(true);
      expect(null === params.get('ExtraData[successurl]')).toBe(true);
      expect(null === params.get('ExtraData[failedurl]')).toBe(true);
      expect(null === params.get('ExtraData[ep_target]')).toBe(true);
      expect(null === params.get('ExtraData[ep_method]')).toBe(true);
      expect(null === params.get('ExtraData[backtosite]')).toBe(true);
      expect(null === params.get('ExtraData[backtosite_method]')).toBe(true);
      expect(null === params.get('ExtraData[expireurl]')).toBe(true);
      expect(null === params.get('ExtraData[rate]')).toBe(true);
      expect(null === params.get('ExtraData[filtru_rate]')).toBe(true);
      expect(null === params.get('ExtraData[ep_channel]')).toBe(true);
      expect(null === params.get('generate_epid')).toBe(true);
      expect(null === params.get('valability')).toBe(true);
      expect(null === params.get('c2p_id')).toBe(true);
      expect(null === params.get('c2p_cid')).toBe(true);
      expect(null === params.get('lang')).toBe(true);
    });

    it('Check extra data is present', (): void => {
      const valability = new Date(2022, 5, 8, 11, 26, 47);
      data = {
        ...data,
        Extra: 'Some extra content.',
        silentUrl: 'https://silent-url.domain.ro',
        successUrl: 'https://success-url.domain.ro',
        failedUrl: 'https://failed-url.domain.ro',
        epTarget: 'self',
        epMethod: 'post',
        backToSite: 'https://back-url.domain.ro',
        backToSiteMethod: 'post',
        expireUrl: 'https://expire-url.domain.ro',
        rate: 'BT-10',
        filterRate: 'BK-12-34',
        channel: 'CC,OP',
        generateEpid: '1',
        valability,
        c2pId: 'some-unique-id',
        c2pCid: 'another-unique-id',
        lang: 'fr'
      };
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      expect(params.get('ExtraData')).toBe(data.Extra);
      expect(params.get('ExtraData[silenturl]')).toBe(data.silentUrl);
      expect(params.get('ExtraData[successurl]')).toBe(data.successUrl);
      expect(params.get('ExtraData[failedurl]')).toBe(data.failedUrl);
      expect(params.get('ExtraData[ep_target]')).toBe(data.epTarget);
      expect(params.get('ExtraData[ep_method]')).toBe(data.epMethod);
      expect(params.get('ExtraData[backtosite]')).toBe(data.backToSite);
      expect(params.get('ExtraData[backtosite_method]')).toBe(data.backToSiteMethod);
      expect(params.get('ExtraData[expireurl]')).toBe(data.expireUrl);
      expect(params.get('ExtraData[rate]')).toBe(data.rate);
      expect(params.get('ExtraData[filtru_rate]')).toBe(data.filterRate);
      expect(params.get('ExtraData[ep_channel]')).toBe(data.channel);
      expect(params.get('generate_epid')).toBe(data.generateEpid);

      const valabilityAssert = [
        valability.getFullYear(),
        (valability.getUTCMonth() + 1).toString().padStart(2, '0'),
        valability.getUTCDate().toString().padStart(2, '0'),
        valability.getUTCHours().toString().padStart(2, '0'),
        valability.getUTCMinutes().toString().padStart(2, '0'),
        valability.getUTCSeconds().toString().padStart(2, '0')
      ].join('');
      expect(params.get('valability')).toBe(valabilityAssert);
      expect(params.get('c2p_id')).toBe(data.c2pId);
      expect(params.get('c2p_cid')).toBe(data.c2pCid);
      expect(params.get('lang')).toBe(data.lang);
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
      const hmacAssert = '7c92021205130ab01aaa014e4b47222a'; // Computed in EuPlatesc Panel.
      expect(euplatescClient.computeHmac(hmacData)).toBe(hmacAssert);
    });
  });

  describe('getStatus()', (): void => {
    it('check...', async (): Promise<void> => {
      let euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      // console.log(euplatescClient.getTransaction({ invoiceId: '123' }));

      // await euplatescClient.getStatus();
    });
  });
});
