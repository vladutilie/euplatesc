# EuPlătesc Node.js API Library

The EuPlătesc Node Library provides access to the entire EuPlătesc API from applications written in server-side JavaScript.

**IMPORTANT**: For using this package, you have to ask and apply for an account on [EuPlătesc](https://euplatesc.ro) website. After you will sign a contract with EuPlătesc, you will receive credentials for accessing the API.

## <a name="contents"></a>Table of Contents

1. [Table of contents](#contents)
2. [Getting started](#getting-started)
3. [Installation](#installation)
4. [Usage](#usage)
5. [API](#examples)
6. [Credits](#credits)
7. [Built with](#built-with)
8. [Authors?](#authors)
9. [License](#license)

## <a name="getting-started"></a>Getting started

This package is the result of my passion and openness to open-source software. Also many times I had to implement this service in my projects and almost every time I had to deal with a headache due to the poor documentation and the non-standard "REST API" provided by EuPlătesc.

This package covers all the actions provided in the EuPlătesc documentation. It can be used either as CommonJS or ES module.

## <a name="installation"></a>Installation

Using npm:

```sh
$ npm install euplatesc
```

Using yarn:

```sh
$ yarn add euplatesc
```

## <a name="usage"></a>Usage

Create a client file and instantiate the EuPlătesc class:

```js
// ./src/lib/epClient.js
import { EuPlatesc} from 'euplatesc';

export default epClient = new EuPlatesc({
    merchantId: process.env.EUPLATEC_MERCHANT_ID,
    secretKey: merchantId: process.env.EUPLATEC_SECRET_KEY,
});
```

Import the client and call the methods you need:

```js
// ./src/index.js
import epClient from './lib/epClient';

epClient.checkMid().then((midInfo) => console.log(midInfo));

// Also it can be used with async-await:
// console.log(await epClient.checkMid())
```

## <a name="api"></a>API

### Constructor

```js
new EuPlatesc(params);
```

Supported keys of `params` object are listed below:

`params`

| Field             | Type    | Required | Default value |
| ----------------- | ------- | -------- | ------------- |
| params.merchantId | string  | yes      | -             |
| params.secretKey  | string  | yes      | -             |
| params.testMode   | boolean | no       | false         |
| params.userKey    | string  | no       | -             |
| params.userApi    | string  | no       | -             |

Example:

```js
import { EuPlatesc } from 'euplatesc';

const client = new EuPlatesc({
    merchantId: process.env.EUPLATEC_MERCHANT_ID,
    secretKey: merchantId: process.env.EUPLATEC_SECRET_KEY,
    testMode: 'true' === process.env.EUPLATESC_TEST_MODE,
    userKey: process.env.EUPLATESC_USER_KEY,
    userApi: process.env.EUPLATESC_USER_API
})
```

### paymentUrl()

It generates the payment gateway URL to euplatesc.ro.

```js
import epClient from './lib/epClient';

const data = {
  amount: 12.34,
  currency: 'USD',
  invoiceId: 'invoice id',
  orderDescription: 'The description of the order'
};

const url = epClient.paymentUrl(data);
// { paymentUrl: 'https://secure.euplatesc.ro/tdsprocess/tranzactd.php?amount=...' }
// This URL will redirect the user to a secure EuPlătesc payment page.
```

`paymentUrl` method param object looks like below:

| Field               | Type                                                 | Description                                                                                                                  |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| amount \*           | number                                               |                                                                                                                              |
| currency \*         | 'RON' \| 'USD' \| 'EUR'                              |                                                                                                                              |
| invoiceId \*        | string                                               |                                                                                                                              |
| orderDescription \* | string                                               |                                                                                                                              |
| frequency           | { days: number; expiresAt: Date }                    |                                                                                                                              |
| billingFirstName    | string                                               |                                                                                                                              |
| billingLastName     | string                                               |                                                                                                                              |
| billingCompany      | string                                               | Company data.                                                                                                                |
| billingAddress      | string                                               |                                                                                                                              |
| billingCity         | string                                               |                                                                                                                              |
| billingState        | string                                               |                                                                                                                              |
| billingZip          | string                                               |                                                                                                                              |
| billingCountry      | string                                               |                                                                                                                              |
| billingPhone        | string                                               |                                                                                                                              |
| billingEmail        | string                                               |                                                                                                                              |
| shippingFirstName   | string                                               |                                                                                                                              |
| shippingLastName    | string                                               |                                                                                                                              |
| shippingCompany     | string                                               | Company data.                                                                                                                |
| shippingAddress     | string                                               |                                                                                                                              |
| shippingCity        | string                                               |                                                                                                                              |
| shippingState       | string                                               |                                                                                                                              |
| shippingZip         | string                                               |                                                                                                                              |
| shippingCountry     | string                                               |                                                                                                                              |
| shippingPhone       | string                                               |                                                                                                                              |
| shippingEmail       | string                                               |                                                                                                                              |
| Extra               | string                                               | Additional information sent by the mechant to the gateway. This data is echo back to the merchant in the reply request       |
| silentUrl           | string                                               | Callback URL.                                                                                                                |
| successUrl          | string                                               | URL to redirect client to in case of successfull transaction.                                                                |
| failedUrl           | string                                               | URL to redirect client to in case of failed transaction.                                                                     |
| epTarget            | string                                               | "self" for the case of using iframe.                                                                                         |
| epMethod            | string                                               | "post" or "get" for succes/fail redirect.                                                                                    |
| backToSite          | string                                               | URL to redirect client to when clicking back to site button or after 60s on result page.                                     |
| backToSiteMethod    | string                                               | "post" or "get" for the back to site button.                                                                                 |
| expireUrl           | string                                               | If a timer is set on the payment page you can change the URL that the client will be redirected to when the timer reaches 0. |
| rate                | string                                               | Installments number. Format: [bank_code]-[installments_no].                                                                  |
| filterRate          | string                                               | Installments number. Format: [bank_code1]-[i_no1]-...-[i_noN],[bank_code2]-[i_no1]-...-[i_no2]. Ex: `apb-3-4,btrl-5-6`       |
| channel             | string                                               | Filter the available payment channels. Any combinations of the values CC, OP, C2P, MASTERPASS concatenated with comma.       |
| generateEpid        | string                                               | If specified and have value 1, instead of redirecting the client will return a JSON containing the URL of the payment page.  |
| valability          | Date                                                 | Payment link available until the specified timestamp (Romania timezone).                                                     |
| c2pId               | string                                               | Unique ID of the client used for C2P wallet, blank values disable the wallet.                                                |
| c2pCid              | string                                               | Unique ID of the enroled card used for C2P wallet.                                                                           |
| lang                | 'ro' \| 'en' \| 'fr' \| 'de' \| 'it' \| 'es' \| 'hu' | Preselect the language of the payment page. If not sent the language will be chosen based on the client IP.                  |

_\* required fields_
