export type InvoiceTransaction = {
  mid: string;
  invoice_id: string;
  epid: string;
  rrn: string;
  amount: string;
  commission: string;
  installments: string;
  type: 'capture' | 'refund' | 'chargeback';
};
