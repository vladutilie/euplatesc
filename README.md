# EuPlătesc Node.js API Library

The EuPlătesc Node Library provides access to the entire EuPlătesc API from applications written in server-side JavaScript.

**IMPORTANT**: For using this package, you have to ask and apply for an account on [EuPlătesc](https://euplatesc.ro) website. After you will sign a contract with EuPlătesc, you will receive credentials for accessing the API.

## <a name="contents"></a>Table of Contents

1. [Table of contents](#contents)
2. [Getting started](#getting-started)
3. [Installation](#installation)
4. [Usage](#usage) & test cards?
5. [API](#api)
   - [Constructor](#api-constructor)
   - [paymentUrl](#api-paymentUrl)
   - [getStatus](#api-getStatus)
   - [capture](#api-capture)
   - [reversal](#api-reversal)
   - [partialCapture](#api-partialCapture)
   - [refund](#api-refund)
   - [cancelRecurring](#api-cancelRecurring)
   - [updateInvoiceId](#api-updateInvoiceId)
   - [getInvoiceList](#api-getInvoiceList)
   - [getInvoiceTransactions](#api-getInvoiceTransactions)
   - [getCapturedTotal](#api-getCapturedTotal)
   - [getCardArt](#api-getCardArt)
   - [getSavedCards](#api-getSavedCards)
   - [removeCard](#api-removeCard)
   - [checkMid](#api-checkMid)
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

### <a name="api-constructor"></a>Constructor

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
  secretKey: process.env.EUPLATEC_SECRET_KEY,
  testMode: 'true' === process.env.EUPLATESC_TEST_MODE,
  userKey: process.env.EUPLATESC_USER_KEY,
  userApi: process.env.EUPLATESC_USER_API
});
```

### <a name="api-paymentUrl"></a>paymentUrl

It generates the payment gateway URL to euplatesc.ro.

```js
import epClient from './lib/epClient';

const data = {
  amount: 12.34,
  currency: 'USD',
  invoiceId: 'invoice id',
  orderDescription: 'The description of the order'
};

console.log(epClient.paymentUrl(data));
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

### <a name="api-getStatus"></a>getStatus

Get status of a transaction.

```js
import epClient from './lib/epClient';

const param = {
  epid: '15F124618DA2E299CBEFA787A09464352946F422'
  // invoiceId: 'FPS12145601'
};

const url = epClient.getStatus(param);
// { paymentUrl: 'https://secure.euplatesc.ro/tdsprocess/tranzactd.php?amount=...' }
// This URL will redirect the user to a secure EuPlătesc payment page.
```

`getStatus` method param object looks like below:

| Field           | Type   | Description                          |
| --------------- | ------ | ------------------------------------ |
| param.epid      | string | The ID of the transaction.           |
| param.invoiceId | string | The ID of the transaction's invoice. |

You have to pass either `epid` of `invoiceId` as param object to get the status. If both are passed, the `epid` field has priority.

### <a name="api-capture"></a>capture

Capture a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const epid = '15F124618DA2E299CBEFA787A09464352946F422';
console.log(await epClient.capture(epid));
// { success: "1" } or { error: "Error message" }
```

| Field | Type   | Description                |
| ----- | ------ | -------------------------- |
| epid  | string | The ID of the transaction. |

### <a name="api-reversal"></a>reversal

Reversal a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const epid = '15F124618DA2E299CBEFA787A09464352946F422';
console.log(await epClient.reversal(epid));
// { success: "1" } or { error: "Error message" }
```

| Field | Type   | Description                |
| ----- | ------ | -------------------------- |
| epid  | string | The ID of the transaction. |

### <a name="api-partialCapture"></a>partialCapture

Partial capture a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const epid = '15F124618DA2E299CBEFA787A09464352946F422';
const amount = 123.78;

console.log(await epClient.partialCapture(epid, amount));
// { success: "1" } or { error: "Error message" }
```

| Field  | Type   | Description                        |
| ------ | ------ | ---------------------------------- |
| epid   | string | The ID of the transaction.         |
| amount | number | The amount to be partial captured. |

### <a name="api-refund"></a>refund

(Partial) Refund a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const epid = '15F124618DA2E299CBEFA787A09464352946F422';
const amount = 123.78;
const reasom = 'Refund reason.';

console.log(await epClient.refund(epid, amount, reason));
// { success: "1" } or { error: "Error message" }
```

| Field  | Type   | Description                                                                            |
| ------ | ------ | -------------------------------------------------------------------------------------- |
| epid   | string | The ID of the transaction.                                                             |
| amount | number | The amount to be refunded. It can be smaller than the total amount of the transaction. |
| reason | string | Optional. The reason why the transaction is refunded.                                  |

### <a name="api-cancelRecurring"></a>cancelRecurring

Cancel a recurring transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const epid = '15F124618DA2E299CBEFA787A09464352946F422';
const reasom = 'The user asked to cancel this recurrent transaction.';

console.log(await epClient.cancelRecurring(epid, reason));
// { success: "<base EPID>" } or { error: "Error message" }
```

| Field  | Type   | Description                                                           |
| ------ | ------ | --------------------------------------------------------------------- |
| epid   | string | The ID of the transaction.                                            |
| reason | string | Optional. The reason why the recurring transaction is to be canceled. |

### <a name="api-updateInvoiceId"></a>updateInvoiceId

Update the invoice ID of a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const epid = '15F124618DA2E299CBEFA787A09464352946F422';
const newInvoiceId = 'INV-0075';

console.log(await epClient.updateInvoiceId(epid, newInvoiceId));
// { success: "1" } or { error: "Error message" }
```

| Field        | Type   | Description                                                  |
| ------------ | ------ | ------------------------------------------------------------ |
| epid         | string | The ID of the transaction which invoice ID is to be updated. |
| newInvoiceId | string | The new invoice ID which is to be updated.                   |

### <a name="api-getInvoiceList"></a>getInvoiceList

Get invoice list.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const from = new Date('2022-08-24');
const to = new Date('2022-09-14');

console.log(await epClient.getInvoiceList({ from, to }));
// { success: [{
//   invoice_number: string;
//   invoice_date: string;
//   invoice_amount_novat: string;
//   invoice_amount_vat: string;
//   invoice_currency: 'RON' | 'EUR' | 'USD';
//   transactions_number: string;
//   transactions_amount: string;
//   transferred_amount: string;
//  }]
// }
```

| Field | Type | Description                                               |
| ----- | ---- | --------------------------------------------------------- |
| from  | Date | Optional. Date the filter starts to search invoices from. |
| to    | Date | Optional. Date the filter ends to search invoices to.     |

If `from` and `to` are sent empty will search invoices in last 3 months.
Returns max 100 records.

### <a name="api-getInvoiceTransactions"></a>getInvoiceTransactions

Get invoice transaction list.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const invoice = 'FPSxxxxxxxx';

console.log(await epClient.getInvoiceTransactions(invoice));
```

| Field   | Type   | Description                |
| ------- | ------ | -------------------------- |
| invoice | string | Settlement invoice number. |

Return type:

```js
// { success: InvoiceTransaction[] }
{
  success: [{
    mid: string;
    invoice_id: string;
    epid: string;
    rrn: string;
    amount: string;
    commission: string;
    installments: string;
    type: 'capture' | 'refund' | 'chargeback';
  }]
}
```

### <a name="api-getCapturedTotal"></a>getCapturedTotal

Get captured total.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const params = {
  mids: '4484xxxxxxxxx,4484xxxxxxxxx', // or just "4484xxxxxxxxx"
  from: new Date('2022-02-13'),
  to: new Date('2022-03-22')
};

console.log(await epClient.getCapturedTotal(params));
```

| Field | Type   | Description                                                                                                     |
| ----- | ------ | --------------------------------------------------------------------------------------------------------------- |
| mids  | string | Optional. Merchant IDs sepparated by comma. If empty, it will setup the merchant ID from client initialization. |
| from  | Date   | Optional. Date the filter starts to search totals from.                                                         |
| to    | Date   | Optional. Date the filter ends to search totals to.                                                             |

If `from` and `to` are sent empty will search in the last month.

Return type:

```js
// { success: CapturedTotal }
{
  success: {
    EUR?: string;
    GBP?: string;
    RON?: string;
    USD?: string;
  }
}
```

### <a name="api-getCardArt"></a>getCardArt

Get card art data.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass `userKey` and `userApi`, too.

```js
import epClient from './lib/epClient';

const epid = '15F124618DA2E299CBEFA787A09464352946F422';

console.log(await epClient.getCardArt(epid));
```

| Field | Type   | Description                  |
| ----- | ------ | ---------------------------- |
| epid  | string | The EPID of the transaction. |

Return type:

```js
// { success: CardArt } | { error: string; ecode: string }
{
  success: {
    bin: string;
    last4: string;
    exp: string;
    cardart: string;
  }
}
```

### <a name="api-getSavedCards"></a>getSavedCards

Get saved cards of a customer.

```js
import epClient from './lib/epClient';

const clientId = '1';
const mid = '4484xxxxxxxxx';

console.log(await epClient.getSavedCards(clientId, mid));
```

| Field    | Type   | Description                                                                                |
| -------- | ------ | ------------------------------------------------------------------------------------------ |
| clientId | string | The ID of the client.                                                                      |
| mid      | string | Optional. Merchant ID. If empty, it will setup the merchant ID from client initialization. |

Return type:

```js
// { success: SavedCard[] } | { error: string; ecode: string }
{
  success: [{
    id: string;
    bin: string;
    last4: string;
    mask: string;
    exp: string;
    cardart: string;
  }]
}
```

### <a name="api-removeCard"></a>removeCard

Get saved cards of a customer.

```js
import epClient from './lib/epClient';

const clientId = '1';
const cardId = '234';
const mid = '4484xxxxxxxxx';

console.log(await epClient.removeCard(clientId, cardId, mid));

// { success: "1" } or { error, ecode }
```

Parameter list:

| Field    | Type   | Description                                                                                |
| -------- | ------ | ------------------------------------------------------------------------------------------ |
| clientId | string | The ID of the client.                                                                      |
| cardId   | string | The ID of the card.                                                                        |
| mid      | string | Optional. Merchant ID. If empty, it will setup the merchant ID from client initialization. |

### <a name="api-checkMid"></a>checkMid

Get saved cards of a customer.

```js
import epClient from './lib/epClient';

const mid = '4484xxxxxxxxx';

console.log(await epClient.checkMid(clientId, cardId, mid));

// { success: "1" } or { error, ecode }
```

Parameter list:

| Field | Type   | Description                                                                                |
| ----- | ------ | ------------------------------------------------------------------------------------------ |
| mid   | string | Optional. Merchant ID. If empty, it will setup the merchant ID from client initialization. |

Return type:

```js
// { success: Merchant } | { error: string }
{
  success: {
    name: string;
    url: string;
    cui: string;
    j: string;
    status: string;
    recuring: string;
    tpl: string;
    rate_mode: string;
    rate_apb: string;
    rate_btrl: string;
    rate_brdf: string;
    rate_fbr: string;
    rate_gbr: string;
    rate_rzb: string;
  }
}
```
