export interface PrinterTarget {
  type: "network" | "usb";
  systemName: string; // Windows printer name (USB) or IP address (Network)
  printerName?: string; // Display name
  copies?: number;
}

export interface PrintJobData {
  printerId: string;
  printerName: string;
  target: PrinterTarget;
  escPosData: string; // base64 encoded
  copies: number;
}

export interface PreparedPrintResult {
  success: boolean;
  error?: string;
  jobs?: PrintJobData[];
  printJobIds?: string[];
}

export interface AfipInvoicePrintParams {
  // Invoice header
  invoiceType: string;
  invoiceTypeCode?: number;
  invoiceNumber: string;
  ptoVta: string;
  invoiceDate: string;

  // Issuer
  businessName?: string;
  address?: string;
  cuit: string;
  taxStatus?: string;
  grossIncome?: string;
  activityStartDate?: string;

  // Customer
  customerName?: string;
  customerDoc: string;
  customerTaxCondition?: string;

  // Items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    total: number;
  }>;

  // Totals
  subtotal: number;
  vatBreakdown: Array<{
    rate: number;
    base: number;
    amount: number;
  }>;
  totalVat: number;
  total: number;

  // ARCA authorization
  cae: string;
  caeExpiration: string;

  // QR code URL
  qrUrl?: string;

  // Printer config
  printerIp: string;
  charactersPerLine?: number;
}
