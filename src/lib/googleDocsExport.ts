import { Quotation, BusinessProfile, Customer } from '../types';

export const generateQuotationText = (
  quotation: Quotation,
  profile: BusinessProfile,
  customer: Customer
): string => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const lineItemsText = quotation.items
    .map((item, idx) => {
      const lineTotal = item.qty * item.price;
      return `${idx + 1}. ${item.desc}
   รายละเอียด: ${item.detail || '-'}
   จำนวน: ${item.qty} ${item.unit} | ราคาต่อหน่วย: ${formatCurrency(item.price)} บาท | รวม: ${formatCurrency(lineTotal)} บาท`;
    })
    .join('\n\n');

  const subtotal = quotation.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  
  let discountAmount = 0;
  if (quotation.discountType === 'percent') {
    discountAmount = (subtotal * quotation.discount) / 100;
  } else {
    discountAmount = quotation.discount;
  }
  
  const netAmount = subtotal - discountAmount;
  const vatAmount = quotation.vatEnabled ? (netAmount * (quotation.vatRate || 7)) / 100 : 0;
  const grandTotal = netAmount + vatAmount;

  return `================================================================================
ใบเสนอราคา / QUOTATION
================================================================================
เลขที่เอกสาร / Doc No:   ${quotation.docNo}
วันที่ / Date:           ${quotation.docDate}
วันสิ้นสุด / Valid Until:   ${quotation.validUntil}
อ้างอิง / Ref No:       ${quotation.refNo || '-'}

--------------------------------------------------------------------------------
ผู้เสนอราคา / SENDER
--------------------------------------------------------------------------------
ชื่อ:       ${profile.name}
สโลแกน:    ${profile.slogan || '-'}
ที่อยู่:     ${profile.address || '-'}
โทรศัพท์:   ${profile.phone || '-'}
อีเมล:     ${profile.email || '-'}
เว็บไซต์:   ${profile.website || '-'}
Line ID:  ${profile.line || '-'}
${profile.taxId ? `เลขประจำตัวผู้เสียภาษี: ${profile.taxId}` : ''}

--------------------------------------------------------------------------------
ลูกค้า / CUSTOMER
--------------------------------------------------------------------------------
ชื่อลูกค้า:   ${customer.name}
ที่อยู่:     ${customer.address || 'ให้ลูกค้ากรอกเอง'}
โทรศัพท์:   ${customer.phone || '-'}
อีเมล:     ${customer.email || '-'}
${customer.taxId ? `เลขประจำตัวผู้เสียภาษี: ${customer.taxId}` : ''}

--------------------------------------------------------------------------------
รายการสินค้าและบริการ / ITEMS & SERVICES
--------------------------------------------------------------------------------
${lineItemsText}

--------------------------------------------------------------------------------
สรุปมูลค่า / SUMMARY
--------------------------------------------------------------------------------
มูลค่ารวม (Subtotal):               ${formatCurrency(subtotal)} บาท
ส่วนลด (Discount):                 ${formatCurrency(discountAmount)} บาท (${quotation.discountType === 'percent' ? `${quotation.discount}%` : 'บาท'})
มูลค่าหลังหักส่วนลด (Net Amount):     ${formatCurrency(netAmount)} บาท
${quotation.vatEnabled ? `ภาษีมูลค่าเพิ่ม ${quotation.vatRate || 7}% (VAT):        ${formatCurrency(vatAmount)} บาท` : 'ไม่มีภาษีมูลค่าเพิ่ม (VAT 0%)'}
จำนวนเงินรวมทั้งสิ้น (Grand Total):     ${formatCurrency(grandTotal)} บาท

--------------------------------------------------------------------------------
การชำระเงินและเงื่อนไข / PAYMENT & CONDITIONS
--------------------------------------------------------------------------------
เงื่อนไขการชำระเงิน:  ${quotation.paymentTerms || '-'}

ช่องทางการชำระเงิน:
ธนาคาร:           ${quotation.bank.name}
ชื่อบัญชี:          นาย มาโนช เคนดี
เลขบัญชี:          ${quotation.bank.no}

--------------------------------------------------------------------------------
ผู้ยืนยันใบเสนอราคา / AUTHORIZATION
--------------------------------------------------------------------------------
ลงชื่อ: .......................................
      ( ${quotation.signeeName || '-'} )
ตำแหน่ง: ${quotation.signeePosition || '-'}

สร้างและบันทึกผ่านระบบ เดย์ เนรมิต (Google Docs Export)
================================================================================
`;
};

export const exportToGoogleDocs = async (
  accessToken: string,
  quotation: Quotation,
  profile: BusinessProfile,
  customer: Customer
): Promise<{ docUrl: string; docId: string }> => {
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `ใบเสนอราคา ${quotation.docNo} - ${customer.name}`,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Doc: ${errText}`);
  }

  const docData = await createRes.json();
  const docId = docData.documentId;

  const docText = generateQuotationText(quotation, profile, customer);

  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            text: docText,
            location: {
              index: 1,
            },
          },
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Failed to update Google Doc content: ${errText}`);
  }

  return {
    docId,
    docUrl: `https://docs.google.com/document/d/${docId}/edit`,
  };
};
