import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { config as loadEnv } from "dotenv";
import { Resend } from "resend";

// Load .env from the backend root (one level up from utils/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, "../.env") });

// ==================== RESEND (ONLY ENV DEPENDENCY) ====================
const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== BRAND CONFIG (HARDCODED) ====================
const BRAND_NAME = "Titan Blockchain Capital";
const WEBSITE_URL = "https://titanblockchaincapital.com";
const FRONTEND_URL = "https://titanblockchaincapital.com";
const SUPPORT_EMAIL = "support@titanblockchaincapital.com";

const FROM_EMAIL =
  "Titan Blockchain Capital <notifications@titanblockchaincapital.com>";

const LOGO_URL = "https://titanblockchaincapital.com/images/logo.png";

const RESUME_PATH = "/register.html";

// ==================== HELPERS ====================
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildRefId = () =>
  `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

const buildResumeUrl = (email) => {
  const url = new URL(RESUME_PATH, FRONTEND_URL);
  url.searchParams.set("resume", "1");
  if (email) url.searchParams.set("email", email);
  return url.toString();
};

const buildShell = ({ title, eyebrow, heading, intro, bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#eef2f7;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-collapse:collapse;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.12);">
            <tr>
              <td align="center" style="padding:40px 24px;background:linear-gradient(135deg,#060913 0%,#10172a 60%,#151f36 100%);">
                <img
                  src="${escapeHtml(LOGO_URL)}"
                  alt="${escapeHtml(BRAND_NAME)}"
                  width="56"
                  height="56"
                  style="display:block;margin:0 auto 14px auto;width:56px;height:56px;object-fit:contain;border:0;"
                />
                <div style="font-family:Manrope,Arial,sans-serif;font-size:13px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#e4b84f;margin-bottom:12px;">
                  ${escapeHtml(eyebrow)}
                </div>
                <div style="font-family:Manrope,Arial,sans-serif;font-size:32px;line-height:1.2;font-weight:800;color:#ffffff;margin:0 0 12px 0;">
                  ${escapeHtml(heading)}
                </div>
                <div style="max-width:440px;margin:0 auto;font-size:17px;line-height:1.7;color:rgba(255,255,255,0.85);">
                  ${escapeHtml(intro)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 26px 30px 26px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                <div style="font-size:13px;line-height:1.8;color:#64748b;">
                  © ${new Date().getFullYear()} ${escapeHtml(BRAND_NAME)}. All rights reserved.
                </div>
                <div style="font-size:13px;line-height:1.8;color:#64748b;">
                  Institutional-Grade Digital Asset Management
                </div>
                <div style="font-size:13px;line-height:1.8;color:#64748b;">
                  Need help?
                  <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#0f172a;text-decoration:none;font-weight:700;">
                    ${escapeHtml(SUPPORT_EMAIL)}
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

const buildBullet = (items = []) => `
  <div style="margin:20px 0 24px 0;">
    ${items
      .map(
        (item) => `
        <div style="font-size:17px;line-height:1.75;color:#334155;margin-bottom:14px;">
          <span style="color:#e4b84f;font-weight:800;margin-right:10px;">✔</span>
          ${escapeHtml(item)}
        </div>
      `
      )
      .join("")}
  </div>
`;

const buildButton = (label, url) => `
  <div style="text-align:center;margin:28px 0;">
    <a
      href="${escapeHtml(url)}"
      style="display:inline-block;background:linear-gradient(135deg,#f6dea0 0%,#e4b84f 48%,#b47a15 100%);color:#0b0f19;text-decoration:none;font-weight:800;padding:16px 30px;border-radius:14px;font-size:17px;"
    >
      ${escapeHtml(label)}
    </a>
  </div>
