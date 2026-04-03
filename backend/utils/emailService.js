import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== BRAND CONFIG ====================
const BRAND_NAME = "Titan Blockchain Capital";
const WEBSITE_URL =
  process.env.WEBSITE_URL || process.env.FRONTEND_URL || "https://titanblockchaincapital.com";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://titanblockchaincapital.com";
const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || "support@titanblockchaincapital.com";
const VERIFICATION_EMAIL =
  process.env.VERIFICATION_EMAIL || "verification@titanblockchaincapital.com";

const FROM_VERIFY_EMAIL =
  process.env.RESEND_FROM_VERIFY ||
  `Titan Blockchain Capital <verify@titanblockchaincapital.com>`;

const FROM_NOTIFICATION_EMAIL =
  process.env.RESEND_FROM_NOTIFICATIONS ||
  `Titan Blockchain Capital <notifications@titanblockchaincapital.com>`;

const FROM_DEPOSIT_EMAIL =
  process.env.RESEND_FROM_DEPOSIT ||
  `Titan Blockchain Capital <deposits@titanblockchaincapital.com>`;

const FROM_WITHDRAWAL_EMAIL =
  process.env.RESEND_FROM_WITHDRAWAL ||
  `Titan Blockchain Capital <withdrawals@titanblockchaincapital.com>`;

const FROM_TRADING_EMAIL =
  process.env.RESEND_FROM_TRADING ||
  `Titan Blockchain Capital <trading@titanblockchaincapital.com>`;

const LOGO_URL =
  process.env.BRAND_LOGO_URL || `${WEBSITE_URL}/images/logo.png`;

// ==================== HELPERS ====================
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatMoney = (amount = 0) =>
  Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const buildRefId = () =>
  `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

const buildShell = ({
  title,
  eyebrow,
  heading,
  intro,
  bodyHtml,
  footerNote = "Institutional-Grade Digital Asset Management",
}) => `
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
                    ${escapeHtml(footerNote)}
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

const buildInfoCard = (title, rows = []) => `
  <div
    style="
      background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);
      border:1px solid #e2e8f0;
      border-radius:16px;
      padding:18px;
      margin:22px 0;
    "
  >
    <div style="font-size:12px;line-height:1.8;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;font-weight:800;margin-bottom:10px;">
      ${escapeHtml(title)}
    </div>
    <div style="font-size:14px;line-height:1.9;color:#334155;">
      ${rows
        .map(
          (row) =>
            `<div style="${row.breakWord ? "word-break:break-word;" : ""}"><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</div>`
        )
        .join("")}
    </div>
  </div>
`;

const buildNotice = ({
  color = "gold",
  title,
  text,
}) => {
  const schemes = {
    gold: {
      border: "#e4b84f",
      bg: "#fff8e7",
      text: "#7c5a10",
    },
    green: {
      border: "#22c55e",
      bg: "#f0fdf4",
      text: "#166534",
    },
    red: {
      border: "#ef4444",
      bg: "#fef2f2",
      text: "#991b1b",
    },
    blue: {
      border: "#4b7cff",
      bg: "#eff6ff",
      text: "#1d4ed8",
    },
  };

  const scheme = schemes[color] || schemes.gold;

  return `
    <div
      style="
        margin:22px 0;
        padding:18px;
        border-left:4px solid ${scheme.border};
        background:${scheme.bg};
        border-radius:14px;
      "
    >
      <div style="font-size:14px;line-height:1.8;color:${scheme.text};">
        ${title ? `<strong>${escapeHtml(title)}</strong><br />` : ""}
        ${escapeHtml(text)}
      </div>
    </div>
  `;
};

const buildButton = (label, url) => `
  <div style="text-align:center;margin:24px 0;">
    <a
      href="${escapeHtml(url)}"
      style="display:inline-block;background:linear-gradient(135deg,#f6dea0 0%,#e4b84f 48%,#b47a15 100%);color:#0b0f19;text-decoration:none;font-weight:800;padding:14px 24px;border-radius:14px;"
    >
      ${escapeHtml(label)}
    </a>
  </div>
`;

const sendBrandedEmail = async ({
  from,
  to,
  subject,
  html,
  text,
  mailer = "Titan Notification System",
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
      headers: {
        "X-Priority": "1",
        "X-Mailer": mailer,
        "X-Entity-Ref-ID": buildRefId(),
      },
    });

    if (error) {
      throw new Error(error.message || "Unable to send email");
    }

    return {
      success: true,
      messageId: data?.id || null,
    };
  } catch (error) {
    console.error(`❌ ${mailer} failed:`, error);
    return {
      success: false,
      error: error.message || "Unable to send email",
    };
  }
};

