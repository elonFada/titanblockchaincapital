import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { config as loadEnv } from "dotenv";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, "../.env") });

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND_NAME = "Titan Blockchain Capital";
const FRONTEND_URL = "https://titanblockchaincapital.com";
const SUPPORT_EMAIL = "support@titanblockchaincapital.com";
const FROM_EMAIL = "Titan Blockchain Capital <notifications@titanblockchaincapital.com>";
const LOGO_URL = "https://titanblockchaincapital.com/images/logo-dark.avif";
const CTA_URL = new URL("/register.html", FRONTEND_URL).toString();

const WITHDRAWALS = [
  { name: "Harry Whitaker", profit: 44500, story: "earned from the trading bot in 3 days", coin: "BNB", walletAddress: "0x7a3F9c…••••••••••••…e41B2d" },
  { name: "Michael Donovan", profit: 31200, story: "earned from a single BTC trade", coin: "BTC", walletAddress: "0x2bE84d…••••••••••••…09cA7f" },
  { name: "Robert Callahan", profit: 25750, story: "earned from the trading bot in 5 days", coin: "BNB", walletAddress: "0x91Dc05…••••••••••••…b3F68a" },
  { name: "Emily Hargrove", profit: 57900, story: "earned from a single USDT (TRC20) trade", coin: "USDT (TRC20)", walletAddress: "0x4fA1e7…••••••••••••…7d52C9" },
  { name: "Daniel Prescott", profit: 36400, story: "earned from the trading bot in 4 days", coin: "BNB", walletAddress: "0xc60B3a…••••••••••••…12eD84" },
  { name: "Sarah Lindqvist", profit: 31600, story: "earned from a single BNB trade", coin: "BNB", walletAddress: "0x58e2Fb…••••••••••••…a9306E" },
  { name: "Christopher Bell", profit: 46800, story: "earned from the trading bot in 3 days", coin: "BNB", walletAddress: "0xd3714C…••••••••••••…6bF0a1" },
];

const TOTAL_PAID = WITHDRAWALS.reduce((sum, w) => sum + w.profit, 0);

const escapeHtml = (value = "") =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const formatUSD = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const buildRefId = () => `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ==================== FIXED SHELL FOR DARK/LIGHT MODE ====================
const buildShell = ({ title, eyebrow, heading, intro, bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light dark; supported-color-schemes: light dark; }
      [data-ogsc] .force-bg { background-color: #0b0f19 !important; }
      [data-ogsc] .force-text-white { color: #ffffff !important; }
      [data-ogsc] .force-text-gold { color: #e4b84f !important; }
      [data-ogsc] .force-text-light { color: #cbd5e1 !important; }
      [data-ogsc] .force-text-green { color: #16a34a !important; }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#eef2f7;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-collapse:collapse;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.12);">
            
            <!-- HEADER: Solid background color instead of gradient to prevent Gmail inversion -->
            <tr>
              <td align="center" class="force-bg" bgcolor="#0b0f19" style="padding:40px 24px;background-color:#0b0f19;">
                <img
                  src="${escapeHtml(LOGO_URL)}"
                  alt="${escapeHtml(BRAND_NAME)}"
                  width="56"
                  height="56"
                  style="display:block;margin:0 auto 14px auto;width:56px;height:56px;object-fit:contain;border:0;"
                />
                <div class="force-text-gold" style="font-family:Manrope,Arial,sans-serif;font-size:13px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#e4b84f;margin-bottom:12px;">
                  ${escapeHtml(eyebrow)}
                </div>
                <div class="force-text-white" style="font-family:Manrope,Arial,sans-serif;font-size:32px;line-height:1.2;font-weight:800;color:#ffffff;margin:0 0 12px 0;">
                  ${escapeHtml(heading)}
                </div>
                <div class="force-text-light" style="max-width:440px;margin:0 auto;font-size:17px;line-height:1.7;color:#cbd5e1;">
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

const buildButton = (label, url) => `
  <div style="text-align:center;margin:28px 0;">
    <a href="${escapeHtml(url)}" style="display:inline-block;background-color:#e4b84f;color:#0b0f19;text-decoration:none;font-weight:800;padding:16px 30px;border-radius:14px;font-size:17px;">
      ${escapeHtml(label)}
    </a>
  </div>
