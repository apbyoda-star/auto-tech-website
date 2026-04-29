const { Resend } = require('resend');

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEmail({ fname, lname, email, phone, service, message }) {
  const name = [fname, lname].filter(Boolean).map(esc).join(' ') || 'Customer';
  const safeEmail   = esc(email);
  const safePhone   = esc(phone);
  const safeService = esc(service);
  const safeMsg     = esc(message).replace(/\n/g, '<br>');
  const submitted   = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:#1a1f2e;padding:28px 36px;border-radius:12px 12px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:1px;">AUTO TECH SERVICES</div>
            <div style="font-size:11px;color:#45A7E8;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">New Website Inquiry</div>
          </td>
          <td align="right" style="vertical-align:top;">
            <div style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.7;">autotechmo.com</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.45);">573-378-7300</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Blue accent bar -->
  <tr><td style="background:#45A7E8;height:4px;line-height:4px;font-size:0;">&nbsp;</td></tr>

  <!-- Customer + Contact boxes -->
  <tr>
    <td style="background:#ffffff;padding:28px 36px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="48%" style="background:#f5f8fb;border-radius:8px;padding:18px 20px;vertical-align:top;">
            <div style="font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#45A7E8;margin-bottom:8px;">Customer</div>
            <div style="font-size:20px;font-weight:bold;color:#1a1f2e;line-height:1.2;">${name}</div>
          </td>
          <td width="4%" style="font-size:0;">&nbsp;</td>
          <td width="48%" style="background:#f5f8fb;border-radius:8px;padding:18px 20px;vertical-align:top;">
            <div style="font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#45A7E8;margin-bottom:8px;">Contact</div>
            ${safeEmail ? `<div style="font-size:14px;color:#1a1f2e;margin-bottom:5px;">&#9993;&nbsp; ${safeEmail}</div>` : ''}
            ${safePhone ? `<div style="font-size:14px;color:#1a1f2e;">&#9990;&nbsp; ${safePhone}</div>` : ''}
            ${!safeEmail && !safePhone ? '<div style="font-size:13px;color:#888;">No contact info provided</div>' : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${safeService ? `
  <!-- Service Requested -->
  <tr>
    <td style="background:#ffffff;padding:20px 36px 0;">
      <div style="font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#45A7E8;margin-bottom:10px;">Service Requested</div>
      <div style="background:#e8f4fd;border-left:4px solid #45A7E8;padding:14px 18px;border-radius:0 8px 8px 0;font-size:16px;font-weight:bold;color:#1a1f2e;">${safeService}</div>
    </td>
  </tr>` : ''}

  ${safeMsg ? `
  <!-- Message -->
  <tr>
    <td style="background:#ffffff;padding:20px 36px 0;">
      <div style="font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#45A7E8;margin-bottom:10px;">Message</div>
      <div style="background:#f5f8fb;border-radius:8px;padding:18px 20px;color:#333333;font-size:15px;line-height:1.7;">${safeMsg}</div>
    </td>
  </tr>` : ''}

  <!-- Reply button -->
  <tr>
    <td style="background:#ffffff;padding:24px 36px 32px;">
      ${safeEmail
        ? `<a href="mailto:${safeEmail}" style="display:inline-block;background:#45A7E8;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:999px;font-weight:bold;font-size:14px;">Reply to ${esc(fname) || name}</a>`
        : ''
      }
      ${safePhone
        ? `<a href="tel:${safePhone.replace(/\D/g,'')}" style="display:inline-block;margin-left:10px;background:transparent;color:#45A7E8;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:bold;font-size:14px;border:1.5px solid #45A7E8;">Call ${esc(fname) || 'Customer'}</a>`
        : ''
      }
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#1a1f2e;padding:18px 36px;border-radius:0 0 12px 12px;">
      <div style="font-size:11px;color:rgba(255,255,255,0.35);text-align:center;line-height:1.6;">
        Auto Tech Services &middot; 13431 State Route 52, Versailles MO 65084 &middot; 573-378-7300<br>
        Submitted ${submitted}
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { fname, lname, email, phone, service, message } = req.body;
    const name = [fname, lname].filter(Boolean).join(' ') || 'Customer';
    const subject = service
      ? `New Inquiry: ${name} — ${service}`
      : `New Inquiry: ${name}`;

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from:     process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to:       process.env.SHOP_EMAIL || 'Service@autotechmo.com',
      reply_to: email || undefined,
      subject,
      html:     buildEmail({ fname, lname, email, phone, service, message }),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-contact error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
};
