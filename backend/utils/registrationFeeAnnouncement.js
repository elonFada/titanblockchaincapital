import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { config as loadEnv } from "dotenv";
import { Resend } from "resend";

// Load .env from the backend root (one level up from utils/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, "../.env") });

// ==================== RESEND ====================
const resend = new Resend(process.env.RESEND_API_KEY);

// ==================== BRAND CONFIG ====================
const BRAND_NAME = "Titan Blockchain Capital";
const WEBSITE_URL = "https://titanblockchaincapital.com";
const FRONTEND_URL = "https://titanblockchaincapital.com";
const SUPPORT_EMAIL = "support@titanblockchaincapital.com";
const FROM_EMAIL =
  "Titan Blockchain Capital <notifications@titanblockchaincapital.com>";
const LOGO_URL = "https://titanblockchaincapital.com/images/logo.png";

// ==================== OFFER CONFIG ====================
const OLD_FEE_USD = 500;
const NEW_FEE_USD = 300;
const CTA_PATH = "/dashboard.html"; // 👈 where users go to pay
const CTA_URL = new URL(CTA_PATH, FRONTEND_URL).toString();

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

const buildPriceBadge = () => `
  <div style="margin:26px 0;padding:24px;border-radius:18px;background:linear-gradient(135deg,#0b0f19 0%,#10172a 60%,#151f36 100%);text-align:center;">
    <div style="font-family:Manrope,Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#e4b84f;margin-bottom:12px;">
      Limited-Time Special Offer
    </div>
    <div style="font-family:Manrope,Arial,sans-serif;font-size:46px;line-height:1;font-weight:800;color:#ffffff;margin-bottom:8px;">
      $${NEW_FEE_USD}
    </div>
    <div style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72);">
      <span style="text-decoration:line-through;opacity:0.65;">$${OLD_FEE_USD}</span>
      &nbsp;&middot;&nbsp; one-time registration fee
    </div>
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

// ==================== MAIN SINGLE-SEND FUNCTION ====================
export async function sendRegistrationFeeAnnouncement({
  to,
  fullName = "",
  ctaUrl = CTA_URL,
} = {}) {
  if (!to) {
    throw new Error("Recipient email is required.");
  }

  const subject =
    "Special Offer: Your Titan Blockchain Capital Registration Fee is Now $300";

  const bodyHtml = `
    <div style="font-size:18px;line-height:1.7;color:#334155;margin-bottom:20px;">
      Dear <strong style="color:#0f172a;">${escapeHtml(fullName || "Valued Client")}</strong>,
    </div>

    <div style="font-size:17px;line-height:1.75;color:#475569;margin-bottom:20px;">
      We have a limited-time offer for you. For a short period, the one-time
      registration fee for <strong>${escapeHtml(BRAND_NAME)}</strong> has been
      reduced from <strong>$${OLD_FEE_USD}</strong> to just
      <strong>$${NEW_FEE_USD}</strong>.
    </div>

    ${buildPriceBadge()}

    <div style="font-size:17px;line-height:1.75;color:#0f172a;font-weight:700;margin-bottom:6px;">
      Your $${NEW_FEE_USD} registration unlocks:
    </div>

    ${buildBullet([
      "A fully verified, secure account",
      "Live trading signals at over 80% signal accuracy",
      "Real-time trade results and balance updates",
      "Deposit, withdrawal, and referral program access",
      "The ability to withdraw profits anytime, anyday",
    ])}

    <div style="font-size:17px;line-height:1.75;color:#475569;margin-bottom:20px;">
      This is the same full platform access, now at a lower entry point.
      The reduced fee will only be available for a limited time.
    </div>

    ${buildButton(`Complete Registration, $${NEW_FEE_USD}`, ctaUrl)}

    <div style="font-size:16px;line-height:1.7;color:#64748b;">
      Already registered? No action is needed, this offer applies to new
      and pending registrations only.
    </div>

    <div style="font-size:16px;line-height:1.7;color:#64748b;margin-top:14px;">
      Questions? Contact
      <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#0f172a;font-weight:700;text-decoration:none;">
        ${escapeHtml(SUPPORT_EMAIL)}
      </a>.
    </div>
  `;

  const html = buildShell({
    title: subject,
    eyebrow: "Limited-Time Offer",
    heading: "Registration fee now $300",
    intro:
      "For a limited time, join Titan Blockchain Capital at a reduced one-time registration fee, down from $500 to $300.",
    bodyHtml,
  });

  const text = `