// ==================== OTP HELPERS ====================
const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

const getOTPExpiry = () => new Date(Date.now() + 15 * 60 * 1000);

// ==================== OTP EMAIL ====================
const sendEmailOTP = async (email, otp, fullName = "", type = "verification") => {
  const templates = {
    verification: {
      subject: "Verify Your Titan Blockchain Capital Account",
      eyebrow: "Secure Verification",
      heading: "Complete your account verification",
      intro:
        "Use the one-time code below to confirm your email address and continue your secure onboarding.",
    },
    resend: {
      subject: "Your New Titan Verification Code",
      eyebrow: "Verification Code Refresh",
      heading: "Here is your new verification code",
      intro:
        "A fresh one-time code has been issued for your account. Use it below to continue your registration securely.",
    },
  };

  const template = templates[type] || templates.verification;

  const bodyHtml = `
    <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
      Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
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
              ${escapeHtml(otp).split("").join(" ")}
            </div>
          </div>

          <div style="margin-top:14px;font-size:14px;line-height:1.7;color:#c97a1a;font-weight:700;">
            Expires in 15 minutes
          </div>
        </td>
      </tr>
    </table>

    ${buildNotice({
      color: "gold",
      title: "Security Notice:",
      text: "Never share this code with anyone. Titan Blockchain Capital will never ask for your verification code by phone, email, or chat.",
    })}

    <div style="font-size:14px;line-height:1.8;color:#64748b;">
      If you did not request this verification, you can safely ignore this email or contact support.
    </div>
  `;

  const html = buildShell({
    title: template.subject,
    eyebrow: template.eyebrow,
    heading: template.heading,
    intro: template.intro,
    bodyHtml,
  });

  const text = `
${BRAND_NAME}

Hello ${fullName || "there"},

Your verification code is: ${otp}

This code expires in 15 minutes.

Need help? Contact ${SUPPORT_EMAIL}
${WEBSITE_URL}
  `.trim();

  return sendBrandedEmail({
    from: FROM_VERIFY_EMAIL,
    to: email,
    subject: template.subject,
    html,
    text,
    mailer: "Titan Verification System",
  });
};

// ==================== SMS OTP ====================
const sendSMSOTP = async (phoneNumber, otp, countryCode = "+1") => {
  try {
    let twilioClient;

    try {
      const twilio = await import("twilio");
      twilioClient = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } catch (error) {
      console.warn("⚠️ Twilio not configured. SMS delivery simulated only.");
      console.log(`📱 SMS OTP -> ${countryCode}${phoneNumber}: ${otp}`);
      return {
        success: true,
        simulated: true,
        message: "SMS delivery simulated",
      };
    }

    const sanitizedPhone = String(phoneNumber).replace(/\D/g, "");
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
    console.error("❌ SMS delivery failed:", error);
    throw new Error("Unable to send SMS verification. Please try again.");
  }
};

