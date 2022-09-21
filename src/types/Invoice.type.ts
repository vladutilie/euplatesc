export type Invoice = {
  invoice_number: string;
  invoice_date: string;
  invoice_amount_novat: string;
  invoice_amount_vat: string;
  invoice_currency: 'RON' | 'EUR' | 'USD';
  transactions_number: string;
  transactions_amount: string;
  transferred_amount: string;
};
