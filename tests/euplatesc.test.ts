import { describe, expect } from '@jest/globals';

const mockedFetch = jest.fn();
global.fetch = mockedFetch as unknown as typeof fetch;

/** Stub a gateway reply, the way the client reads it: status + raw text. */
const mockReply = (payload: unknown, ok: boolean = true): void => {
  mockedFetch.mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Internal Server Error',
    text: async () => JSON.stringify(payload)
  });
};

/** Read back the multipart body of the nth recorded request as a flat object. */
const sentFields = async (call: number = 0): Promise<Record<string, string>> => {
  const body = mockedFetch.mock.calls[call][1].body as FormData;

  return Object.fromEntries([...body.entries()].map(([key, value]) => [key, String(value)]));
};

import { EuPlatesc } from '../src/euplatesc';
import { Config, Hmac, BaseHmac, Order, Response } from '../src/types';

describe('euplatesc unit tests', (): void => {
  let euplatescClient: EuPlatesc;
  const euplatescConfig: Config = {
    merchantId: 'my-other-merchant-id',
    secretKey: 'some-other-secret-key',
    testMode: false,
    userApi: 'some-user-api',
    userKey: 'some-user-key'
  };

  describe('constructor()', (): void => {
    beforeEach(() => {
      euplatescClient = new EuPlatesc(euplatescConfig);
    });

    test('missing merchant id', (): void => {
      const config: Config = {
        merchantId: '',
        secretKey: 'secret key',
      }

      expect(async () => {
        new EuPlatesc(config);
      }).rejects.toThrow(Error);
    });

    test('missing secret id', (): void => {
      const config: Config = {
        merchantId: 'merchant id',
        secretKey: '',
      }

      expect(async () => {
        new EuPlatesc(config);
      }).rejects.toThrow(Error);
    });

    test('Check the merchant id', (): void => {
      expect(typeof euplatescClient.merchantId).toBe('string');
      expect(euplatescClient.merchantId).toBe(euplatescConfig.merchantId);
    });

    test('Check the private key', (): void => {
      expect(typeof euplatescClient.secretKey).toBe('string');
      expect(euplatescClient.secretKey).toBe(euplatescConfig.secretKey);
    });

    test('Check the test mode', (): void => {
      expect(typeof euplatescClient.testMode).toBe('boolean');
      expect(euplatescClient.testMode).toBe(euplatescConfig.testMode);
    });

    test('Check the user api', (): void => {
      expect(typeof euplatescClient.userApi).toBe('string');
      expect(euplatescClient.userApi).toBe(euplatescConfig.userApi);
    })

    test('Check the user key', (): void => {
      expect(typeof euplatescClient.userKey).toBe('string');
      expect(euplatescClient.userKey).toBe(euplatescConfig.userKey);
    })
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

    test('Check base params in the final URL', (): void => {
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const { search } = new URL(paymentUrl);
      const params: URLSearchParams = new URLSearchParams(search);

      expect(params.get('amount')).toBe(data.amount.toFixed(2));
      expect(params.get('curr')).toBe(data.currency);
      expect(params.get('invoice_id')).toBe(data.invoiceId);
      expect(params.get('order_desc')).toBe(data.orderDescription);
    });

    test('The amount is always sent with two decimals', (): void => {
      const { paymentUrl } = euplatescClient.paymentUrl({ ...data, amount: 12 });
      const params = new URLSearchParams(new URL(paymentUrl).search);

      expect(params.get('amount')).toBe('12.00');
    });

    test('Reject a non-numeric or negative amount', (): void => {
      expect(() => euplatescClient.paymentUrl({ ...data, amount: '12' as unknown as number })).toThrow(Error);
      expect(() => euplatescClient.paymentUrl({ ...data, amount: -1 })).toThrow(Error);
    });

    test('Default the recurring expiry one year ahead', (): void => {
      data.frequency = { days: 30 };
      const { paymentUrl } = euplatescClient.paymentUrl(data);
      const params = new URLSearchParams(new URL(paymentUrl).search);

      const inAYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const expected = [
        inAYear.getUTCFullYear().toString(),
        (inAYear.getUTCMonth() + 1).toString().padStart(2, '0'),
        inAYear.getUTCDate().toString().padStart(2, '0')
      ].join('');

      expect(params.get('recurent_exp')).toBe(expected);
      expect(params.get('recurent_exp')).toHaveLength(8);
    });

    test('Send baseEPID and recurent=Recurent for a subsequent transaction', (): void => {
      const baseEpId = '15F124618DA2E299CBEFA787A09464352946F422';
      const fields = euplatescClient.paymentParams({ ...data, baseEpId });

      expect(fields.baseEPID).toBe(baseEpId);
      expect(fields.recurent).toBe('Recurent');
      // baseEPID must be hashed before amount.
      expect(Object.keys(fields).indexOf('baseEPID')).toBe(0);
    });

    test('Honour an explicit recurrentType', (): void => {
      const fields = euplatescClient.paymentParams({
        ...data,
        baseEpId: '15F124618DA2E299CBEFA787A09464352946F422',
        recurrentType: 'Recurent2CIT'
      });

      expect(fields.recurent).toBe('Recurent2CIT');
    });

    test('Check the new extra params in the final URL', (): void => {
      const { paymentUrl } = euplatescClient.paymentUrl({
        ...data,
        silentUrlSec: 'https://sec-url.domain.ro',
        validateCc: true
      });
      const params = new URLSearchParams(new URL(paymentUrl).search);

      expect(params.get('ExtraData[silenturlsec]')).toBe('https://sec-url.domain.ro');
      expect(params.get('validate_cc')).toBe('1');
    });

    test('Check frequency params in the final URL', (): void => {
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

    test('Check billing data is missing', (): void => {
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

    test('Check billing data is present', (): void => {
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

    test('Check shipping data is missing', (): void => {
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

    test('Check shipping data is present', (): void => {
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

    test('Check extra data is missing', (): void => {
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

    test('Check extra data is present', (): void => {
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
        generateEpId: '1',
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
      expect(params.get('generate_epid')).toBe(data.generateEpId);

      const valabilityAssert = [
        valability.getUTCFullYear(),
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
    test('Check computation', (): void => {
      const euplatescConfig: Config = {
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
        merch_id: 'testaccount',
        timestamp: '20190101000000',
        nonce: 'f7d93357a7040619bc416881c479687f'
      };
      const hmacAssert = '7C92021205130AB01AAA014E4B47222A'; // Computed in EuPlatesc Panel.
      expect(euplatescClient.computeHmac(hmacData)).toBe(hmacAssert);
    });

    test('Empty and unset fields are both hashed as "-"', (): void => {
      euplatescClient = new EuPlatesc({ merchantId: 'mid', secretKey: 'AABB', testMode: true });

      const withEmpty = euplatescClient.computeHmac({ timestamp: '20190101000000', nonce: 'abc', a: '' });
      const withUndefined = euplatescClient.computeHmac({
        timestamp: '20190101000000',
        nonce: 'abc',
        a: undefined
      });

      expect(withEmpty).toBe(withUndefined);
    });
  });

  describe('checkResponse()', (): void => {
    const baseResponse = {
      amount: '12.34',
      currency: 'RON',
      invoiceId: '00012',
      epId: '15F124618DA2E299CBEFA787A09464352946F422',
      merchantId: 'testaccount',
      action: '0',
      message: 'Approved',
      approval: '123456',
      timestamp: '20190101000000',
      nonce: 'f7d93357a7040619bc416881c479687f'
    };

    beforeEach(() => {
      euplatescClient = new EuPlatesc({
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      });
    });

    const sign = (fields: Record<string, string>): string =>
      euplatescClient.computeHmac(fields as never);

    test('A correctly signed approved response is complete', (): void => {
      const fpHash = sign({
        amount: baseResponse.amount,
        curr: baseResponse.currency,
        invoice_id: baseResponse.invoiceId,
        ep_id: baseResponse.epId,
        merch_id: baseResponse.merchantId,
        action: baseResponse.action,
        message: baseResponse.message,
        approval: baseResponse.approval,
        timestamp: baseResponse.timestamp,
        nonce: baseResponse.nonce
      });

      expect(euplatescClient.checkResponse({ ...baseResponse, fpHash })).toEqual({
        success: true,
        response: 'complete'
      });
    });

    test('A correctly signed declined response is failed', (): void => {
      const response: Response = { ...baseResponse, action: '1', message: 'Declined', fpHash: '' };
      response.fpHash = sign({
        amount: response.amount,
        curr: response.currency as string,
        invoice_id: response.invoiceId,
        ep_id: response.epId,
        merch_id: response.merchantId,
        action: response.action,
        message: response.message,
        approval: response.approval,
        timestamp: response.timestamp,
        nonce: response.nonce
      });

      expect(euplatescClient.checkResponse(response)).toEqual({ success: false, response: 'failed' });
    });

    test('A tampered response is invalid', (): void => {
      expect(euplatescClient.checkResponse({ ...baseResponse, fpHash: 'DEADBEEF' })).toEqual({
        success: false,
        response: 'invalid'
      });
    });

    test('The additional fields are hashed after nonce, in the documented order', (): void => {
      const fpHash = sign({
        amount: baseResponse.amount,
        curr: baseResponse.currency,
        invoice_id: baseResponse.invoiceId,
        ep_id: baseResponse.epId,
        merch_id: baseResponse.merchantId,
        action: baseResponse.action,
        message: baseResponse.message,
        approval: baseResponse.approval,
        timestamp: baseResponse.timestamp,
        nonce: baseResponse.nonce,
        sec_status: '9',
        rrn: '415584961828',
        card_type: 'Visa',
        rtype: 'Normal'
      });

      expect(
        euplatescClient.checkResponse({
          ...baseResponse,
          secStatus: '9',
          rrn: '415584961828',
          cardType: 'Visa',
          rtype: 'Normal',
          fpHash
        })
      ).toEqual({ success: true, response: 'complete' });
    });

    test('Omitting an enabled additional field makes the response invalid', (): void => {
      const fpHash = sign({
        amount: baseResponse.amount,
        curr: baseResponse.currency,
        invoice_id: baseResponse.invoiceId,
        ep_id: baseResponse.epId,
        merch_id: baseResponse.merchantId,
        action: baseResponse.action,
        message: baseResponse.message,
        approval: baseResponse.approval,
        timestamp: baseResponse.timestamp,
        nonce: baseResponse.nonce,
        sec_status: '9'
      });

      expect(euplatescClient.checkResponse({ ...baseResponse, fpHash })).toEqual({
        success: false,
        response: 'invalid'
      });
    });
  });

  describe('getStatus()', (): void => {
    test('throw exception for no passed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.getStatus({});
      }).rejects.toThrow(Error);
    });

    test('Check request data', async (): Promise<void> => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      mockedFetch.mockClear();
      mockReply({ success: [{ merch_id: euplatescConfig.merchantId, ep_id: '123', action: '0' }] });

      const result = await euplatescClient.getStatus({ epId: '123' });

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: [{ merch_id: euplatescConfig.merchantId, ep_id: '123', action: '0' }] });

      const fields = await sentFields();
      expect(fields.method).toBe('check_status');
      expect(fields.epid).toBe('123');
      expect(fields.fp_hash).toHaveLength(32);
    });

    test('Surface a non-2xx gateway reply as an error', async (): Promise<void> => {
      euplatescClient = new EuPlatesc({
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      });
      mockedFetch.mockClear();
      mockReply({ error: 'boom' }, false);

      await expect(euplatescClient.getStatus({ epId: '123' })).rejects.toThrow(/500/);
    });

    test('Surface a malformed gateway reply as an error', async (): Promise<void> => {
      euplatescClient = new EuPlatesc({
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      });
      mockedFetch.mockClear();
      mockedFetch.mockResolvedValue({ ok: true, status: 200, statusText: 'OK', text: async () => '<html>oops' });

      await expect(euplatescClient.getStatus({ epId: '123' })).rejects.toThrow(/malformed/);
    });
  });

  describe('capture()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.capture('1');
      }).rejects.toThrow(Error);
    });
  });

  describe('reversal()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.reversal('1');
      }).rejects.toThrow(Error);
    });
  });

  describe('partialCapture()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.partialCapture('1', 1234);
      }).rejects.toThrow(Error);
    });
  });

  describe('refund()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.refund('1', 1234, '');
      }).rejects.toThrow(Error);
    });
  });

  describe('cancelRecurring()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.cancelRecurring('1');
      }).rejects.toThrow(Error);
    });
  });

  describe('updateInvoiceId()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.updateInvoiceId('1', '2');
      }).rejects.toThrow(Error);
    });
  });

  describe('getInvoiceList()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.getInvoiceList({ from: new Date('2022-01-01'), to: new Date('2022-02-01') });
      }).rejects.toThrow(Error);
    });
  });

  describe('getInvoiceTransactions()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.getInvoiceTransactions('invoice id');
      }).rejects.toThrow(Error);
    });
  });

  describe('getCapturedTotal()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.getCapturedTotal({});
      }).rejects.toThrow(Error);
    });
  });

  describe('getCardArtData()', (): void => {
    test('throw exception for no needed params', (): void => {
      const euplatescConfig: Config = {
        merchantId: 'my-merchant-id',
        secretKey: 'some-private-key',
        testMode: true
      };
      euplatescClient = new EuPlatesc(euplatescConfig);

      expect(async () => {
        await euplatescClient.getCardArt('1');
      }).rejects.toThrow(Error);
    });
  });

  describe('getTransactionList()', (): void => {
    beforeEach(() => {
      mockedFetch.mockClear();
      mockReply({ success: [] });
      euplatescClient = new EuPlatesc(euplatescConfig);
    });

    test('Send the documented defaults', async (): Promise<void> => {
      await euplatescClient.getTransactionList();

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      const fields = await sentFields();

      expect(fields.method).toBe('transactions');
      expect(fields.status).toBe('all');
      expect(fields.mid).toBe(euplatescConfig.merchantId);
      expect(fields.from).toBe('');
      expect(fields.to).toBe('');
    });

    test('Reject an out of range limit or page', (): void => {
      expect(() => euplatescClient.getTransactionList({ limit: 0 })).toThrow(Error);
      expect(() => euplatescClient.getTransactionList({ limit: 5001 })).toThrow(Error);
      expect(() => euplatescClient.getTransactionList({ page: 0 })).toThrow(Error);
    });

    test('Format the interval as YYYY-mm-dd HH:mm:ss', async (): Promise<void> => {
      await euplatescClient.getTransactionList({
        from: new Date('2021-01-01T08:30:00Z'),
        to: new Date('2021-06-01T21:45:10Z'),
        by: 'capture',
        status: 'success',
        limit: 100,
        page: 2
      });

      const fields = await sentFields();

      expect(fields.from).toBe('2021-01-01 08:30:00');
      expect(fields.to).toBe('2021-06-01 21:45:10');
      expect(fields.by).toBe('capture');
      expect(fields.status).toBe('success');
      expect(fields.limit).toBe('100');
      expect(fields.page).toBe('2');
    });
  });

  describe('printTransaction()', (): void => {
    test('Request the receipt with the merchant credentials', async (): Promise<void> => {
      mockedFetch.mockClear();
      mockReply({ success: '1', file: 'JVBERi0=' });
      euplatescClient = new EuPlatesc(euplatescConfig);

      const result = await euplatescClient.printTransaction('15F124618DA2E299CBEFA787A09464352946F422');

      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: '1', file: 'JVBERi0=' });
      expect((await sentFields()).method).toBe('print');
    });
  });
});