// ==================== REGISTRATION PAYMENT EMAIL ====================
const sendPaymentEmail = async ({
  to,
  fullName = "",
  type,
  amount,
  dashboardUrl,
  reason,
}) => {
  const safeAmount = formatMoney(amount);
  const safeDashboardUrl = dashboardUrl || `${FRONTEND_URL}/dashboard.html`;

  const templates = {
    submitted: {
      subject: "Payment Receipt Received – Titan Blockchain Capital",
      eyebrow: "Payment Update",
      heading: "Your payment receipt has been received",
      intro:
        "Your registration payment proof has been submitted successfully and is now awaiting review.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          We have received your registration payment receipt for <strong>$${escapeHtml(safeAmount)}</strong>.
        </div>
        ${buildNotice({
          color: "gold",
          text: "Your payment is currently under review by our team. You will be notified once the review is complete.",
        })}
      `,
      text: `We have received your registration payment receipt for $${safeAmount}. Your payment is currently under review.`,
    },

    approved: {
      subject: "Payment Approved – Welcome to Titan Blockchain Capital",
      eyebrow: "Payment Approved",
      heading: "Your registration payment has been approved",
      intro:
        "Your account has successfully moved forward in the onboarding process.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          Great news. Your registration payment of <strong>$${escapeHtml(safeAmount)}</strong> has been <strong>approved</strong>.
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:24px;">
          You can now proceed to your dashboard and continue using your account.
        </div>
        ${buildButton("Go to Dashboard", safeDashboardUrl)}
      `,
      text: `Your registration payment of $${safeAmount} has been approved. Dashboard: ${safeDashboardUrl}`,
    },

    rejected: {
      subject: "Payment Rejected – Titan Blockchain Capital",
      eyebrow: "Payment Update",
      heading: "Your payment could not be approved",
      intro:
        "We were unable to verify the submitted payment details at this time.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          Unfortunately, your registration payment of <strong>$${escapeHtml(safeAmount)}</strong> could not be verified.
        </div>
        ${buildNotice({
          color: "red",
          title: "Reason:",
          text: reason || "Your payment could not be verified.",
        })}
      `,
      text: `Your registration payment of $${safeAmount} could not be verified. Reason: ${reason || "Your payment could not be verified."}`,
    },
  };

  const template = templates[type];
  if (!template) throw new Error("Invalid payment email type");

  const html = buildShell({
    title: template.subject,
    eyebrow: template.eyebrow,
    heading: template.heading,
    intro: template.intro,
    bodyHtml: template.bodyHtml,
  });

  const text = `
${BRAND_NAME}

Hello ${fullName || "there"},

${template.text}

Need help? Contact ${SUPPORT_EMAIL}
  `.trim();

  return sendBrandedEmail({
    from: FROM_NOTIFICATION_EMAIL,
    to,
    subject: template.subject,
    html,
    text,
    mailer: "Titan Payment System",
  });
};

// ==================== DEPOSIT EMAIL ====================
const sendDepositEmail = async ({
  to,
  fullName = "",
  type,
  amount,
  transactionId,
  coinType,
  reason,
}) => {
  const safeAmount = formatMoney(amount);
  const safeDashboardUrl = `${FRONTEND_URL}/dashboard.html`;
  const safeTransactionId = transactionId || "N/A";
  const safeCoinType = coinType || "N/A";

  const templates = {
    submitted: {
      subject: "Deposit Receipt Received – Titan Blockchain Capital",
      eyebrow: "Deposit Update",
      heading: "Your deposit receipt has been received",
      intro:
        "Your deposit proof has been submitted successfully and is now awaiting review.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>

        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          We have received your deposit receipt for <strong>$${escapeHtml(safeAmount)}</strong> via <strong>${escapeHtml(safeCoinType)}</strong>.
        </div>

        ${buildInfoCard("Deposit Details", [
          { label: "Amount", value: `$${safeAmount}` },
          { label: "Asset", value: safeCoinType },
          { label: "Transaction ID", value: safeTransactionId, breakWord: true },
        ])}

        ${buildNotice({
          color: "gold",
          text: "Your deposit is currently under review by our team. You will receive another update once the review is completed.",
        })}
      `,
      text: `We have received your deposit receipt for $${safeAmount} via ${safeCoinType}. Transaction ID: ${safeTransactionId}. Your deposit is currently under review.`,
    },

    approved: {
      subject: "Deposit Approved – Titan Blockchain Capital",
      eyebrow: "Deposit Approved",
      heading: "Your deposit has been approved",
      intro:
        "Your deposit has been successfully reviewed and added to your account.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>

        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          Great news. Your deposit of <strong>$${escapeHtml(safeAmount)}</strong> via <strong>${escapeHtml(safeCoinType)}</strong> has been <strong>approved</strong>.
        </div>

        ${buildInfoCard("Deposit Details", [
          { label: "Amount", value: `$${safeAmount}` },
          { label: "Asset", value: safeCoinType },
          { label: "Transaction ID", value: safeTransactionId, breakWord: true },
        ])}

        ${buildNotice({
          color: "green",
          text: "The funds have now been added to your account balance and are available in your dashboard.",
        })}

        ${buildButton("Go to Dashboard", safeDashboardUrl)}
      `,
      text: `Your deposit of $${safeAmount} via ${safeCoinType} has been approved. Transaction ID: ${safeTransactionId}. Dashboard: ${safeDashboardUrl}`,
    },

    rejected: {
      subject: "Deposit Rejected – Titan Blockchain Capital",
      eyebrow: "Deposit Update",
      heading: "Your deposit could not be approved",
      intro:
        "We were unable to verify the submitted deposit details at this time.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>

        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          Unfortunately, your deposit of <strong>$${escapeHtml(safeAmount)}</strong> via <strong>${escapeHtml(safeCoinType)}</strong> could not be verified.
        </div>

        ${buildInfoCard("Deposit Details", [
          { label: "Amount", value: `$${safeAmount}` },
          { label: "Asset", value: safeCoinType },
          { label: "Transaction ID", value: safeTransactionId, breakWord: true },
        ])}

        ${buildNotice({
          color: "red",
          title: "Reason:",
          text: reason || "Your deposit could not be verified.",
        })}
      `,
      text: `Your deposit of $${safeAmount} via ${safeCoinType} could not be verified. Transaction ID: ${safeTransactionId}. Reason: ${reason || "Your deposit could not be verified."}`,
    },
  };

  const template = templates[type];
  if (!template) throw new Error("Invalid deposit email type");

  const html = buildShell({
    title: template.subject,
    eyebrow: template.eyebrow,
    heading: template.heading,
    intro: template.intro,
    bodyHtml: template.bodyHtml,
  });

  const text = `
${BRAND_NAME}

Hello ${fullName || "there"},

${template.text}

Need help? Contact ${SUPPORT_EMAIL}
  `.trim();

  return sendBrandedEmail({
    from: FROM_DEPOSIT_EMAIL,
    to,
    subject: template.subject,
    html,
    text,
    mailer: "Titan Deposit System",
  });
};