`;

const buildStatsBar = () => `
  <div class="force-bg" bgcolor="#0b0f19" style="margin:26px 0;padding:24px;border-radius:18px;background-color:#0b0f19;text-align:center;">
    <div class="force-text-gold" style="font-family:Manrope,Arial,sans-serif;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#e4b84f;margin-bottom:14px;">
      This Week in Verified Withdrawals
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td width="50%" align="center" style="padding:4px;">
          <div class="force-text-white" style="font-family:Manrope,Arial,sans-serif;font-size:34px;line-height:1;font-weight:800;color:#ffffff;">
            7
          </div>
          <div class="force-text-light" style="font-size:13px;line-height:1.5;color:#cbd5e1;margin-top:6px;">
            Clients Paid
          </div>
        </td>
        <td width="50%" align="center" style="padding:4px;">
          <!-- Green Money -->
          <div class="force-text-green" style="font-family:Manrope,Arial,sans-serif;font-size:34px;line-height:1;font-weight:800;color:#4ade80;">
            ${escapeHtml(formatUSD(TOTAL_PAID))}
          </div>
          <div class="force-text-light" style="font-size:13px;line-height:1.5;color:#cbd5e1;margin-top:6px;">
            Total Paid Out
          </div>
        </td>
      </tr>
    </table>
  </div>
`;

const buildWithdrawalRow = (entry, index) => `
  <tr>
    <td style="padding:18px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
      <div style="font-size:15px;line-height:1.5;font-weight:700;color:#0f172a;">
        ${index + 1}. ${escapeHtml(entry.name)}
      </div>
      <div style="font-size:14px;line-height:1.6;color:#475569;margin-top:4px;">
        ${escapeHtml(entry.story)}
      </div>
      <div style="font-size:13px;line-height:1.5;color:#64748b;margin-top:6px;font-family:Consolas,Menlo,monospace;word-break:break-all;">
        ${escapeHtml(entry.walletAddress)}
        &nbsp;<span style="display:inline-block;padding:1px 6px;border-radius:6px;background-color:#eef2f7;color:#0f172a;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;">
          ${escapeHtml(entry.coin)}
        </span>
      </div>
    </td>
    <td align="right" style="padding:18px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;white-space:nowrap;">
      <!-- Green Money -->
      <div style="font-family:Manrope,Arial,sans-serif;font-size:18px;line-height:1.2;font-weight:800;color:#16a34a;">
        ${escapeHtml(formatUSD(entry.profit))}
      </div>
      <div style="font-size:12px;line-height:1.5;color:#64748b;margin-top:2px;">
        Paid
      </div>
    </td>
  </tr>
`;

const buildWithdrawalsTable = () => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:8px 0 24px 0;">
    <tr>
      <!-- Solid bgcolor to prevent Gmail from turning it white -->
      <td class="force-bg" bgcolor="#0b0f19" style="padding:10px 16px;background-color:#0b0f19;">
        <div class="force-text-gold" style="font-family:Manrope,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#e4b84f;">
          Verified Withdrawals
        </div>
      </td>
      <td align="right" class="force-bg" bgcolor="#0b0f19" style="padding:10px 16px;background-color:#0b0f19;">
        <div class="force-text-gold" style="font-family:Manrope,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#e4b84f;">
          Amount
        </div>
      </td>
    </tr>
    ${WITHDRAWALS.map(buildWithdrawalRow).join("")}
    <tr>
      <td style="padding:16px;background-color:#f8fafc;">
        <div style="font-family:Manrope,Arial,sans-serif;font-size:14px;font-weight:800;color:#0f172a;">
          Total Paid Out
        </div>
      </td>
      <td align="right" style="padding:16px;background-color:#f8fafc;white-space:nowrap;">
        <!-- Green Money -->
        <div style="font-family:Manrope,Arial,sans-serif;font-size:18px;font-weight:800;color:#16a34a;">
          ${escapeHtml(formatUSD(TOTAL_PAID))}
        </div>
      </td>
    </tr>
  </table>
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

  if (error) throw new Error(error.message || "Unable to send email");
  return { success: true, messageId: data?.id || null };
};

export async function sendWithdrawalProofEmail({ to, fullName = "", ctaUrl = CTA_URL } = {}) {
  if (!to) throw new Error("Recipient email is required.");

  const subject = "Over $270,000 Paid Out to Clients This Week";

  const bodyHtml = `
    <div style="font-size:18px;line-height:1.7;color:#334155;margin-bottom:20px;">
      Dear <strong style="color:#0f172a;">${escapeHtml(fullName || "Valued Client")}</strong>,
    </div>

    <div style="font-size:17px;line-height:1.75;color:#475569;margin-bottom:20px;">
      Transparency is a core value at <strong>${escapeHtml(BRAND_NAME)}</strong>.
      Each week, we publish verified withdrawals made by our clients so that
      results speak for themselves.
    </div>

    <div style="font-size:17px;line-height:1.75;color:#475569;margin-bottom:0;">
      This week, seven clients withdrew a combined total of
      <strong style="color:#16a34a;">${escapeHtml(formatUSD(TOTAL_PAID))}</strong> in trading profits
      directly to their personal crypto wallets.
    </div>

    ${buildStatsBar()}
    ${buildWithdrawalsTable()}

    <div style="font-size:17px;line-height:1.75;color:#475569;margin-bottom:20px;">
      These withdrawals were processed to BTC, BNB, and USDT (TRC20) wallets.
      We do not hold client profits in an internal balance. When you withdraw,
      it goes directly to your wallet.
    </div>

    <div style="font-size:17px;line-height:1.75;color:#475569;margin-bottom:20px;">
      The same trading bot that generated these results is available to every
      verified client. If you would like to participate, complete your
      registration today.
    </div>

    ${buildButton("Complete Your Registration", ctaUrl)}

    <div style="font-size:16px;line-height:1.7;color:#64748b;margin-top:14px;">
      For further assistance, please contact
      <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#0f172a;font-weight:700;text-decoration:none;">
        ${escapeHtml(SUPPORT_EMAIL)}
      </a>.
    </div>
  `;

  const html = buildShell({
    title: subject,
    eyebrow: "Weekly Withdrawal Report",
    heading: "Client Profits, Paid in Full",
    intro: "Real withdrawals from real clients. This week, seven clients were paid out in BTC, BNB, and USDT (TRC20).",
    bodyHtml,
  });

  const text = `
