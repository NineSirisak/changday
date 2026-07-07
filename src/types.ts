/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LineItem {
  id: string;
  desc: string;
  detail: string;
  qty: number;
  unit: string;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  taxId: string;
  phone: string;
  email: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  slogan: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  line: string;
  customLogo: string | null; // Base64 or null
  senderType: 'corporate' | 'individual'; // corporate has VAT, individual doesn't
}

export interface BankAccount {
  name: string;
  no: string;
  owner: string;
  qrValue: string; // Phone or TaxID or PromptPay string
  qrType: 'promptpay' | 'line' | 'text';
  customQr?: string | null;
}

export interface Quotation {
  id: string;
  docNo: string;
  docDate: string;
  validUntil: string;
  refNo: string;
  profileId: string; // References BusinessProfile
  customerId: string; // References Customer
  items: LineItem[];
  discount: number; // Raw THB amount or percentage? We'll use absolute THB
  discountType: 'flat' | 'percent';
  vatEnabled: boolean;
  vatRate: number; // e.g. 7 for 7%
  notes: string[];
  paymentTerms: string;
  bank: BankAccount;
  signeeName: string;
  signeePosition: string;
  template: 'classic' | 'luxury' | 'dark' | 'elegant' | 'thai-navy' | 'thai-emerald' | 'thai-crimson' | 'thai-teal' | 'thai-charcoal';
  updatedAt: string;
}
