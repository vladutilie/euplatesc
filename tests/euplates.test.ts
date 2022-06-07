import * as chai from 'chai';
chai.should();

import { EuPlatesc } from '../src/euplatesc';
import { EuPlatescConfig } from '../src/types';

describe('euplatesc unit tests', (): void => {
  describe('constructor', () => {
    let euplatescClient: EuPlatesc;
    let euplatescConfig: EuPlatescConfig = {
      merchantId: 'my-merchant-id',
      privateKey: 'some-private-key',
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
      euplatescClient.privateKey.should.equal(euplatescConfig.privateKey);
    });

    it('check the test mode', (): void => {
      euplatescClient.testMode.should.be.a('boolean');
      euplatescClient.testMode.should.equal(euplatescConfig.testMode);
    });
  });
});
