# Changelog

## [1.1.0] - 2026-08-13

### Added

- `getTransactionList` method, wrapping the `transactions` web service.
- `printTransaction` method, returning the transaction receipt as a base64 encoded PDF.
- `paymentParams` method, returning the raw gateway field set. Use it to POST the fields yourself, which is the only supported way to run a subsequent recurring transaction server to server.
- Subsequent recurring transactions: `baseEpId` and `recurrentType` (`Base`, `Recurent`, `Recurent2CIT`) fields in `paymentUrl`/`paymentParams`.
- `checkResponse` now accepts the optional response fields (`secStatus`, `rrn`, `mcard`, `cardExp`, `discountAmount`, `paymentChannel`, `cardType`, `bin`, `rate`, `cardHolder`, `email`, `rtype`, `cce`) and hashes them after `nonce`, in the order the gateway uses.
- `silentUrlSec` (SecStatus callback URL) and `validateCc` (zero-amount card validation) order fields.
- `timeout` client option, defaulting to 30 seconds. Requests were previously unbounded.
- `frequency.expiresAt` is now optional, and `currency` was added to `InvoiceTransaction`.

### Tooling

- Development dependencies updated: ESLint 8 → 10 (flat config, `.eslintrc.json` replaced by `eslint.config.mjs`), Jest 29 → 30, TypeScript 5.2 → 6, Prettier 3.9, `@types/node` 24.
- `npm run lint` works for the first time: `.eslintrc.json` referenced `@typescript-eslint` plugins that were never installed. The `typescript-eslint` package is now a devDependency, and linting runs in CI.
- `ts-node` dropped - it was unused.
- CI moved to Node 24 (Node 20 is end-of-life) and `actions/setup-node@v4`.

### Removed

- **The `axios` and `form-data` dependencies.** The client now uses the `fetch` and `FormData` globals, which makes the package dependency-free but raises the minimum supported runtime to **Node 18**. A failed request now rejects with a plain `Error` rather than an `AxiosError`, and non-JSON replies are reported as such instead of surfacing as an unexpected shape.

### Changed

- `epMethod` also accepts `getclean`, and `channel` documents the current payment channels: `CC`, `OP`, `C2P`, `GPAY`, `APAY`, `TBI`, `paypo`.
- `getCardArt` returns the card art object directly (`CardArt | { error, ecode }`), matching what the gateway actually replies. It was previously typed as `{ success: CardArt }`.
- `amount` is always sent with two decimals, as the gateway documents.
- Response hashes are compared in constant time.

### Fixed

- The default recurring expiry date was built by string concatenation, producing an 8+ character `recurent_exp` such as `20261 0104` instead of a year from now.
- `valability` mixed the local year with UTC month/day. Every date is now formatted in UTC.
- Fields with an `undefined` value were hashed as the literal `"undefined"` instead of `-`, which broke the signature of any payload holding one.

## [1.0.5] - 2023-09-29

### Changed

- Support for the following currencies was added: HUF, MDL, BGN, GBP, and PLN.
- Typos fixed in the readme file.
- Axios updated to the latest version: 1.5.1.
- Development dependencies updated.

## [1.0.4] - 2022-11-01

### Changed

- Development dependencies updated.

### Fixed

- Read me and the main class documentation typos fixed.

## [1.0.3] - 2022-10-21

### Changed

- Axios major update to 1.1.3.
- `epid` field renamed to `epId` in all methods where it's used.
- Development dependencies updated.

### Fixed

- Start and end white spaces removed in `paymentUrl` method on `invoiceId` field.
- Read me documentation typos fixed.