${BRAND_NAME}

Dear ${fullName || "Valued Client"},

Transparency is a core value at ${BRAND_NAME}. Each week, we publish verified withdrawals made by our clients so that results speak for themselves.

This week, seven clients withdrew a combined total of ${formatUSD(TOTAL_PAID)} in trading profits directly to their personal crypto wallets.

${WITHDRAWALS.map(
  (w, i) =>
    `${i + 1}. ${w.name}\n   ${capitalize(w.story)}.\n   Profit paid: ${formatUSD(w.profit)}\n   Wallet (${w.coin}): ${w.walletAddress}`
).join("\n\n")}

Total paid out: ${formatUSD(TOTAL_PAID)}

These withdrawals were processed to BTC, BNB, and USDT (TRC20) wallets. We do not hold client profits in an internal balance. When you withdraw, it goes directly to your wallet.

The same trading bot that generated these results is available to every verified client. If you would like to participate, complete your registration here:
${ctaUrl}

For further assistance, please contact ${SUPPORT_EMAIL}.

${BRAND_NAME}
  `.trim();

  return sendBrandedEmail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
    mailer: "Titan Withdrawal Report System",
  });
}

export async function sendWithdrawalProofEmailToAll({ users = [], delayMs = 700, onProgress } = {}) {
  if (!Array.isArray(users) || users.length === 0) throw new Error("No users provided.");
  const results = { sent: 0, failed: 0, errors: [], total: users.length };

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (!user || !user.email) continue;

    try {
      await sendWithdrawalProofEmail({ to: user.email, fullName: user.fullName || "" });
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({ email: user.email, message: err.message });
    }

    if (typeof onProgress === "function") onProgress({ index: i + 1, total: users.length, results });
    if (i < users.length - 1 && delayMs > 0) await sleep(delayMs);
  }
  return results;
}

function capitalize(s = "") { return s.charAt(0).toUpperCase() + s.slice(1); }

// ==================== CLI RUNNER ====================
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const [, , arg1, ...rest] = process.argv;

  if (!arg1) {
    console.error("Usage:\n  node utils/withdrawalProofEmail.js <email> [full name]\n  node utils/withdrawalProofEmail.js --all");
    process.exitCode = 1;
  } else if (arg1 === "--all") {
    runAll();
  } else {
    const fullName = rest.join(" ").trim();
    sendWithdrawalProofEmail({ to: arg1, fullName })
      .then((result) => {
        console.log("Email sent successfully:", result);
        process.exitCode = 0;
      })
      .catch((error) => {
        console.error("Failed to send email:", error.message);
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

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!mongoUri) throw new Error("No MongoDB URI found. Set MONGO_URI in .env");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const users = await User.find({ isVerified: true, isActive: true }).select("email fullName").lean();
    console.log(`Preparing to send to ${users.length} users...`);

    if (users.length === 0) {
      console.log("No matching users found. Nothing to send.");
      await mongoose.disconnect();
      process.exitCode = 0;
      return;
    }

    const results = await sendWithdrawalProofEmailToAll({
      users,
      onProgress: ({ index, total }) => { process.stdout.write(`\r  Progress: ${index}/${total}`); },
    });

    console.log(`\nSent: ${results.sent} | Failed: ${results.failed}`);
    if (results.errors.length) console.table(results.errors);

    await mongoose.disconnect();
    process.exitCode = results.failed > 0 ? 1 : 0;
  } catch (err) {
    console.error("\nBulk send failed:", err.message);
    if (mongoose && mongoose.connection.readyState === 1) await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  }
}

export default sendWithdrawalProofEmail;