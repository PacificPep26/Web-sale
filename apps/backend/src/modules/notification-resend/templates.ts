export type EmailTemplate<T> = (data: T) => { subject: string; html: string };

const money = (amount: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    (amount ?? 0) / 100
  );

const shell = (title: string, body: string) => `
<!doctype html><html><body style="margin:0;background:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4">
      <tr><td style="padding:28px 32px 8px"><h1 style="margin:0;font-size:18px">${title}</h1></td></tr>
      <tr><td style="padding:8px 32px 32px;font-size:14px;line-height:1.6">${body}</td></tr>
    </table>
    <p style="color:#78716c;font-size:12px;margin-top:16px">Web Product Project</p>
  </td></tr></table>
</body></html>`;

const itemsTable = (items: Array<{ title?: string; quantity?: number; unit_price?: number }> = []) => `
<table role="presentation" width="100%" style="border-collapse:collapse;margin:12px 0">
  ${items
    .map(
      (i) => `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #f0efee">${i.title ?? "Item"} × ${i.quantity ?? 1}</td>
        <td align="right" style="padding:6px 0;border-bottom:1px solid #f0efee">${money(i.unit_price ?? 0)}</td>
      </tr>`
    )
    .join("")}
</table>`;

export const orderPlacedEmail: EmailTemplate<{
  display_id?: number | string;
  email?: string;
  currency_code?: string;
  total?: number;
  items?: Array<{ title?: string; quantity?: number; unit_price?: number }>;
}> = (d) =>
  ({
    subject: `Order #${d.display_id ?? ""} confirmed`,
    html: shell(
      `Thanks for your order!`,
      `<p>We've received order <strong>#${d.display_id ?? ""}</strong> and are getting it ready.</p>
       ${itemsTable(d.items)}
       <p style="font-size:15px"><strong>Total: ${money(d.total ?? 0, d.currency_code)}</strong></p>
       <p>You'll get another email with tracking as soon as it ships. Most orders arrive in 2–14 days depending on the item.</p>`
    ),
  });

export const shipmentCreatedEmail: EmailTemplate<{
  display_id?: number | string;
  tracking_numbers?: string[];
  tracking_links?: Array<{ url?: string; tracking_number?: string }>;
}> = (d) => {
  const links = (d.tracking_links ?? []).length
    ? (d.tracking_links ?? [])
        .map(
          (t) =>
            `<li><a href="${t.url ?? "#"}" style="color:#2563eb">${
              t.tracking_number ?? t.url ?? "Track"
            }</a></li>`
        )
        .join("")
    : (d.tracking_numbers ?? []).map((n) => `<li>${n}</li>`).join("");
  return {
    subject: `Order #${d.display_id ?? ""} has shipped`,
    html: shell(
      `Your order is on the way`,
      `<p>Order <strong>#${d.display_id ?? ""}</strong> has shipped.</p>
       <ul>${links || "<li>Tracking will update shortly.</li>"}</ul>`
    ),
  };
};

export const orderCanceledEmail: EmailTemplate<{
  display_id?: number | string;
  refund_amount?: number;
  currency_code?: string;
}> = (d) => ({
  subject: `Order #${d.display_id ?? ""} canceled & refunded`,
  html: shell(
    `Your order was canceled`,
    `<p>Order <strong>#${d.display_id ?? ""}</strong> has been canceled${
      d.refund_amount
        ? ` and <strong>${money(d.refund_amount, d.currency_code)}</strong> refunded to your original payment method`
        : ""
    }.</p>
     <p>Refunds usually take 5–10 business days to appear.</p>`
  ),
});