${BRAND_NAME}

Dear ${fullName || "Valued Client"},

We have a limited-time offer for you. The one-time registration fee for ${BRAND_NAME} has been reduced from $${OLD_FEE_USD} to just $${NEW_FEE_USD}.

Your $${NEW_FEE_USD} registration unlocks:
- A fully verified, secure account
- Live trading signals at over 80% signal accuracy
- Real-time trade results and balance updates
- Deposit, withdrawal, and referral program access
- The ability to withdraw profits anytime, anyday

This is the same full platform access, now at a lower entry point. The reduced fee is only available for a limited time.

Complete your registration here:
${ctaUrl}

Already registered? No action is needed, this offer applies to new and pending registrations only.

Questions? Contact ${SUPPORT_EMAIL}.

${BRAND_NAME}
  `.trim();

  return sendBrandedEmail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
    mailer: "Titan Registration Offer System",
  });
}

// ==================== BULK SEND FUNCTION ====================
export async function sendRegistrationFeeAnnouncementToAll({
  users = [],
  delayMs = 700, // ~1.4 req/sec, safely under Resend free-tier limits
  onProgress,
} = {}) {
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error("No users provided.");
  }

  const results = { sent: 0, failed: 0, errors: [], total: users.length };

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (!user || !user.email) continue;

    try {
      await sendRegistrationFeeAnnouncement({
        to: user.email,
        fullName: user.fullName || "",
      });
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({ email: user.email, message: err.message });
    }

    if (typeof onProgress === "function") {
      onProgress({ index: i + 1, total: users.length, results });
    }

    if (i < users.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return results;
}

// ==================== CLI RUNNER ====================
const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const [, , arg1, ...rest] = process.argv;

  if (!arg1) {
    console.error("Usage:");
    console.error(
      "  node utils/registrationFeeAnnouncement.js <email> [full name]"
    );
    console.error(
      "  node utils/registrationFeeAnnouncement.js --all"
    );
    process.exitCode = 1;
  } else if (arg1 === "--all") {
    runAll();
  } else {
    const fullName = rest.join(" ").trim();
    sendRegistrationFeeAnnouncement({ to: arg1, fullName })
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

async function runAll() {
  let mongoose;
  try {
    const mongooseModule = await import("mongoose");
    mongoose = mongooseModule.default;
    const { default: User } = await import("../models/userModel.js");

    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error(
        "No MongoDB URI found. Set MONGO_URI (or MONGODB_URI) in .env"
      );
    }

    await mongoose.connect(mongoUri);
    console.log("🔌 Connected to MongoDB.");

    // Audience: verified + active users who haven't completed the paid registration.
    // Adjust this filter if you want to include/exclude different groups.
    const users = await User.find({
      isVerified: true,
      isActive: true,
      kycStatus: { $ne: "verified" },
    })
      .select("email fullName")
      .lean();

    console.log(`📨 Preparing to send to ${users.length} users...`);

    if (users.length === 0) {
      console.log("ℹ️  No matching users, nothing to send.");
      await mongoose.disconnect();
      process.exitCode = 0;
      return;
    }

    const results = await sendRegistrationFeeAnnouncementToAll({
      users,
      onProgress: ({ index, total }) => {
        process.stdout.write(`\r  → ${index}/${total} processed`);
      },
    });

    console.log(`\n✅ Sent: ${results.sent} | ❌ Failed: ${results.failed}`);

    if (results.errors.length) {
      console.table(results.errors);
    }

    await mongoose.disconnect();
    process.exitCode = results.failed > 0 ? 1 : 0;
  } catch (err) {
    console.error("\n❌ Bulk send failed:", err.message);
    if (mongoose && mongoose.connection.readyState === 1) {
      await mongoose.disconnect().catch(() => {});
    }
    process.exitCode = 1;
  }
}

export default sendRegistrationFeeAnnouncement;