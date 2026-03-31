import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND_NAME = 'Titan Blockchain Capital';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@titanblockchaincapital.com';
const FROM_VERIFY_EMAIL =
  process.env.RESEND_FROM_VERIFY || `Titan Blockchain Capital <verify@titanblockchaincapital.com>`;
const FROM_NOTIFICATION_EMAIL =
  process.env.RESEND_FROM_NOTIFICATIONS || `Titan Blockchain Capital <notifications@titanblockchaincapital.com>`;
const LOGO_URL =
  process.env.BRAND_LOGO_URL || 'https://titanblockchaincapital.com/images/logo.png';
const WEBSITE_URL =
  process.env.WEBSITE_URL || 'https://titanblockchaincapital.com';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const getOTPExpiry = () => {
  return new Date(Date.now() + 15 * 60 * 1000);
};

const buildShell = ({ title, eyebrow, heading, intro, bodyHtml, footerNote }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef2f7;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <div style="width:100%;background-color:#eef2f7;padding:24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:0 12px;">
            <table
              role="presentation"
              cellpadding="0"
              cellspacing="0"
              border="0"
              width="100%"
              style="max-width:600px;border-collapse:collapse;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.12);"
            >
              <tr>
                <td
                  align="center"
                  style="padding:36px 24px;background:linear-gradient(135deg,#060913 0%,#10172a 60%,#151f36 100%);"
                >
                  <div style="margin-bottom:14px;">
                    <img
                      src="${escapeHtml(LOGO_URL)}"
                      alt="${escapeHtml(BRAND_NAME)}"
                      width="56"
                      height="56"
                      style="display:block;margin:0 auto 12px auto;width:56px;height:56px;object-fit:contain;border:0;outline:none;text-decoration:none;"
                    />
                    <div style="font-family:Manrope,Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#e4b84f;">
                      ${escapeHtml(eyebrow)}
                    </div>
                    <div style="font-family:Manrope,Arial,sans-serif;font-size:22px;line-height:1.25;font-weight:800;color:#ffffff;margin-top:10px;">
                      ${escapeHtml(BRAND_NAME)}
                    </div>
                  </div>

                  <div style="font-family:Manrope,Arial,sans-serif;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;margin:0 0 10px 0;">
                    ${escapeHtml(heading)}
                  </div>

                  <div style="max-width:430px;margin:0 auto;font-size:15px;line-height:1.75;color:rgba(255,255,255,0.82);">
                    ${escapeHtml(intro)}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:32px 22px 28px 22px;">
                  ${bodyHtml}
                </td>
              </tr>

              <tr>
                <td style="padding:22px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                  <div style="font-size:12px;line-height:1.8;color:#64748b;">
                    © ${new Date().getFullYear()} ${escapeHtml(BRAND_NAME)}. All rights reserved.
                  </div>
                  <div style="font-size:12px;line-height:1.8;color:#64748b;">
                    ${escapeHtml(footerNote || 'Institutional-Grade Digital Asset Management')}
                  </div>
                  <div style="font-size:12px;line-height:1.8;color:#64748b;">
                    Need help?
                    <a
                      href="mailto:${escapeHtml(SUPPORT_EMAIL)}"
                      style="color:#0f172a;text-decoration:none;font-weight:700;"
                    >${escapeHtml(SUPPORT_EMAIL)}</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`;

const buildOtpBody = ({ fullName, otp }) => `
  <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
    Hello <strong style="color:#0f172a;">${escapeHtml(fullName || 'there')}</strong>,
  </div>

  <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:22px;">
    To continue your secure onboarding, please use the verification code below. This code is valid for <strong>15 minutes</strong>.
  </div>

  <table
    role="presentation"
    cellpadding="0"
    cellspacing="0"
    border="0"
    width="100%"
    style="border-collapse:collapse;margin:24px 0;"
  >
    <tr>
      <td
        align="center"
        style="padding:24px 16px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0;border-radius:20px;"
      >
        <div style="font-size:12px;line-height:1.7;letter-spacing:0.16em;text-transform:uppercase;color:#64748b;font-weight:800;margin-bottom:14px;">
          One-Time Verification Code
        </div>

        <div
          style="
            display:block;
            width:100%;
            max-width:320px;
            margin:0 auto;
            background:#0b0f19;
            border:1px solid #2b3342;
            border-radius:18px;
            padding:16px 10px;
            box-sizing:border-box;
          "
        >
          <div
            style="
              font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
              font-size:34px;
              line-height:1.2;
              font-weight:800;
              letter-spacing:0.22em;
              color:#ffffff;
              text-align:center;
              white-space:nowrap;
            "
          >
            ${escapeHtml(otp).split('').join(' ')}
          </div>
        </div>

        <div style="margin-top:14px;font-size:14px;line-height:1.7;color:#c97a1a;font-weight:700;">
          Expires in 15 minutes
        </div>
      </td>
    </tr>
  </table>

  <div
    style="
      margin:24px 0;
      padding:18px 18px;
      border-left:4px solid #e4b84f;
      background:#fff8e7;
      border-radius:14px;
    "
  >
    <div style="font-size:13px;line-height:1.9;color:#7c5a10;">
      <strong>Security Notice:</strong> Never share this code with anyone.
      ${escapeHtml(BRAND_NAME)} will never ask you for your verification code by phone, email, or chat.
    </div>
  </div>

  <div style="font-size:14px;line-height:1.8;color:#64748b;">
    If you did not request this verification, you can safely ignore this email or contact support.
  </div>
`;

const sendEmailOTP = async (email, otp, fullName = '', type = 'verification') => {
  const templates = {
    verification: {
      subject: 'Verify Your Titan Blockchain Capital Account',
      eyebrow: 'Secure Verification',
      heading: 'Complete your account verification',
      intro:
        'Use the one-time code below to confirm your email address and continue your secure onboarding.',
    },
    resend: {
      subject: 'Your New Titan Verification Code',
      eyebrow: 'Verification Code Refresh',
      heading: 'Here is your new verification code',
      intro:
        'A fresh one-time code has been issued for your account. Use it below to continue your registration securely.',
    },
  };

  const template = templates[type] || templates.verification;

  const html = buildShell({
    title: template.subject,
    eyebrow: template.eyebrow,
    heading: template.heading,
    intro: template.intro,
    bodyHtml: buildOtpBody({ fullName, otp }),
  });

  const text = `
${BRAND_NAME}

Hello ${fullName || 'there'},

Your verification code is: ${otp}

This code expires in 15 minutes.

Security Notice:
Never share this code with anyone.

Need help? Contact ${SUPPORT_EMAIL}

${WEBSITE_URL}
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_VERIFY_EMAIL,
      to: [email],
      subject: template.subject,
      html,
      text,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'Titan Verification System',
        'X-Entity-Ref-ID': `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
      },
    });

    if (error) {
      throw new Error(error.message || 'Unable to send verification email');
    }

    return {
      success: true,
      messageId: data?.id || null,
    };
  } catch (error) {
    console.error('❌ OTP email delivery failed:', error);
    throw new Error('Unable to send verification email. Please try again.');
  }
};

const sendSMSOTP = async (phoneNumber, otp, countryCode = '+1') => {
  try {
    let twilioClient;

    try {
      const twilio = await import('twilio');
      twilioClient = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } catch (error) {
      console.warn('⚠️ Twilio not configured. SMS delivery simulated only.');
      console.log(`📱 SMS OTP -> ${countryCode}${phoneNumber}: ${otp}`);
      return {
        success: true,
        simulated: true,
        message: 'SMS delivery simulated',
      };
    }

    const sanitizedPhone = String(phoneNumber).replace(/\D/g, '');
    const fullPhoneNumber = `${countryCode}${sanitizedPhone}`;

    const message = await twilioClient.messages.create({
      body: `${BRAND_NAME}\n\nYour verification code is: ${otp}\nValid for 15 minutes.\nNever share this code with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: fullPhoneNumber,
    });

    return {
      success: true,
      sid: message.sid,
    };
  } catch (error) {
    console.error('❌ SMS delivery failed:', error);
    throw new Error('Unable to send SMS verification. Please try again.');
  }
};

