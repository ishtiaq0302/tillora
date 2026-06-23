export function printSaleInvoice(sale, businessName = "My Store") {
  const items = sale.saleItems || [];
  const hasVariants = items.some((item) => item.variant_label);

  const rows = items.map((item) => {
    const basePrice = item.variant_price > 0
      ? Number(item.price - item.variant_price).toLocaleString()
      : Number(item.price).toLocaleString();
    const variantCell = hasVariants
      ? `<td style="text-align:right;font-size:11.5px">${item.variant_label ? `<span style="color:#4F8EF7;font-weight:600">${item.variant_label}</span>` : "—"}</td>`
      : "";
    const variantPriceCell = hasVariants
      ? `<td style="text-align:right">${item.variant_price > 0 ? `<span style="color:#4F8EF7">+${Number(item.variant_price).toLocaleString()}</span>` : "—"}</td>`
      : "";
    return `
      <tr>
        <td>${item.product?.name || "—"}</td>
        ${variantCell}
        <td style="text-align:right">${item.quantity}</td>
        <td style="text-align:right">${basePrice}</td>
        ${variantPriceCell}
        <td style="text-align:right">${Number(item.total).toLocaleString()}</td>
      </tr>
    `;
  }).join("");

  const tableHeaders = hasVariants
    ? ["Item", "Variant", "Qty", "Base Price", "Variant Price", "Total"]
    : ["Item", "Qty", "Price", "Total"];

  _doPrint(_invoiceHtml({
    type: "SALE INVOICE",
    invoiceNo: sale.invoice_no,
    date: sale.created_at ? new Date(sale.created_at).toLocaleString() : "—",
    partyLabel: "Customer",
    partyName: sale.customer?.name || "Walk-in",
    storeLabel: "Store",
    storeName: sale.store?.name || "—",
    rows,
    tableHeaders,
    subtotal: Number(sale.subtotal || 0),
    discount: Number(sale.discount || 0),
    tax: Number(sale.tax || 0),
    shipping: Number(sale.shipping || 0),
    grandTotal: Number(sale.grand_total || 0),
    notes: sale.notes || "",
    statusLabel: "Payment",
    statusValue: sale.payment_status || "—",
    businessName,
  }));
}

export function printPurchaseInvoice(purchase, businessName = "My Store") {
  const items = purchase.purchaseItems || [];
  const rows = items.map((item) => `
    <tr>
      <td>${item.product?.name || "—"}</td>
      <td style="text-align:right">${item.quantity}</td>
      <td style="text-align:right">${Number(item.cost_price ?? item.price ?? 0).toLocaleString()}</td>
      <td style="text-align:right">${Number(item.total).toLocaleString()}</td>
    </tr>
  `).join("");

  _doPrint(_invoiceHtml({
    type: "PURCHASE ORDER",
    invoiceNo: purchase.invoice_no,
    date: purchase.created_at ? new Date(purchase.created_at).toLocaleString() : "—",
    partyLabel: "Supplier",
    partyName: purchase.supplier?.name || "—",
    storeLabel: "Store",
    storeName: purchase.store?.name || "—",
    rows,
    subtotal: Number(purchase.subtotal || 0),
    discount: Number(purchase.discount || 0),
    tax: Number(purchase.tax || 0),
    shipping: Number(purchase.shipping || 0),
    grandTotal: Number(purchase.grand_total || 0),
    notes: purchase.notes || "",
    statusLabel: "Payment",
    statusValue: purchase.payment_status || "—",
    businessName,
  }));
}

function _invoiceHtml(d) {
  const { type, invoiceNo, date, partyLabel, partyName, storeLabel, storeName, rows,
    subtotal, discount, tax, shipping, grandTotal, notes, statusLabel, statusValue, businessName,
    tableHeaders } = d;
  const defaultHeaders = ["Item", "Qty", "Price", "Total"];
  const headers = tableHeaders || defaultHeaders;

  const fmt = (n) => Number(n).toLocaleString();

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${type} — ${invoiceNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #222; background: #fff; padding: 30px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
  .biz-name { font-size: 22px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.5px; }
  .type-badge { background: #4F8EF7; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-top: 6px; display: inline-block; }
  .inv-meta { text-align: right; }
  .inv-no { font-size: 18px; font-weight: 700; color: #4F8EF7; font-family: monospace; }
  .inv-date { font-size: 11.5px; color: #666; margin-top: 3px; }
  .divider { border: none; border-top: 1.5px solid #e5e7eb; margin: 0 0 20px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .info-box { background: #f8f9fc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
  .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 4px; }
  .info-value { font-size: 13.5px; font-weight: 600; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th { background: #1a1a2e; color: #fff; padding: 9px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  thead th:not(:first-child) { text-align: right; }
  tbody td { padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12.5px; color: #374151; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td small { font-size: 11px; color: #9ca3af; }
  .totals { margin-left: auto; width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12.5px; color: #6b7280; }
  .totals-row.grand { padding-top: 10px; margin-top: 6px; border-top: 2px solid #1a1a2e; font-size: 16px; font-weight: 700; color: #1a1a2e; }
  .totals-row.grand .val { color: #22c87a; }
  .totals-row .val { font-weight: 600; color: #374151; }
  .status-chip { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    background: #d1fae5; color: #065f46; }
  .notes-box { margin-top: 20px; padding: 10px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 12px; color: #78350f; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 14px; }
  @media print {
    body { padding: 0; }
    @page { margin: 1.5cm; }
  }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="biz-name">${businessName}</div>
    <div class="type-badge">${type}</div>
  </div>
  <div class="inv-meta">
    <div class="inv-no">${invoiceNo}</div>
    <div class="inv-date">${date}</div>
    <div style="margin-top:6px"><span class="status-chip">${statusValue}</span></div>
  </div>
</div>
<hr class="divider">
<div class="info-grid">
  <div class="info-box">
    <div class="info-label">${partyLabel}</div>
    <div class="info-value">${partyName}</div>
  </div>
  <div class="info-box">
    <div class="info-label">${storeLabel}</div>
    <div class="info-value">${storeName}</div>
  </div>
</div>
<table>
  <thead>
    <tr>
      ${headers.map((h, i) => `<th${i === 0 ? ' style="text-align:left"' : ""}>${h}</th>`).join("")}
    </tr>
  </thead>
  <tbody>
    ${rows || `<tr><td colspan="${headers.length}" style="text-align:center;color:#9ca3af">No items</td></tr>`}
  </tbody>
</table>
<div class="totals">
  <div class="totals-row"><span>Subtotal</span><span class="val">${fmt(subtotal)}</span></div>
  ${discount > 0 ? `<div class="totals-row"><span>Discount</span><span class="val" style="color:#ef4444">-${fmt(discount)}</span></div>` : ""}
  ${tax > 0 ? `<div class="totals-row"><span>Tax</span><span class="val">${fmt(tax)}</span></div>` : ""}
  ${shipping > 0 ? `<div class="totals-row"><span>Shipping</span><span class="val">${fmt(shipping)}</span></div>` : ""}
  <div class="totals-row grand"><span>Grand Total</span><span class="val">${fmt(grandTotal)}</span></div>
</div>
${notes ? `<div class="notes-box"><strong>Notes:</strong> ${notes}</div>` : ""}
<div class="footer">Thank you for your business — ${businessName}</div>
</body>
</html>`;
}

function _doPrint(html) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 350);
}
