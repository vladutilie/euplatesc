# EuPlătesc Node.js API Library

The EuPlătesc Node Library provides access to the entire EuPlătesc API from applications written in server-side JavaScript.

**IMPORTANT**: To use this package, you need to ask and apply for an account on the [EuPlătesc](https://euplatesc.ro) website. After signing a contract with EuPlătesc, you will receive credentials for accessing the API.

# Table of Contents

1. [Table of contents](#table-of-contents)
2. [Getting started](#getting-started-)
3. [Installation](#installation-)
4. [Usage](#usage-)
5. [API](#api-)
   - [Constructor](#constructor-)
   - [paymentUrl](#paymenturl-)
   - [checkResponse](#checkresponse-)
   - [getStatus](#getstatus-)
   - [capture](#capture-)
   - [reversal](#reversal-)
   - [partialCapture](#partialcapture-)
   - [refund](#refund-)
   - [cancelRecurring](#cancelrecurring-)
   - [updateInvoiceId](#updateinvoiceid-)
   - [getInvoiceList](#getinvoicelist-)
   - [getInvoiceTransactions](#getinvoicetransactions-)
   - [getCapturedTotal](#getcapturedtotal-)
   - [getCardArt](#getcardart-)
   - [getSavedCards](#getsavedcards-)
   - [removeCard](#removecard-)
   - [checkMid](#checkmid-)
6. [Test cards](#test-cards-)
7. [Built with](#built-with-)
8. [License](#license-)

# Getting started [⤴](#table-of-contents)

This package is the result of my passion and openness to open-source software. I had to implement this service many times in my projects, and almost every time, I had to deal with a headache due to the poor documentation and the non-standard "REST API" provided by EuPlătesc.

This package covers all the actions provided in the EuPlătesc documentation. It can be used either as a CommonJS or ES module.

# Installation [⤴](#table-of-contents)

Using npm:

```sh
$ npm install euplatesc
```

Using yarn:

```sh
$ yarn add euplatesc
```

# Usage [⤴](#table-of-contents)

Create a client file and instantiate the EuPlătesc class:

```ts
// ./src/lib/epClient.js
import { EuPlatesc } from 'euplatesc';

export default epClient = new EuPlatesc({
  merchantId: process.env.EUPLATESC_MERCHANT_ID,
  secretKey: process.env.EUPLATESC_SECRET_KEY
});
```

Import the client and call the methods you need:

```ts
// ./src/index.js
import epClient from './lib/epClient';

epClient.checkMid().then((midInfo) => console.log(midInfo));

// Also it can be used with async-await:
// await epClient.checkMid()
```

# API [⤴](#table-of-contents)

## Constructor [⤴](#table-of-contents)

```ts
import { EuPlatesc } from 'euplatesc';

const epClient = new EuPlatesc({
  merchantId: process.env.EUPLATESC_MERCHANT_ID,
  secretKey: process.env.EUPLATESC_SECRET_KEY,
  testMode: 'true' === process.env.EUPLATESC_TEST_MODE,
  userKey: process.env.EUPLATESC_USER_KEY,
  userApi: process.env.EUPLATESC_USER_API
});
```

The merchant ID (MID) and the secret key (KEY) can be found at EuPlătesc Panel > Integrations parameters.

The user key (UKEY) and the user API (UAPI) are optional for some methods, but required for others - these methods are indicated with a notice. These credentials can be found at EuPlătesc Panel > Settings > User settings > Account permissions.

<details>
  <summary>Parameter list</summary>

| Field         | Type    | Description                                                            |
| ------------- | ------- | ---------------------------------------------------------------------- |
| merchantId \* | string  | The merchant ID.                                                       |
| secretKey \*  | string  | The secret key.                                                        |
| testMode      | boolean | Optional. Whether the module is in test mode or not. Default: `false`. |
| userKey       | string  | Optional. The user key                                                 |
| userApi       | string  | Optional. The user API.                                                |

\* Required field.

</details>

## paymentUrl [⤴](#table-of-contents)

Generate EuPlătesc payment URL.

```ts
import epClient from './lib/epClient';

const data = {
  amount: 12.34,
  currency: 'USD',
  invoiceId: 'invoice id',
  orderDescription: 'The description of the order'
};

console.log(epClient.paymentUrl(data));
```

<details>
  <summary>Parameter list</summary>

| Field               | Type                                                                 | Description                                                                                                                    |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| amount \*           | number                                                               |                                                                                                                                |
| currency \*         | 'RON' \| 'EUR' \| 'USD' \| 'HUF' \| 'MDL' \| 'BGN' \| 'GBP' \| 'PLN' |                                                                                                                                |
| invoiceId \*        | string                                                               |                                                                                                                                |
| orderDescription \* | string                                                               |                                                                                                                                |
| frequency           | { days: number; expiresAt: Date }                                    |                                                                                                                                |
| billingFirstName    | string                                                               |                                                                                                                                |
| billingLastName     | string                                                               |                                                                                                                                |
| billingCompany      | string                                                               | Billing company name.                                                                                                          |
| billingAddress      | string                                                               | Billing (company) address.                                                                                                     |
| billingCity         | string                                                               | Billing (company) city.                                                                                                        |
| billingState        | string                                                               | Billing (company) county.                                                                                                      |
| billingZip          | string                                                               | Billing (company) ZIP code.                                                                                                    |
| billingCountry      | string                                                               | Billing (company) country.                                                                                                     |
| billingPhone        | string                                                               | Billing (company) phone number.                                                                                                |
| billingEmail        | string                                                               | Billing (company) email address.                                                                                               |
| shippingFirstName   | string                                                               |                                                                                                                                |
| shippingLastName    | string                                                               |                                                                                                                                |
| shippingCompany     | string                                                               | Company data.                                                                                                                  |
| shippingAddress     | string                                                               |                                                                                                                                |
| shippingCity        | string                                                               |                                                                                                                                |
| shippingState       | string                                                               |                                                                                                                                |
| shippingZip         | string                                                               |                                                                                                                                |
| shippingCountry     | string                                                               |                                                                                                                                |
| shippingPhone       | string                                                               |                                                                                                                                |
| shippingEmail       | string                                                               |                                                                                                                                |
| Extra               | string                                                               | Additional information sent by the merchant to the gateway. This data is echoed back to the merchant in the reply request.     |
| silentUrl           | string                                                               | Callback URL                                                                                                                   |
| successUrl          | string                                                               | URL to redirect the client in case of a successful transaction.                                                                |
| failedUrl           | string                                                               | URL to redirect the client in case of a failed transaction.                                                                    |
| epTarget            | string                                                               | "self" for the case of using iframe.                                                                                           |
| epMethod            | string                                                               | "post" or "get" for succes/fail redirect.                                                                                      |
| backToSite          | string                                                               | URL to redirect the client when clicking back to the site button or after 60 seconds on the result page.                       |
| backToSiteMethod    | string                                                               | "post" or "get" for the back-to-site button.                                                                                   |
| expireUrl           | string                                                               | If a timer is set on the payment page, you can change the URL to which the client will be redirected when the timer reaches 0. |
| rate                | string                                                               | Installments number. Format: [bank_code]-[installments_no].                                                                    |
| filterRate          | string                                                               | Installments number. Format: [bank_code1]-[i_no1]-...-[i_noN],[bank_code2]-[i_no1]-...-[i_no2]. Ex: `apb-3-4,btrl-5-6`         |
| channel             | string                                                               | Filter the available payment channels. Any combinations of the values CC, OP, C2P, and MASTERPASS concatenated with a comma.   |
| generateEpid        | string                                                               | If specified and have value 1, instead of redirecting the client will return a JSON containing the URL of the payment page.    |
| valability          | Date                                                                 | Payment link available until the specified timestamp (Romania timezone).                                                       |
| c2pId               | string                                                               | Unique ID of the client used for C2P wallet, blank values disable the wallet.                                                  |
| c2pCid              | string                                                               | Unique ID of the enrolled card used for C2P wallet.                                                                            |
| lang                | 'ro' \| 'en' \| 'fr' \| 'de' \| 'it' \| 'es' \| 'hu'                 | Preselect the language of the payment page. If not sent, the language will be chosen based on the client\'s IP.                |

_\* required fields_

</details>

<details>
  <summary>Return</summary>

Example:

```ts
{
  paymentUrl: 'https://secure.euplatesc.ro/tdsprocess/tranzactd.php?amount=...';
}
```

The returned URL will redirect the user to a secure EuPlătesc payment page.

Type:

```ts
{
  paymentUrl: string;
}
```

</details>

## checkResponse [⤴](#table-of-contents)

Check the backward response received by the EuPlătesc POST request.

This logic should be used as a callback in an API endpoint that processes a POST request from the EuPlătesc server.

```ts
import epClient from './lib/epClient';

// The data below should be passed from a POST request from EuPlătesc server after a payment is made.
const params = {
  amount: '',
  currency: '',
  invoiceId: '',
  epId: '',
  merchantId: '',
  action: '',
  message: '',
  approval: '',
  timestamp: '',
  nonce: '',
  fpHash: ''
};

console.log(epClient.checkResponse(params));
```

<details>
  <summary>Parameter list</summary>

| Field      | Type                                                                 | Description                            |
| ---------- | -------------------------------------------------------------------- | -------------------------------------- |
| amount     | string                                                               | The made transaction's amount.         |
| currency   | 'RON' \| 'EUR' \| 'USD' \| 'HUF' \| 'MDL' \| 'BGN' \| 'GBP' \| 'PLN' | The made transaction's currency.       |
| invoiceId  | string                                                               | The made transaction's invoice ID.     |
| epId       | string                                                               | The made transaction's ep ID.          |
| merchantId | string                                                               | The made transaction's merchant ID.    |
| action     | string                                                               | The made transaction's action.         |
| message    | string                                                               | The made transaction's message.        |
| approval   | string                                                               | The made transaction's approval value. |
| timestamp  | string                                                               | The made transaction's timestamp.      |
| nonce      | string                                                               | The made transaction's nonce.          |
| fpHash     | string                                                               | The made transaction's hash.           |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
// ResponseResult
{ success: true, response: 'complete' }
```

Type:

```ts
type ResponseResult = {
  success: boolean;
  response: 'complete' | 'failed' | 'invalid';
};
```

</details>

## getStatus [⤴](#table-of-contents)

Get the status of a transaction.

```ts
import epClient from './lib/epClient';

const params = {
  epId: '15F124618DA2E299CBEFA787A09464352946F422'
  // invoiceId: 'FPS12145601'
};

console.log(await epClient.getStatus(params));
```

<details>
  <summary>Parameter list</summary>

| Field     | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| epId      | string | The ID of the transaction.           |
| invoiceId | string | The ID of the transaction's invoice. |

You have to pass either `epId` or `invoiceId` as a param object to get the status. If both are passed, the `epId` field has priority.

</details>

<details>
  <summary>Return</summary>

Example:

```ts
{
  success: `[{merch_id: "4484xxxxxxxxx", invoice_id: "00000", ep_id:"0000000000000000000000000000000000000000", action: "0", message: "Approved", captured: "0", refunded: "0", masked_card: "444444xxxxxx4444", card_expire: "mm-yy", name_on_card: "Test", email: "test@test.com", timestamp: "2014-11-26 10:11:48", tran_type: "Normal", recurent_exp: "", recurent_cancel_date: "" }]`;
}
```

Type:

```ts
{ success: string } | { error: string, ecode: string }
```

</details>

## capture [⤴](#table-of-contents)

Capture a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const epId = '15F124618DA2E299CBEFA787A09464352946F422';
console.log(await epClient.capture(epId));
```

<details>
  <summary>Parameter list</summary>

| Field | Type   | Description                |
| ----- | ------ | -------------------------- |
| epId  | string | The ID of the transaction. |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
{
  success: '1';
}
```

Type:

```ts
{ success: string } | { error: string; ecode: string }
```

</details>

## reversal [⤴](#table-of-contents)

Reversal of a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const epId = '15F124618DA2E299CBEFA787A09464352946F422';
console.log(await epClient.reversal(epId));
```

<details>
  <summary>Parameter list</summary>

| Field | Type   | Description                |
| ----- | ------ | -------------------------- |
| epId  | string | The ID of the transaction. |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
{
  success: '1';
}
```

Type:

```ts
{ success: string } | { error: string; ecode: string }
```

</details>

## partialCapture [⤴](#table-of-contents)

Partial capture of a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const epId = '15F124618DA2E299CBEFA787A09464352946F422';
const amount = 123.78;

console.log(await epClient.partialCapture(epId, amount));
```

<details>
  <summary>Parameter list</summary>

| Field  | Type   | Description                |
| ------ | ------ | -------------------------- |
| epId   | string | The ID of the transaction. |
| amount | number | Partially captured amount. |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
{
  success: '1';
}
```

Type:

```ts
{ success: string } | { error?: string; message?: string; ecode: string }
```

</details>

## refund [⤴](#table-of-contents)

(Partial) Refund a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const epId = '15F124618DA2E299CBEFA787A09464352946F422';
const amount = 123.78;
const reason = 'Refund reason.';

console.log(await epClient.refund(epId, amount, reason));
```

<details>
  <summary>Parameter list</summary>

| Field  | Type   | Description                                                                      |
| ------ | ------ | -------------------------------------------------------------------------------- |
| epId   | string | The ID of the transaction.                                                       |
| amount | number | The refunded amount. It can be smaller than the total amount of the transaction. |
| reason | string | Optional. The reason, the transaction is to be refunded.                         |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
{
  success: '1';
}
```

Type:

```ts
{ success: string } | { error?: string; message?: string; ecode: string }
```

</details>

## cancelRecurring [⤴](#table-of-contents)

Cancel a recurring transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const epId = '15F124618DA2E299CBEFA787A09464352946F422';
const reason = 'The user asked to cancel this recurrent transaction.';

console.log(await epClient.cancelRecurring(epId, reason));
```

<details>
  <summary>Parameter list</summary>

| Field  | Type   | Description                                                        |
| ------ | ------ | ------------------------------------------------------------------ |
| epId   | string | The ID of the transaction.                                         |
| reason | string | Optional. The reason, the recurring transaction is to be canceled. |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
{
  success: '<base EPID>';
}
```

Type:

```ts
{ success: string } | { error?: string; message?: string; ecode: string }
```

</details>

## updateInvoiceId [⤴](#table-of-contents)

Update the invoice ID of a transaction.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const epId = '15F124618DA2E299CBEFA787A09464352946F422';
const newInvoiceId = 'INV-0075';

console.log(await epClient.updateInvoiceId(epId, newInvoiceId));
```

<details>
  <summary>Parameter list</summary>

| Field        | Type   | Description                                        |
| ------------ | ------ | -------------------------------------------------- |
| epId         | string | The ID of transaction invoice ID is to be updated. |
| newInvoiceId | string | The new invoice ID is to be updated.               |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
{
  success: '1';
}
```

Type:

```ts
{ success: string } | { error: string }
```

</details>

## getInvoiceList [⤴](#table-of-contents)

Get invoice list.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const from = new Date('2022-08-24');
const to = new Date('2022-09-14');

console.log(await epClient.getInvoiceList({ from, to }));
```

<details>
  <summary>Parameter list</summary>

| Field | Type | Description                                                         |
| ----- | ---- | ------------------------------------------------------------------- |
| from  | Date | Optional. The date from which the filter starts to search invoices. |
| to    | Date | Optional. The date to which the filter ends to search invoices.     |

If `from` and `to` are sent empty, it will look for invoices from the last three months.
It returns max 100 records.

</details>

<details>
  <summary>Return</summary>

Example:

```ts
// { success: Invoice[] } | { error: string }
{
  success: [
    {
      invoice_number: '',
      invoice_date: '',
      invoice_amount_novat: '',
      invoice_amount_vat: '',
      invoice_currency: '',
      transactions_number: '',
      transactions_amount: '',
      transferred_amount: ''
    }
  ];
}
```

Type:

```ts
type Invoice = {
  invoice_number: string;
  invoice_date: string;
  invoice_amount_novat: string;
  invoice_amount_vat: string;
  invoice_currency: 'RON' | 'EUR' | 'USD';
  transactions_number: string;
  transactions_amount: string;
  transferred_amount: string;
};
```

</details>

## getInvoiceTransactions [⤴](#table-of-contents)

Get invoice transaction list.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const invoice = 'FPSxxxxxxxx';

console.log(await epClient.getInvoiceTransactions(invoice));
```

<details>
  <summary>Parameter list</summary>

| Field   | Type   | Description                |
| ------- | ------ | -------------------------- |
| invoice | string | Settlement invoice number. |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
// { success: InvoiceTransaction[] } | { error: string }
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

Type:

```ts
type InvoiceTransaction = {
  mid: string;
  invoice_id: string;
  epid: string;
  rrn: string;
  amount: string;
  commission: string;
  installments: string;
  type: 'capture' | 'refund' | 'chargeback';
};
```

</details>

## getCapturedTotal [⤴](#table-of-contents)

Get captured total.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const params = {
  mids: '4484xxxxxxxxx,4484xxxxxxxxx', // or just "4484xxxxxxxxx"
  from: new Date('2022-02-13'),
  to: new Date('2022-03-22')
};

console.log(await epClient.getCapturedTotal(params));
```

<details>
  <summary>Parameter list</summary>

| Field | Type   | Description                                                                                                      |
| ----- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| mids  | string | Optional. Separated merchant IDs by commas. If empty, it will set up the merchant ID from client initialization. |
| from  | Date   | Optional. The date from which the filter starts to search totals.                                                |
| to    | Date   | Optional. The date to which the filter ends to search totals.                                                    |

If `from` and `to` are empty, it will look for the total in the last month.

</details>

<details>
  <summary>Return</summary>

Example:

```ts
// { success: CapturedTotal } | { error: string }
{
  success: {
    EUR: "xxx",
    GBP: "xxx",
    RON: "xxx",
    USD: "xxx"
  }
}
```

Type:

```ts
type CapturedTotal = {
  EUR?: string;
  GBP?: string;
  RON?: string;
  USD?: string;
};
```

</details>

## getCardArt [⤴](#table-of-contents)

Get card art data.

**IMPORTANT:** For using this method, in addition to merchant ID and secret key in the EuPlătesc client instantiation you should pass both `userKey` and `userApi`, too.

```ts
import epClient from './lib/epClient';

const epId = '15F124618DA2E299CBEFA787A09464352946F422';

console.log(await epClient.getCardArt(epId));
```

<details>
  <summary>Parameter list</summary>

| Field | Type   | Description                  |
| ----- | ------ | ---------------------------- |
| epId  | string | The EPID of the transaction. |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
// { success: CardArt } | { error: string; ecode: string }
{
  success: {
    bin: "4xxxxx",
    last4: "xxxx",
    exp: "yymm",
    cardart: "*BASE64 ENCODED IMAGE*"
  }
}
```

Type:

```ts
type CardArt = {
  bin: string;
  last4: string;
  exp: string;
  cardart: string;
};
```

</details>

## getSavedCards [⤴](#table-of-contents)

Get saved cards of a customer.

```ts
import epClient from './lib/epClient';

const clientId = '1';
const mid = '4484xxxxxxxxx';

console.log(await epClient.getSavedCards(clientId, mid));
```

<details>
  <summary>Parameter list</summary>

| Field    | Type   | Description                                                                                 |
| -------- | ------ | ------------------------------------------------------------------------------------------- |
| clientId | string | The ID of the client.                                                                       |
| mid      | string | Optional. Merchant ID. If empty, it will set up the merchant ID from client initialization. |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
// { cards: SavedCard[] } | { error: string; ecode: string }
{
  cards: [
    {
      id: 'xxxxxx',
      bin: '479032',
      last4: '4512',
      mask: '479032xxxxxx4512',
      exp: '23-10',
      cardart:
        'https://secure.euplatesc.ro/tdsprocess/images/ca8_small/1698962c052c3c6e40468363636304b23070222638c5f7071d415372b5119ba6.jpg'
    }
  ];
}
```

Type:

```ts
type SavedCard = {
  id: string;
  bin: string;
  last4: string;
  mask: string;
  exp: string;
  cardart: string;
};
```

</details>

## removeCard [⤴](#table-of-contents)

Remove a saved card of a customer.

```ts
import epClient from './lib/epClient';

const clientId = '1';
const cardId = '234';
const mid = '4484xxxxxxxxx';

console.log(await epClient.removeCard(clientId, cardId, mid));
```

<details>
  <summary>Parameter list</summary>

| Field    | Type   | Description                                                                                 |
| -------- | ------ | ------------------------------------------------------------------------------------------- |
| clientId | string | The ID of the client.                                                                       |
| cardId   | string | The ID of the card.                                                                         |
| mid      | string | Optional. Merchant ID. If empty, it will set up the merchant ID from client initialization. |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
{
  success: '1';
}
```

Type:

```ts
{ success: string } | { error: string; ecode: string }
```

</details>

## checkMid [⤴](#table-of-contents)

Check a merchant ID.

```ts
import epClient from './lib/epClient';

const mid = '4484xxxxxxxxx';

console.log(await epClient.checkMid(mid));

// { success: "1" } or { error, ecode }
```

<details>
  <summary>Parameter list</summary>

| Field | Type   | Description                                                                                 |
| ----- | ------ | ------------------------------------------------------------------------------------------- |
| mid   | string | Optional. Merchant ID. If empty, it will se tup the merchant ID from client initialization. |

</details>

<details>
  <summary>Return</summary>

Example:

```ts
// Merchant | { error: string }
{
  name: "...",
  url: "...",
  cui: "...",
  j: "...",
  status: "test/live",
  recuring: "N/Y/YA",
  tpl: "tpl-v15/tpl-v17/tpl-v21",
  rate_mode: "C/EP",
  rate_apb: "6;12",
  rate_btrl: "2;3;4;5;6",
  rate_brdf: "3;6",
  rate_fbr: "2;3;4",
  rate_gbr: "",
  rate_rzb: "2;3;4;5;6;7;8;9;10;11;12;15;18;20;24"
}
```

Type:

```ts
type Merchant = {
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
};
```

</details>

# Test cards [⤴](#table-of-contents)

| Card number      | Expire date | CVC | Name | Result                |
| ---------------- | ----------- | --- | ---- | --------------------- |
| 4111111111111111 | 24/01       | 123 | Test | Authentication failed |
| 4444333322221111 | 24/01       | 123 | Test | Not sufficient funds  |
| 4000020000000000 | 24/01       | 123 | Test | Transaction declined  |
| 4400000000000008 | 24/01       | 123 | Test | Expired card          |
| 4607000000000009 | 24/01       | 123 | Test | Invalid response      |
| 4000640000000005 | 24/01       | 123 | Test | Approved              |
| 5454545454545454 | 24/01       | 123 | Test | Authentication failed |
| 5555555555554444 | 24/01       | 123 | Test | Not sufficient funds  |
| 2222400010000008 | 24/01       | 123 | Test | Transaction declined  |
| 2222400030000004 | 24/01       | 123 | Test | Expired card          |
| 5100060000000002 | 24/01       | 123 | Test | Invalid response      |
| 5500000000000004 | 24/01       | 123 | Test | Approved              |

# Built with [⤴](#table-of-contents)

- [axios](https://www.npmjs.com/package/axios)
- [Form-Data](https://www.npmjs.com/package/form-data)

# License [⤴](#table-of-contents)

[MIT License](https://github.com/vladutilie/euplatesc/blob/main/LICENSE)