const sendPaymentEmail = async ({
  to,
  fullName = '',
  type,
  amount,
  dashboardUrl,
  reason,
}) => {
  const safeAmount =
    amount !== undefined && amount !== null ? Number(amount).toLocaleString() : '0';
  const safeDashboardUrl = dashboardUrl || `${WEBSITE_URL}/user-dashboard`;

  const templates = {
    submitted: {
      subject: 'Payment Receipt Received – Titan Blockchain Capital',
      eyebrow: 'Payment Update',
      heading: 'Your payment receipt has been received',
      intro:
        'Your registration payment proof has been submitted successfully and is now awaiting review.',
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || 'there')}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          We have received your registration payment receipt for <strong>$${safeAmount}</strong>.
        </div>
        <div style="margin:22px 0;padding:18px;border-left:4px solid #e4b84f;background:#fff8e7;border-radius:14px;">
          <div style="font-size:14px;line-height:1.8;color:#7c5a10;">
            Your payment is currently <strong>under review</strong> by our team. You will be notified once the review is complete.
          </div>
        </div>
      `,
      text: `We have received your registration payment receipt for $${safeAmount}. Your payment is currently under review.`,
    },
    approved: {
      subject: 'Payment Approved – Welcome to Titan Blockchain Capital',
      eyebrow: 'Payment Approved',
      heading: 'Your registration payment has been approved',
      intro:
        'Your account has successfully moved forward in the onboarding process.',
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || 'there')}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          Great news. Your registration payment of <strong>$${safeAmount}</strong> has been <strong>approved</strong>.
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:24px;">
          You can now proceed to your dashboard and continue using your account.
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a
            href="${escapeHtml(safeDashboardUrl)}"
            style="display:inline-block;background:linear-gradient(135deg,#f6dea0 0%,#e4b84f 48%,#b47a15 100%);color:#0b0f19;text-decoration:none;font-weight:800;padding:14px 24px;border-radius:14px;"
          >
            Go to Dashboard
          </a>
        </div>
      `,
      text: `Your registration payment of $${safeAmount} has been approved. Dashboard: ${safeDashboardUrl}`,
    },
    rejected: {
      subject: 'Payment Rejected – Titan Blockchain Capital',
      eyebrow: 'Payment Update',
      heading: 'Your payment could not be approved',
      intro:
        'We were unable to verify the submitted payment details at this time.',
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || 'there')}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          Unfortunately, your registration payment of <strong>$${safeAmount}</strong> could not be verified.
        </div>
        <div style="margin:22px 0;padding:18px;border-left:4px solid #ef4444;background:#fef2f2;border-radius:14px;">
          <div style="font-size:14px;line-height:1.8;color:#991b1b;">
            <strong>Reason:</strong> ${escapeHtml(reason || 'Your payment could not be verified.')}
          </div>
        </div>
      `,
      text: `Your registration payment of $${safeAmount} could not be verified. Reason: ${reason || 'Your payment could not be verified.'}`,
    },
  };

  const template = templates[type];
  if (!template) throw new Error('Invalid payment email type');

  const html = buildShell({
    title: template.subject,
    eyebrow: template.eyebrow,
    heading: template.heading,
    intro: template.intro,
    bodyHtml: template.bodyHtml,
  });

  const text = `
${BRAND_NAME}

Hello ${fullName || 'there'},

${template.text}

Need help? Contact ${SUPPORT_EMAIL}
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_NOTIFICATION_EMAIL,
      to: [to],
      subject: template.subject,
      html,
      text,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'Titan Payment System',
        'X-Entity-Ref-ID': `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
      },
    });

    if (error) {
      throw new Error(error.message || 'Unable to send payment email');
    }

    return {
      success: true,
      messageId: data?.id || null,
    };
  } catch (error) {
    console.error('❌ Payment email delivery failed:', error);
    return {
      success: false,
      error: error.message || 'Unable to send payment email',
    };
  }
};

export {
  generateOTP,
  getOTPExpiry,
  sendEmailOTP,
  sendSMSOTP,
  sendPaymentEmail,
};