const sendWithdrawalEmail = async ({
  to,
  fullName = "",
  type,
  amount,
  coinType,
  walletAddress,
  network,
  reason,
}) => {
  const safeAmount =
    amount !== undefined && amount !== null ? Number(amount).toLocaleString() : "0";

  const walletLine = `${
    coinType || network || "Crypto"
  }${walletAddress ? ` • ${walletAddress}` : ""}`;

  const templates = {
    submitted: {
      subject: "Withdrawal Request Received – Titan Blockchain Capital",
      eyebrow: "Withdrawal Update",
      heading: "Your withdrawal request has been received",
      intro:
        "Your withdrawal request has been submitted successfully and is now awaiting admin review.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          We have received your withdrawal request for <strong>$${safeAmount}</strong>.
        </div>
        <div style="margin:22px 0;padding:18px;border-left:4px solid #e4b84f;background:#fff8e7;border-radius:14px;">
          <div style="font-size:14px;line-height:1.8;color:#7c5a10;">
            <strong>Wallet:</strong> ${escapeHtml(walletLine)}
          </div>
        </div>
        <div style="font-size:14px;line-height:1.8;color:#64748b;">
          Your request is currently <strong>pending review</strong>. You will receive another email once it has been approved or paid.
        </div>
      `,
      text: `We have received your withdrawal request for $${safeAmount}. Wallet: ${walletLine}. Your request is pending review.`,
    },

    approved: {
      subject: "Withdrawal Approved – Titan Blockchain Capital",
      eyebrow: "Withdrawal Approved",
      heading: "Your withdrawal has been approved",
      intro:
        "Your withdrawal request has been approved and is now queued for final payment processing.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          Your withdrawal request for <strong>$${safeAmount}</strong> has been <strong>approved</strong>.
        </div>
        <div style="margin:22px 0;padding:18px;border-left:4px solid #22c55e;background:#ecfdf5;border-radius:14px;">
          <div style="font-size:14px;line-height:1.8;color:#166534;">
            <strong>Wallet:</strong> ${escapeHtml(walletLine)}
          </div>
        </div>
        <div style="font-size:14px;line-height:1.8;color:#64748b;">
          Your withdrawal has not yet been paid. You will receive a final confirmation email once payment has been completed.
        </div>
      `,
      text: `Your withdrawal request for $${safeAmount} has been approved. Wallet: ${walletLine}. Final payment is pending.`,
    },

    paid: {
      subject: "Withdrawal Paid – Titan Blockchain Capital",
      eyebrow: "Withdrawal Completed",
      heading: "Your withdrawal has been paid",
      intro:
        "Your withdrawal has been fully processed and paid by our team.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          Your withdrawal of <strong>$${safeAmount}</strong> has been <strong>paid</strong>.
        </div>
        <div style="margin:22px 0;padding:18px;border-left:4px solid #22c55e;background:#ecfdf5;border-radius:14px;">
          <div style="font-size:14px;line-height:1.8;color:#166534;">
            <strong>Wallet:</strong> ${escapeHtml(walletLine)}
          </div>
        </div>
        <div style="font-size:14px;line-height:1.8;color:#64748b;">
          If you do not see the funds immediately, please allow for normal blockchain/network confirmation time.
        </div>
      `,
      text: `Your withdrawal of $${safeAmount} has been paid. Wallet: ${walletLine}.`,
    },

    rejected: {
      subject: "Withdrawal Rejected – Titan Blockchain Capital",
      eyebrow: "Withdrawal Update",
      heading: "Your withdrawal request was not approved",
      intro:
        "We were unable to process your withdrawal request at this time.",
      bodyHtml: `
        <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
          Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
        </div>
        <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
          Your withdrawal request for <strong>$${safeAmount}</strong> has been rejected.
        </div>
        <div style="margin:22px 0;padding:18px;border-left:4px solid #ef4444;background:#fef2f2;border-radius:14px;">
          <div style="font-size:14px;line-height:1.8;color:#991b1b;">
            <strong>Reason:</strong> ${escapeHtml(reason || "Your withdrawal request could not be processed.")}
          </div>
        </div>
        <div style="font-size:14px;line-height:1.8;color:#64748b;">
          Please review the issue and submit a new request if necessary.
        </div>
      `,
      text: `Your withdrawal request for $${safeAmount} has been rejected. Reason: ${reason || "Your withdrawal request could not be processed."}`,
    },
  };

  const template = templates[type];
  if (!template) throw new Error("Invalid withdrawal email type");

  const html = buildShell({
    title: template.subject,
    eyebrow: template.eyebrow,
    heading: template.heading,
    intro: template.intro,
    bodyHtml: template.bodyHtml,
  });

  const text = `
${BRAND_NAME}

Hello ${fullName || "there"},

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
        "X-Priority": "1",
        "X-Mailer": "Titan Withdrawal System",
        "X-Entity-Ref-ID": `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`,
      },
    });

    if (error) {
      throw new Error(error.message || "Unable to send withdrawal email");
    }

    return {
      success: true,
      messageId: data?.id || null,
    };
  } catch (error) {
    console.error("❌ Withdrawal email delivery failed:", error);
    return {
      success: false,
      error: error.message || "Unable to send withdrawal email",
    };
  }
};