`;

const sendBrandedEmail = async ({ from, to, subject, html, text, mailer }) => {
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
    headers: {
      "X-Priority": "1",
      "X-Mailer": mailer || "Titan Notification System",
      "X-Entity-Ref-ID": buildRefId(),
    },
  });

  if (error) {
    throw new Error(error.message || "Unable to send email");
  }

  return { success: true, messageId: data?.id || null };
};

// ==================== MAIN SEND FUNCTION ====================
export async function sendAbandonedRegistrationEmail({
  to,
  fullName = "",
  resumeUrl,
} = {}) {
  if (!to) {
    throw new Error("Recipient email is required.");
  }

  const finalResumeUrl = resumeUrl || buildResumeUrl(to);
  const subject =
    "Action Required: Complete Your Titan Blockchain Capital Registration";

  const bodyHtml = `
    <div style="font-size:18px;line-height:1.7;color:#334155;margin-bottom:20px;">
      Dear <strong style="color:#0f172a;">${escapeHtml(fullName || "Valued Client")}</strong>,
    </div>

    <div style="font-size:17px;line-height:1.75;color:#475569;margin-bottom:20px;">
      Your registration with <strong>${escapeHtml(BRAND_NAME)}</strong> was paused at the email verification stage and remains incomplete. It will need to be started again, which takes only a few minutes.
    </div>

    <div style="font-size:17px;line-height:1.75;color:#475569;margin-bottom:20px;">
      Meanwhile, registered clients continue to receive live trading signals at <strong>over 80% signal accuracy</strong>, execute positions, monitor results in real time, and earn referral rewards. None of this is available to an incomplete registration.
    </div>

    <div style="font-size:17px;line-height:1.75;color:#0f172a;font-weight:700;margin-bottom:6px;">
      What you are currently missing:
    </div>

    ${buildBullet([
      "Live trading signals at over 80% signal accuracy",
      "Real-time trade results and balance updates",
      "Deposit, withdrawal, and referral access",
      "The ability to make profits and withdraw profit anytime, anyday",
      "A fully verified and secure account",
    ])}

    <div style="font-size:17px;line-height:1.75;color:#475569;margin-bottom:20px;">
      Until your registration is complete, none of the above can be accessed.
    </div>

    ${buildButton("Complete Registration", finalResumeUrl)}

    <div style="font-size:16px;line-height:1.7;color:#64748b;">
      Need assistance? Contact
      <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#0f172a;font-weight:700;text-decoration:none;">
        ${escapeHtml(SUPPORT_EMAIL)}
      </a>.
    </div>

  `;

  const html = buildShell({
    title: subject,
    eyebrow: "Registration Reminder",
    heading: "Your registration is incomplete",
    intro:
      "Your application was paused at the verification stage. Registered clients continue to access the platform without you.",
    bodyHtml,
  });

  const text = `
${BRAND_NAME}

Dear ${fullName || "Valued Client"},

Your registration with ${BRAND_NAME} was paused at the email verification stage and remains incomplete. It will need to be started again, which takes only a few minutes.

Meanwhile, registered clients continue to receive live trading signals at over 80% signal accuracy, execute positions, monitor results in real time, and earn referral rewards. None of this is available to an incomplete registration.

What you are currently missing:
- Live trading signals at over 80% signal accuracy
- Real-time trade results and balance updates
- Deposit, withdrawal, and referral access
- The ability to make profits and withdraw profit anytime, anyday
- A fully verified and secure account

Until your registration is complete, none of the above can be accessed.

Complete your registration here:
${finalResumeUrl}

Need assistance? Contact ${SUPPORT_EMAIL}.

${BRAND_NAME}
  `.trim();

  return sendBrandedEmail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
    mailer: "Titan Registration Recovery System",
  });
}

// ==================== CLI RUNNER ====================
const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const [, , to, ...nameParts] = process.argv;
  const fullName = nameParts.join(" ").trim();

  if (!to) {
    console.error(
      "Usage: node utils/abandonedRegistration.js <email> [full name]"
    );
    process.exitCode = 1;
  } else {
    sendAbandonedRegistrationEmail({ to, fullName })
      .then((result) => {
        console.log("✅ Email sent successfully:", result);
        process.exitCode = 0;
      })
      .catch((error) => {
        console.error("❌ Failed to send email:", error.message);
        process.exitCode = 1;
      });
  }
}

export default sendAbandonedRegistrationEmail;