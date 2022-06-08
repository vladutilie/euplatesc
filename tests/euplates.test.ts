import * as chai from 'chai';

import { EUPLATESC_TEST_MERCHANT_ID, EUPLATESC_TEST_SECRET_KEY } from '../src/constants';
import { EuPlatesc } from '../src/euplatesc';
import { Config, Hmac, BaseHmac, Order } from '../src/types';

chai.should();

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
      const paymentUrl = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      params.get('amount').should.be.equal(data.amount.toString());
      params.get('curr').should.be.equal(data.currency);
      params.get('invoice_id').should.be.equal(data.invoiceId);
      params.get('order_desc').should.be.equal(data.orderDescription);
    });

    it('Check frequency params in the final URL', (): void => {
      const expiresAt = new Date(2022, 5 + 1, 4);
      data.frequency = {
        days: 7,
        expiresAt
      };
      const paymentUrl = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      params.get('recurent_freq').should.be.equal(data.frequency.days.toString());

      const expiresAtAssert = [
        expiresAt.getUTCFullYear(),
        (expiresAt.getUTCMonth() + 1).toString().padStart(2, '0'),
        expiresAt.getUTCDate().toString().padStart(2, '0')
      ].join('');
      params.get('recurent_exp').should.be.equal(expiresAtAssert);
      params.get('recurent').should.be.equal('Base');
    });

    it('Check billing data is missing', (): void => {
      const paymentUrl = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      (null === params.get('fname')).should.be.true;
      (null === params.get('lname')).should.be.true;
      (null === params.get('company')).should.be.true;
      (null === params.get('add')).should.be.true;
      (null === params.get('city')).should.be.true;
      (null === params.get('state')).should.be.true;
      (null === params.get('zip')).should.be.true;
      (null === params.get('country')).should.be.true;
      (null === params.get('phone')).should.be.true;
      (null === params.get('email')).should.be.true;
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
      const paymentUrl = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      params.get('fname').should.be.equal(data.billingFirstName);
      params.get('lname').should.be.equal(data.billingLastName);
      params.get('company').should.be.equal(data.billingCompany);
      params.get('add').should.be.equal(data.billingAddress);
      params.get('city').should.be.equal(data.billingCity);
      params.get('state').should.be.equal(data.billingState);
      params.get('zip').should.be.equal(data.billingZip);
      params.get('country').should.be.equal(data.billingCountry);
      params.get('phone').should.be.equal(data.billingPhone);
      params.get('email').should.be.equal(data.billingEmail);
    });

    it('Check shipping data is missing', (): void => {
      const paymentUrl = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      (null === params.get('fname')).should.be.true;
      (null === params.get('lname')).should.be.true;
      (null === params.get('company')).should.be.true;
      (null === params.get('add')).should.be.true;
      (null === params.get('city')).should.be.true;
      (null === params.get('state')).should.be.true;
      (null === params.get('zip')).should.be.true;
      (null === params.get('country')).should.be.true;
      (null === params.get('phone')).should.be.true;
      (null === params.get('email')).should.be.true;
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
      const paymentUrl = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      params.get('sfname').should.be.equal(data.shippingFirstName);
      params.get('slname').should.be.equal(data.shippingLastName);
      params.get('scompany').should.be.equal(data.shippingCompany);
      params.get('sadd').should.be.equal(data.shippingAddress);
      params.get('scity').should.be.equal(data.shippingCity);
      params.get('sstate').should.be.equal(data.shippingState);
      params.get('szip').should.be.equal(data.shippingZip);
      params.get('scountry').should.be.equal(data.shippingCountry);
      params.get('sphone').should.be.equal(data.shippingPhone);
      params.get('semail').should.be.equal(data.shippingEmail);
    });

    it('Check extra data is missing', (): void => {
      const paymentUrl = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      (null === params.get('ExtraData')).should.be.true;
      (null === params.get('ExtraData[silenturl]')).should.be.true;
      (null === params.get('ExtraData[successurl]')).should.be.true;
      (null === params.get('ExtraData[failedurl]')).should.be.true;
      (null === params.get('ExtraData[ep_target]')).should.be.true;
      (null === params.get('ExtraData[ep_method]')).should.be.true;
      (null === params.get('ExtraData[backtosite]')).should.be.true;
      (null === params.get('ExtraData[backtosite_method]')).should.be.true;
      (null === params.get('ExtraData[expireurl]')).should.be.true;
      (null === params.get('ExtraData[rate]')).should.be.true;
      (null === params.get('ExtraData[filtru_rate]')).should.be.true;
      (null === params.get('ExtraData[ep_channel]')).should.be.true;
      (null === params.get('generate_epid')).should.be.true;
      (null === params.get('valability')).should.be.true;
      (null === params.get('c2p_id')).should.be.true;
      (null === params.get('c2p_cid')).should.be.true;
      (null === params.get('lang')).should.be.true;
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
      const paymentUrl = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      params.get('ExtraData').should.be.equal(data.Extra);
      params.get('ExtraData[silenturl]').should.be.equal(data.silentUrl);
      params.get('ExtraData[successurl]').should.be.equal(data.successUrl);
      params.get('ExtraData[failedurl]').should.be.equal(data.failedUrl);
      params.get('ExtraData[ep_target]').should.be.equal(data.epTarget);
      params.get('ExtraData[ep_method]').should.be.equal(data.epMethod);
      params.get('ExtraData[backtosite]').should.be.equal(data.backToSite);
      params.get('ExtraData[backtosite_method]').should.be.equal(data.backToSiteMethod);
      params.get('ExtraData[expireurl]').should.be.equal(data.expireUrl);
      params.get('ExtraData[rate]').should.be.equal(data.rate);
      params.get('ExtraData[filtru_rate]').should.be.equal(data.filterRate);
      params.get('ExtraData[ep_channel]').should.be.equal(data.channel);
      params.get('generate_epid').should.be.equal(data.generateEpid);

      const valabilityAssert = [
        valability.getFullYear(),
        (valability.getUTCMonth() + 1).toString().padStart(2, '0'),
        valability.getUTCDate().toString().padStart(2, '0'),
        valability.getUTCHours().toString().padStart(2, '0'),
        valability.getUTCMinutes().toString().padStart(2, '0'),
        valability.getUTCSeconds().toString().padStart(2, '0')
      ].join('');
      params.get('valability').should.be.equal(valabilityAssert);
      params.get('c2p_id').should.be.equal(data.c2pId);
      params.get('c2p_cid').should.be.equal(data.c2pCid);
      params.get('lang').should.be.equal(data.lang);
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
      euplatescClient.computeHmac(hmacData).should.be.equal(hmacAssert);
    });
  });
});