// ==================== TRADING SIGNAL EMAIL ====================
const sendTradingSignalEmail = async ({
  to,
  fullName = "",
  type,
  signal,
  profitAmount,
  lossAmount,
  newBalance,
}) => {
  const safeDashboardUrl = `${FRONTEND_URL}/dashboard.html`;

  const isProfit = type === "profit";
  const subject = isProfit
    ? "Profit Alert – Titan Blockchain Capital"
    : "Trade Update – Titan Blockchain Capital";

  const heading = isProfit ? "Your trade closed in profit" : "Your trade closed in loss";
  const intro = isProfit
    ? "Your trading result has been processed and your account has been updated."
    : "Your trading result has been processed and your account has been updated.";

  const bodyHtml = `
    <div style="font-size:16px;line-height:1.8;color:#334155;margin-bottom:18px;">
      Hello <strong style="color:#0f172a;">${escapeHtml(fullName || "there")}</strong>,
    </div>

    <div style="font-size:15px;line-height:1.8;color:#475569;margin-bottom:20px;">
      Your trade on <strong>${escapeHtml(signal?.symbol || "N/A")}</strong> has closed with a
      <strong style="color:${isProfit ? "#22c55e" : "#ef4444"};">${isProfit ? "PROFIT" : "LOSS"}</strong>.
    </div>

    ${buildInfoCard("Trade Details", [
      { label: "Symbol", value: signal?.symbol || "N/A" },
      { label: "Entry Point", value: String(signal?.entryPoint ?? "N/A") },
      { label: "Take Profit", value: String(signal?.takeProfit ?? "N/A") },
      { label: "Stop Loss", value: String(signal?.stopLoss ?? "N/A") },
    ])}

    ${buildNotice({
      color: isProfit ? "green" : "red",
      title: isProfit ? "Profit Earned:" : "Loss Incurred:",
      text: `${isProfit ? "+" : "-"}$${formatMoney(isProfit ? profitAmount : lossAmount)}`,
    })}

    ${buildInfoCard("Balance Update", [
      { label: "New Balance", value: `$${formatMoney(newBalance)}` },
    ])}

    ${buildButton("View Dashboard", safeDashboardUrl)}
  `;

  const html = buildShell({
    title: subject,
    eyebrow: "Trading Update",
    heading,
    intro,
    bodyHtml,
  });

  const text = `
${BRAND_NAME}

Hello ${fullName || "there"},

Your trade on ${signal?.symbol || "N/A"} closed with a ${isProfit ? "profit" : "loss"}.
New balance: $${formatMoney(newBalance)}

Dashboard: ${safeDashboardUrl}
  `.trim();

  return sendBrandedEmail({
    from: FROM_TRADING_EMAIL,
    to,
    subject,
    html,
    text,
    mailer: "Titan Trading System",
  });
};

export {
  generateOTP,
  getOTPExpiry,
  sendEmailOTP,
  sendSMSOTP,
  sendPaymentEmail,
  sendDepositEmail,
  sendWithdrawalEmail,
  sendTradingSignalEmail,
};