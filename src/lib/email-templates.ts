export function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#09090b;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">The Vault</h1>
      <p style="color:#71717a;font-size:14px;margin:4px 0 0;">Custom designer trading community</p>
    </div>
    <div style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:24px;">
      ${content}
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#52525b;font-size:12px;margin:0;">You received this email because you have an account on The Vault.</p>
      <p style="color:#52525b;font-size:12px;margin:4px 0 0;">To manage your notification preferences, visit your account settings.</p>
    </div>
  </div>
</body>
</html>`;
}

export function emailButton(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background-color:#ffffff;color:#000000;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;">${text}</a>`;
}

export function emailDivider(): string {
  return `<hr style="border:none;border-top:1px solid #27272a;margin:16px 0;">`;
}

export function emailDetailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 12px 4px 0;color:#a1a1aa;font-size:14px;white-space:nowrap;">${label}</td>
    <td style="padding:4px 0;color:#ffffff;font-size:14px;">${value}</td>
  </tr>`;
}

export function emailDetailsTable(rows: Array<{ label: string; value: string }>): string {
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;">
    ${rows.map((r) => emailDetailRow(r.label, r.value)).join("")}
  </table>`;
}
