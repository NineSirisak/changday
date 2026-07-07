import { Quotation, BusinessProfile, Customer } from '../types';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const generateQuotationText = (
  quotation: Quotation,
  profile: BusinessProfile,
  customer: Customer
): string => {
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
  // 1. Create a blank Google Document with a professional title
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

  // Let's configure the sequential batchUpdate commands
  let cursor = 1;
  const requests: any[] = [];

  const addText = (
    text: string,
    style?: {
      bold?: boolean;
      italic?: boolean;
      fontSize?: number;
      fontFamily?: string;
      alignment?: 'START' | 'CENTER' | 'END';
      color?: { r: number; g: number; b: number };
    }
  ) => {
    const startIndex = cursor;
    requests.push({
      insertText: {
        text,
        location: { index: startIndex },
      },
    });
    const endIndex = startIndex + text.length;
    cursor = endIndex;

    const textStyle: any = {};
    const fields: string[] = [];

    if (style) {
      if (style.bold !== undefined) {
        textStyle.bold = style.bold;
        fields.push('bold');
      }
      if (style.italic !== undefined) {
        textStyle.italic = style.italic;
        fields.push('italic');
      }
      if (style.fontSize !== undefined) {
        textStyle.fontSize = { size: style.fontSize, unit: 'PT' };
        fields.push('fontSize');
      }
      if (style.fontFamily !== undefined) {
        textStyle.weightedFontFamily = { fontFamily: style.fontFamily };
        fields.push('weightedFontFamily');
      } else {
        // Default to Sarabun for crisp, modern professional Thai typography
        textStyle.weightedFontFamily = { fontFamily: 'Sarabun' };
        fields.push('weightedFontFamily');
      }
      if (style.color !== undefined) {
        textStyle.foregroundColor = {
          color: {
            rgbColor: {
              red: style.color.r,
              green: style.color.g,
              blue: style.color.b,
            },
          },
        };
        fields.push('foregroundColor');
      }

      if (fields.length > 0) {
        requests.push({
          updateTextStyle: {
            textStyle,
            fields: fields.join(','),
            range: { startIndex, endIndex },
          },
        });
      }

      if (style.alignment !== undefined) {
        requests.push({
          updateParagraphStyle: {
            paragraphStyle: { alignment: style.alignment },
            fields: 'alignment',
            range: { startIndex, endIndex },
          },
        });
      }
    } else {
      // Force default font "Sarabun" for normal unstyled text
      requests.push({
        updateTextStyle: {
          textStyle: { weightedFontFamily: { fontFamily: 'Sarabun' } },
          fields: 'weightedFontFamily',
          range: { startIndex, endIndex },
        },
      });
    }
  };

  const addHeaderSection = (title: string) => {
    addText(`\n■ ${title}\n`, {
      bold: true,
      fontSize: 12,
      color: { r: 0.06, g: 0.12, b: 0.24 }, // Deep primary slate
    });
    addText('────────────────────────────────────────────────────────────────────────────────\n', {
      color: { r: 0.7, g: 0.7, b: 0.7 },
      fontSize: 8,
    });
  };

  // --- BUILD THE DOCUMENT SEQUENTIALLY ---

  // 1. Document Title Block
  addText('ใบเสนอราคา / QUOTATION\n', {
    bold: true,
    fontSize: 22,
    alignment: 'CENTER',
    color: { r: 0.05, g: 0.1, b: 0.2 },
  });
  if (profile.slogan) {
    addText(`${profile.slogan}\n`, {
      italic: true,
      fontSize: 10,
      alignment: 'CENTER',
      color: { r: 0.4, g: 0.4, b: 0.4 },
    });
  }
  addText('\n', { fontSize: 8 });

  // 2. Profile / Sender Section
  addHeaderSection('ผู้เสนอราคา / SENDER');
  addText(`ชื่อผู้เสนอราคา: ${profile.name}\n`, { bold: true, fontSize: 10 });
  if (profile.address) {
    addText(`ที่อยู่: ${profile.address}\n`, { fontSize: 10 });
  }
  addText(`โทรศัพท์: ${profile.phone || '-'}  |  อีเมล: ${profile.email || '-'}`, { fontSize: 10 });
  if (profile.website || profile.line) {
    addText(`  |  Line ID: ${profile.line || '-'}  |  เว็บไซต์: ${profile.website || '-'}`, { fontSize: 10 });
  }
  addText('\n', { fontSize: 10 });
  if (profile.taxId) {
    addText(`เลขประจำตัวผู้เสียภาษี: ${profile.taxId}\n`, { fontSize: 10 });
  }

  // 3. Customer Section
  addHeaderSection('ลูกค้า / CUSTOMER');
  addText(`ชื่อลูกค้า: ${customer.name}\n`, { bold: true, fontSize: 10 });
  addText(`ที่อยู่ผู้รับบริการ: ${customer.address || 'ให้ลูกค้ากรอกเอง'}\n`, { fontSize: 10 });
  addText(`โทรศัพท์: ${customer.phone || '-'}  |  อีเมล: ${customer.email || '-'}`, { fontSize: 10 });
  addText('\n', { fontSize: 10 });
  if (customer.taxId) {
    addText(`เลขประจำตัวผู้เสียภาษี: ${customer.taxId}\n`, { fontSize: 10 });
  }

  // 4. Quotation Meta Info Section
  addHeaderSection('ข้อมูลเอกสาร / DOCUMENT INFO');
  addText(`เลขที่เอกสาร (Doc No): `, { bold: true, fontSize: 10 });
  addText(`${quotation.docNo}    |    `, { fontSize: 10 });
  addText(`วันที่ออก (Date): `, { bold: true, fontSize: 10 });
  addText(`${quotation.docDate}\n`, { fontSize: 10 });
  addText(`วันสิ้นสุดการรับประกัน (Valid Until): `, { bold: true, fontSize: 10 });
  addText(`${quotation.validUntil}    |    `, { fontSize: 10 });
  addText(`ชื่องานอ้างอิง (Ref No): `, { bold: true, fontSize: 10 });
  addText(`${quotation.refNo || '-'}\n`, { fontSize: 10 });

  // 5. Line Items & Services Table
  addHeaderSection('รายการสินค้าและบริการ / ITEMS & SERVICES');
  addText('\n', { fontSize: 8 });

  // Prepare table properties
  const tableRows = quotation.items.length + 1;
  const tableCols = 6;
  const tableStart = cursor;

  // Insert Table Request
  requests.push({
    insertTable: {
      rows: tableRows,
      columns: tableCols,
      location: { index: tableStart },
    },
  });

  // Backward population of cells to guarantee 100% stable indexing
  const cellInsertions: any[] = [];
  const cellStyles: any[] = [];
  const cellLengths: number[] = [];

  const getCellData = (r: number, c: number) => {
    if (r === 0) {
      // Header row
      return {
        text: [
          'ลำดับ\n(No.)',
          'รายการสินค้าและบริการ\n(Items & Services)',
          'จำนวน\n(Qty)',
          'หน่วย\n(Unit)',
          'ราคา/หน่วย\n(Price)',
          'จำนวนเงิน\n(Amount)',
        ][c],
        bold: true,
        alignment: c === 1 ? 'START' : (c === 0 || c === 3 ? 'CENTER' : 'END') as any,
      };
    } else {
      // Data rows
      const item = quotation.items[r - 1];
      const itemTotal = item.qty * item.price;
      switch (c) {
        case 0:
          return { text: `${r}`, bold: false, alignment: 'CENTER' as const };
        case 1:
          return {
            text: `${item.desc || '-'}${item.detail ? `\nรายละเอียด: ${item.detail}` : ''}`,
            bold: false,
            alignment: 'START' as const,
          };
        case 2:
          return { text: `${item.qty}`, bold: false, alignment: 'END' as const };
        case 3:
          return { text: `${item.unit || 'ชุด'}`, bold: false, alignment: 'CENTER' as const };
        case 4:
          return { text: `${formatCurrency(item.price)}`, bold: false, alignment: 'END' as const };
        case 5:
          return { text: `${formatCurrency(itemTotal)}`, bold: false, alignment: 'END' as const };
        default:
          return { text: '', bold: false, alignment: 'START' as const };
      }
    }
  };

  for (let r = tableRows - 1; r >= 0; r--) {
    for (let c = tableCols - 1; c >= 0; c--) {
      const emptyCellIndex = tableStart + 3 + r * (3 * tableCols + 2) + 3 * c;
      const data = getCellData(r, c);

      if (data.text) {
        cellInsertions.push({
          insertText: {
            text: data.text,
            location: { index: emptyCellIndex },
          },
        });

        const cellStart = emptyCellIndex;
        const cellEnd = emptyCellIndex + data.text.length;
        cellLengths.push(data.text.length);

        // Apply formatting inside table cell
        const textStyle: any = { weightedFontFamily: { fontFamily: 'Sarabun' } };
        const fields = ['weightedFontFamily'];
        if (data.bold) {
          textStyle.bold = true;
          fields.push('bold');
        }

        cellStyles.push({
          updateTextStyle: {
            textStyle,
            fields: fields.join(','),
            range: { startIndex: cellStart, endIndex: cellEnd },
          },
        });

        if (data.alignment) {
          cellStyles.push({
            updateParagraphStyle: {
              paragraphStyle: { alignment: data.alignment },
              fields: 'alignment',
              range: { startIndex: cellStart, endIndex: cellEnd },
            },
          });
        }
      }
    }
  }

  // Add cell insertions & style requests
  requests.push(...cellInsertions);
  requests.push(...cellStyles);

  // Set grey cell background for Header Row cells
  for (let c = 0; c < tableCols; c++) {
    requests.push({
      updateTableCellStyle: {
        tableCellStyle: {
          backgroundColor: {
            color: {
              rgbColor: {
                red: 0.94,
                green: 0.95,
                blue: 0.96,
              },
            },
          },
        },
        fields: 'backgroundColor',
        tableRange: {
          tableCellLocation: {
            tableStartLocation: { index: tableStart },
            rowIndex: 0,
            columnIndex: c,
          },
          rowSpan: 1,
          columnSpan: 1,
        },
      },
    });
  }

  // Update cursor position after table insertion:
  const sumOfCellTextLengths = cellLengths.reduce((sum, len) => sum + len, 0);
  const emptyTableLength = tableRows * (3 * tableCols + 2) + 2;
  cursor = tableStart + emptyTableLength + sumOfCellTextLengths;

  // Add line spacing below table
  addText('\n', { fontSize: 8 });

  // 6. Pricing Summary Block
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

  const summaryText = `มูลค่ารวม (Subtotal):  ${formatCurrency(subtotal)} บาท\n` +
    `ส่วนลด (Discount):  ${formatCurrency(discountAmount)} บาท (${quotation.discountType === 'percent' ? `${quotation.discount}%` : 'บาท'})\n` +
    `มูลค่าหลังหักส่วนลด (Net Amount):  ${formatCurrency(netAmount)} บาท\n` +
    (quotation.vatEnabled ? `ภาษีมูลค่าเพิ่ม ${quotation.vatRate || 7}% (VAT):  ${formatCurrency(vatAmount)} บาท\n` : '') +
    `จำนวนเงินรวมทั้งสิ้น (Grand Total):  ${formatCurrency(grandTotal)} บาท\n`;

  addText(summaryText, {
    bold: true,
    fontSize: 10,
    alignment: 'END',
    color: { r: 0.1, g: 0.1, b: 0.1 },
  });

  // Make the Grand Total line even larger and styled
  const totalLength = summaryText.length;
  const grandTotalLineStr = `จำนวนเงินรวมทั้งสิ้น (Grand Total):  ${formatCurrency(grandTotal)} บาท\n`;
  const grandTotalStart = cursor - grandTotalLineStr.length;
  const grandTotalEnd = cursor;

  requests.push({
    updateTextStyle: {
      textStyle: {
        bold: true,
        fontSize: { size: 12, unit: 'PT' },
        foregroundColor: {
          color: {
            rgbColor: { red: 0.1, green: 0.5, blue: 0.3 }, // Greenish for emphasis
          },
        },
      },
      fields: 'bold,fontSize,foregroundColor',
      range: { startIndex: grandTotalStart, endIndex: grandTotalEnd },
    },
  });

  // 7. Payment Terms & Bank Info Section
  addHeaderSection('การชำระเงินและเงื่อนไข / PAYMENT & CONDITIONS');
  if (quotation.paymentTerms) {
    addText(`เงื่อนไขการชำระเงิน:\n`, { bold: true, fontSize: 10 });
    addText(`${quotation.paymentTerms}\n\n`, { fontSize: 10 });
  }
  addText(`ช่องทางการชำระเงิน:\n`, { bold: true, fontSize: 10 });
  addText(`ธนาคาร: `, { fontSize: 10 });
  addText(`${quotation.bank.name}    |    `, { bold: true, fontSize: 10 });
  addText(`ชื่อบัญชี: `, { fontSize: 10 });
  addText(`${quotation.bank.owner || '-'}    |    `, { bold: true, fontSize: 10 });
  addText(`เลขที่บัญชี: `, { fontSize: 10 });
  addText(`${quotation.bank.no || '-'}\n`, { bold: true, fontSize: 10 });

  // 8. Signature Block (Authorization)
  addHeaderSection('ผู้เสนอราคา และ ผู้ยืนยันใบเสนอราคา / AUTHORIZATION');
  addText('\n\n', { fontSize: 10 });

  const signatureLines = `ลงชื่อผู้เสนอราคา: .......................................                    ลงชื่อลูกค้า (ผู้สั่งซื้อ/ผู้ว่าจ้าง): .......................................\n` +
    `       ( ${quotation.signeeName || '-'} )                                          ( ........................................................... )\n` +
    `ตำแหน่ง: ${quotation.signeePosition || '-'}                                            ตำแหน่ง: ...........................................................\n` +
    `วันที่: ...................................................                    วันที่: ...................................................\n`;

  addText(signatureLines, {
    fontSize: 9,
    color: { r: 0.2, g: 0.2, b: 0.2 },
  });

  // Footer Branding
  addText('\n\n────────────────────────────────────────────────────────────────────────────────\n', {
    color: { r: 0.8, g: 0.8, b: 0.8 },
    fontSize: 8,
  });
  addText('สร้างและบันทึกแบบระบบคุณภาพโดย เดย์ เนรมิต (Google Docs Export Integration)', {
    italic: true,
    fontSize: 8,
    alignment: 'CENTER',
    color: { r: 0.5, g: 0.5, b: 0.5 },
  });

  // 2. Fire the batchUpdate API call
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
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
