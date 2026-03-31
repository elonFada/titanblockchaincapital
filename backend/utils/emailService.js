import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://titanblockchaincapital.com';

// ==================== OTP EMAIL ====================
export const sendEmailOTP = async (email, otp, fullName, type = 'verification') => {
  const year = new Date().getFullYear();
  const supportEmail = 'verification@titanblockchaincapital.com';
  
  const templates = {
    verification: {
      subject: '🔐 Verify Your Email | Titan Blockchain Capital',
      greeting: 'Welcome to Titan Blockchain Capital'
    },
    resend: {
      subject: '🔄 New Email Verification Code | Titan Blockchain Capital',
      greeting: 'Verification Code Refresh'
    }
  };
  
  const template = templates[type] || templates.verification;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.subject}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f5f7fa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .container {
          max-width: 560px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 35px -10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%);
          padding: 48px 40px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          color: #FFD966;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }
        .tagline {
          color: rgba(255,255,255,0.8);
          font-size: 14px;
        }
        .content {
          padding: 48px 40px;
        }
        .greeting {
          font-size: 24px;
          font-weight: 600;
          color: #1A2C3E;
          margin-bottom: 16px;
        }
        .message {
          color: #4A5B6E;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .otp-container {
          background: linear-gradient(135deg, #F8FBFE 0%, #F0F4F9 100%);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          margin: 32px 0;
          border: 1px solid #E2E8F0;
        }
        .otp-code {
          font-family: 'SF Mono', 'Monaco', monospace;
          font-size: 40px;
          font-weight: 700;
          letter-spacing: 12px;
          color: #0F2A3F;
          background: white;
          padding: 20px;
          border-radius: 12px;
          display: inline-block;
        }
        .expiry {
          color: #E67E22;
          font-size: 13px;
          margin-top: 16px;
        }
        .security-note {
          background: #FEF9E6;
          border-left: 3px solid #FFB347;
          padding: 16px 20px;
          border-radius: 12px;
          margin: 24px 0;
          font-size: 13px;
          color: #8B6B3D;
        }
        .footer {
          background: #F8FAFD;
          padding: 32px 40px;
          text-align: center;
          border-top: 1px solid #E8EDF2;
          font-size: 12px;
          color: #8A99A8;
        }
        .button {
          display: inline-block;
          padding: 12px 28px;
          background: linear-gradient(135deg, #f6dea0 0%, #e4b84f 48%, #b47a15 100%);
          color: #000;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚡ TITAN</div>
          <div class="tagline">Blockchain Capital</div>
        </div>
        <div class="content">
          <div class="greeting">${template.greeting}${fullName ? `, ${fullName}` : ''}</div>
          <div class="message">
            Thank you for choosing Titan Blockchain Capital. To secure your account and complete registration, please verify your email address using the code below.
          </div>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
            <div class="expiry">⏰ This code expires in 15 minutes</div>
          </div>
          <div class="security-note">
            🔒 <strong>Security First</strong><br>
            Never share this code with anyone. Titan Blockchain Capital will never ask for your verification code.
          </div>
          <div style="margin-top: 24px;">
            <p style="color: #8A99A8; font-size: 13px; margin: 0;">Need assistance?</p>
            <a href="mailto:${supportEmail}" style="color: #0F2A3F; text-decoration: none; font-weight: 500;">${supportEmail}</a>
          </div>
        </div>
        <div class="footer">
          <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
          <p style="margin-top: 12px;">Institutional-Grade Digital Asset Management</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    const { data, error } = await resend.emails.send({
      from: `Titan Blockchain Capital <verify@titanblockchaincapital.com>`,
      to: [email],
      subject: template.subject,
      html: html
    });
    
    if (error) throw error;
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email delivery failed:', error);
    throw new Error('Unable to send verification email. Please try again.');
  }
};

// ==================== PAYMENT EMAILS ====================
export const sendPaymentEmail = async ({ to, fullName, type, amount, dashboardUrl, reason }) => {
  const year = new Date().getFullYear();
  const supportEmail = 'support@titanblockchaincapital.com';
  
  const subjects = {
    submitted: '📩 Payment Receipt Received – Titan Blockchain Capital',
    approved: '✅ Payment Approved – Welcome to Titan Blockchain Capital',
    rejected: '❌ Payment Rejected – Titan Blockchain Capital',
  };

  const getHtmlBody = () => {
    switch(type) {
      case 'submitted':
        return `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
              <h1 style="color: #FFD966; margin: 0; font-size: 28px;">⚡ TITAN</h1>
              <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Blockchain Capital</p>
            </div>
            <div style="padding: 40px; background: #ffffff; border-radius: 0 0 20px 20px;">
              <h2 style="color: #e4b84f; margin-top: 0;">Payment Receipt Received</h2>
              <p>Hi <strong>${fullName}</strong>,</p>
              <p>We have received your registration payment receipt of <strong>$${amount}</strong>.</p>
              <p>Your payment is currently <strong>under review</strong> by our admin team. You will be notified once it has been approved.</p>
              <div style="background: #FEF9E6; border-left: 3px solid #FFB347; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #8B6B3D; font-size: 13px;">🔒 <strong>Security Note:</strong> Never share your payment details with anyone.</p>
              </div>
              <p style="color: #888; font-size: 13px;">If you did not make this payment, please contact our support team immediately.</p>
              <hr style="border: none; border-top: 1px solid #E8EDF2; margin: 24px 0;">
              <p style="margin: 0;">Best regards,<br/><strong>Titan Blockchain Capital Team</strong></p>
            </div>
            <div style="background: #F8FAFD; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 12px; color: #8A99A8;">
              <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
              <p><a href="mailto:${supportEmail}" style="color: #0F2A3F;">${supportEmail}</a></p>
            </div>
          </div>
        `;
      
      case 'approved':
        return `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
              <h1 style="color: #FFD966; margin: 0; font-size: 28px;">⚡ TITAN</h1>
              <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Blockchain Capital</p>
            </div>
            <div style="padding: 40px; background: #ffffff; border-radius: 0 0 20px 20px;">
              <h2 style="color: #22c55e; margin-top: 0;">✅ Payment Approved!</h2>
              <p>Hi <strong>${fullName}</strong>,</p>
              <p>Great news! Your registration payment of <strong>$${amount}</strong> has been <strong>approved</strong> and your account is now fully verified.</p>
              <p>You can now access your dashboard and start using all features of Titan Blockchain Capital.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #f6dea0 0%, #e4b84f 48%, #b47a15 100%); color: #000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Go to Dashboard</a>
              </div>
              <hr style="border: none; border-top: 1px solid #E8EDF2; margin: 24px 0;">
              <p style="margin: 0;">Best regards,<br/><strong>Titan Blockchain Capital Team</strong></p>
            </div>
            <div style="background: #F8FAFD; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 12px; color: #8A99A8;">
              <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
              <p><a href="mailto:${supportEmail}" style="color: #0F2A3F;">${supportEmail}</a></p>
            </div>
          </div>
        `;
      
      case 'rejected':
        return `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
              <h1 style="color: #FFD966; margin: 0; font-size: 28px;">⚡ TITAN</h1>
              <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Blockchain Capital</p>
            </div>
            <div style="padding: 40px; background: #ffffff; border-radius: 0 0 20px 20px;">
              <h2 style="color: #ef4444; margin-top: 0;">❌ Payment Rejected</h2>
              <p>Hi <strong>${fullName}</strong>,</p>
              <p>Unfortunately, your registration payment of <strong>$${amount}</strong> could not be verified.</p>
              <div style="background: #FEF2F2; border-left: 3px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #991B1B; font-size: 13px;"><strong>Reason:</strong> ${reason}</p>
              </div>
              <p>Please resubmit your payment receipt with the correct details. If you believe this is an error, please contact our support team.</p>
              <hr style="border: none; border-top: 1px solid #E8EDF2; margin: 24px 0;">
              <p style="margin: 0;">Best regards,<br/><strong>Titan Blockchain Capital Team</strong></p>
            </div>
            <div style="background: #F8FAFD; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 12px; color: #8A99A8;">
              <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
              <p><a href="mailto:${supportEmail}" style="color: #0F2A3F;">${supportEmail}</a></p>
            </div>
          </div>
        `;
      default: return '';
    }
  };
  
  try {
    const { data, error } = await resend.emails.send({
      from: `Titan Blockchain Capital <notifications@titanblockchaincapital.com>`,
      to: [to],
      subject: subjects[type],
      html: getHtmlBody()
    });
    
    if (error) throw error;
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Payment email failed:', error);
    return { success: false, error: error.message };
  }
};

// ==================== DEPOSIT EMAILS ====================
export const sendDepositEmail = async ({ to, fullName, type, amount, transactionId, coinType, reason }) => {
  const year = new Date().getFullYear();
  const supportEmail = 'support@titanblockchaincapital.com';
  const dashboardUrl = `${FRONTEND_URL}/dashboard.html`;
  
  const subjects = {
    submitted: '📩 Deposit Receipt Received – Titan Blockchain Capital',
    approved: '✅ Deposit Approved – Titan Blockchain Capital',
    rejected: '❌ Deposit Rejected – Titan Blockchain Capital',
  };

  const getHtmlBody = () => {
    switch(type) {
      case 'submitted':
        return `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
              <h1 style="color: #FFD966; margin: 0; font-size: 28px;">⚡ TITAN</h1>
              <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Blockchain Capital</p>
            </div>
            <div style="padding: 40px; background: #ffffff; border-radius: 0 0 20px 20px;">
              <h2 style="color: #e4b84f; margin-top: 0;">Deposit Receipt Received</h2>
              <p>Hi <strong>${fullName}</strong>,</p>
              <p>We have received your deposit receipt of <strong>$${amount}</strong> via <strong>${coinType}</strong>.</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p>Your deposit is currently <strong>under review</strong> by our admin team. You will be notified once it has been approved.</p>
              <div style="background: #FEF9E6; border-left: 3px solid #FFB347; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #8B6B3D; font-size: 13px;">⏱️ Processing time: 15-30 minutes on average.</p>
              </div>
              <hr style="border: none; border-top: 1px solid #E8EDF2; margin: 24px 0;">
              <p style="margin: 0;">Best regards,<br/><strong>Titan Blockchain Capital Team</strong></p>
            </div>
            <div style="background: #F8FAFD; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 12px; color: #8A99A8;">
              <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
              <p><a href="mailto:${supportEmail}" style="color: #0F2A3F;">${supportEmail}</a></p>
            </div>
          </div>
        `;
      
      case 'approved':
        return `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
              <h1 style="color: #FFD966; margin: 0; font-size: 28px;">⚡ TITAN</h1>
              <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Blockchain Capital</p>
            </div>
            <div style="padding: 40px; background: #ffffff; border-radius: 0 0 20px 20px;">
              <h2 style="color: #22c55e; margin-top: 0;">✅ Deposit Approved!</h2>
              <p>Hi <strong>${fullName}</strong>,</p>
              <p>Great news! Your deposit of <strong>$${amount}</strong> via <strong>${coinType}</strong> has been approved.</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p>The funds have been added to your trading balance. You can now start trading.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #f6dea0 0%, #e4b84f 48%, #b47a15 100%); color: #000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Go to Dashboard</a>
              </div>
              <hr style="border: none; border-top: 1px solid #E8EDF2; margin: 24px 0;">
              <p style="margin: 0;">Best regards,<br/><strong>Titan Blockchain Capital Team</strong></p>
            </div>
            <div style="background: #F8FAFD; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 12px; color: #8A99A8;">
              <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
              <p><a href="mailto:${supportEmail}" style="color: #0F2A3F;">${supportEmail}</a></p>
            </div>
          </div>
        `;
      
      case 'rejected':
        return `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
              <h1 style="color: #FFD966; margin: 0; font-size: 28px;">⚡ TITAN</h1>
              <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Blockchain Capital</p>
            </div>
            <div style="padding: 40px; background: #ffffff; border-radius: 0 0 20px 20px;">
              <h2 style="color: #ef4444; margin-top: 0;">❌ Deposit Rejected</h2>
              <p>Hi <strong>${fullName}</strong>,</p>
              <p>Unfortunately, your deposit of <strong>$${amount}</strong> via <strong>${coinType}</strong> could not be verified.</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <div style="background: #FEF2F2; border-left: 3px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #991B1B; font-size: 13px;"><strong>Reason:</strong> ${reason}</p>
              </div>
              <p>Please submit a new deposit with the correct details. If you believe this is an error, please contact our support team.</p>
              <hr style="border: none; border-top: 1px solid #E8EDF2; margin: 24px 0;">
              <p style="margin: 0;">Best regards,<br/><strong>Titan Blockchain Capital Team</strong></p>
            </div>
            <div style="background: #F8FAFD; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 12px; color: #8A99A8;">
              <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
              <p><a href="mailto:${supportEmail}" style="color: #0F2A3F;">${supportEmail}</a></p>
            </div>
          </div>
        `;
      default: return '';
    }
  };
  
  try {
    const { data, error } = await resend.emails.send({
      from: `Titan Blockchain Capital <notifications@titanblockchaincapital.com>`,
      to: [to],
      subject: subjects[type],
      html: getHtmlBody()
    });
    
    if (error) throw error;
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Deposit email failed:', error);
    return { success: false, error: error.message };
  }
};

// ==================== TRADING SIGNAL EMAILS ====================
export const sendTradingSignalEmail = async ({ to, fullName, type, signal, profitAmount, lossAmount, newBalance }) => {
  const year = new Date().getFullYear();
  const supportEmail = 'support@titanblockchaincapital.com';
  const dashboardUrl = `${FRONTEND_URL}/dashboard.html`;
  
  const subjects = {
    profit: '🎉 Profit Alert! – Titan Blockchain Capital',
    loss: '📉 Trade Update – Titan Blockchain Capital',
  };

  const getHtmlBody = () => {
    if (type === 'profit') {
      return `
        <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
            <h1 style="color: #FFD966; margin: 0; font-size: 28px;">⚡ TITAN</h1>
            <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Blockchain Capital</p>
          </div>
          <div style="padding: 40px; background: #ffffff; border-radius: 0 0 20px 20px;">
            <div style="text-align: center;">
              <div style="display: inline-block; padding: 20px; background: linear-gradient(135deg, #22c55e20, #22c55e10); border-radius: 100px; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎉</span>
              </div>
            </div>
            <h2 style="color: #22c55e; margin-top: 0; text-align: center;">Profit Alert!</h2>
            <p>Hi <strong>${fullName}</strong>,</p>
            <p>Great news! Your trade on <strong>${signal.symbol}</strong> has been closed with a <strong style="color: #22c55e;">PROFIT</strong>.</p>
            <div style="background: #F0FDF4; border: 1px solid #22c55e30; padding: 20px; margin: 24px 0; border-radius: 12px;">
              <p style="margin: 0 0 8px 0;"><strong>📊 Trade Details:</strong></p>
              <p style="margin: 4px 0;">• Symbol: <strong>${signal.symbol}</strong></p>
              <p style="margin: 4px 0;">• Entry Point: <strong>${signal.entryPoint}</strong></p>
              <p style="margin: 4px 0;">• Take Profit: <strong>${signal.takeProfit}</strong></p>
              <p style="margin: 4px 0;">• Stop Loss: <strong>${signal.stopLoss}</strong></p>
              <p style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid #22c55e30;">
                💰 <strong>Profit Earned:</strong> <span style="color: #22c55e; font-size: 18px;">+$${profitAmount.toFixed(2)}</span>
              </p>
            </div>
            <div style="background: #F8FAFD; padding: 16px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>💰 Your New Balance:</strong> <span style="color: #22c55e; font-size: 20px; font-weight: bold;">$${newBalance.toFixed(2)}</span></p>
            </div>
            <p>Congratulations on your successful trade! Your profits have been added to your trading balance.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #f6dea0 0%, #e4b84f 48%, #b47a15 100%); color: #000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">View Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #E8EDF2; margin: 24px 0;">
            <p style="margin: 0;">Keep trading and growing your portfolio!<br/><strong>Titan Blockchain Capital Team</strong></p>
          </div>
          <div style="background: #F8FAFD; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 12px; color: #8A99A8;">
            <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
            <p><a href="mailto:${supportEmail}" style="color: #0F2A3F;">${supportEmail}</a></p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
            <h1 style="color: #FFD966; margin: 0; font-size: 28px;">⚡ TITAN</h1>
            <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Blockchain Capital</p>
          </div>
          <div style="padding: 40px; background: #ffffff; border-radius: 0 0 20px 20px;">
            <div style="text-align: center;">
              <div style="display: inline-block; padding: 20px; background: linear-gradient(135deg, #ef444420, #ef444410); border-radius: 100px; margin-bottom: 20px;">
                <span style="font-size: 48px;">📉</span>
              </div>
            </div>
            <h2 style="color: #ef4444; margin-top: 0; text-align: center;">Trade Update</h2>
            <p>Hi <strong>${fullName}</strong>,</p>
            <p>Your trade on <strong>${signal.symbol}</strong> has been closed with a <strong style="color: #ef4444;">LOSS</strong>.</p>
            <div style="background: #FEF2F2; border: 1px solid #ef444430; padding: 20px; margin: 24px 0; border-radius: 12px;">
              <p style="margin: 0 0 8px 0;"><strong>📊 Trade Details:</strong></p>
              <p style="margin: 4px 0;">• Symbol: <strong>${signal.symbol}</strong></p>
              <p style="margin: 4px 0;">• Entry Point: <strong>${signal.entryPoint}</strong></p>
              <p style="margin: 4px 0;">• Take Profit: <strong>${signal.takeProfit}</strong></p>
              <p style="margin: 4px 0;">• Stop Loss: <strong>${signal.stopLoss}</strong></p>
              <p style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid #ef444430;">
                💸 <strong>Loss Incurred:</strong> <span style="color: #ef4444; font-size: 18px;">-$${lossAmount.toFixed(2)}</span>
              </p>
            </div>
            <div style="background: #F8FAFD; padding: 16px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0;"><strong>💰 Your New Balance:</strong> <span style="color: #ef4444; font-size: 20px; font-weight: bold;">$${newBalance.toFixed(2)}</span></p>
            </div>
            <p>Don't worry! Every trader experiences losses. Learn from this experience and come back stronger.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #f6dea0 0%, #e4b84f 48%, #b47a15 100%); color: #000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">View Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #E8EDF2; margin: 24px 0;">
            <p style="margin: 0;">Stay focused and keep trading!<br/><strong>Titan Blockchain Capital Team</strong></p>
          </div>
          <div style="background: #F8FAFD; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 12px; color: #8A99A8;">
            <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
            <p><a href="mailto:${supportEmail}" style="color: #0F2A3F;">${supportEmail}</a></p>
          </div>
        </div>
      `;
    }
  };
  
  try {
    const { data, error } = await resend.emails.send({
      from: `Titan Blockchain Capital <trading@titanblockchaincapital.com>`,
      to: [to],
      subject: subjects[type],
      html: getHtmlBody()
    });
    
    if (error) throw error;
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Trading signal email failed:', error);
    return { success: false, error: error.message };
  }
};

// ==================== WITHDRAWAL EMAILS ====================
export const sendWithdrawalEmail = async ({ to, fullName, type, amount, walletAddress, reason }) => {
  const year = new Date().getFullYear();
  const supportEmail = 'support@titanblockchaincapital.com';
  const dashboardUrl = `${FRONTEND_URL}/dashboard.html`;
  
  const subjects = {
    submitted: '📤 Withdrawal Request Received – Titan Blockchain Capital',
    approved: '✅ Withdrawal Approved – Titan Blockchain Capital',
    rejected: '❌ Withdrawal Rejected – Titan Blockchain Capital',
  };

  const getHtmlBody = () => {
    switch(type) {
      case 'submitted':
        return `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0A1C2F 0%, #0F2A3F 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
              <h1 style="color: #FFD966; margin: 0; font-size: 28px;">⚡ TITAN</h1>
              <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Blockchain Capital</p>
            </div>
            <div style="padding: 40px; background: #ffffff; border-radius: 0 0 20px 20px;">
              <h2 style="color: #e4b84f; margin-top: 0;">Withdrawal Request Received</h2>
              <p>Hi <strong>${fullName}</strong>,</p>
              <p>We have received your withdrawal request of <strong>$${amount}</strong>.</p>
              <p><strong>Wallet Address:</strong> ${walletAddress}</p>
              <p>Your withdrawal is currently <strong>under review</strong>. You will be notified once it has been processed.</p>
              <hr style="border: none; border-top: 1px solid #E8EDF2; margin: 24px 0;">
              <p style="margin: 0;">Best regards,<br/><strong>Titan Blockchain Capital Team</strong></p>
            </div>
            <div style="background: #F8FAFD; padding: 24px; text-align: center; border-radius: 0 0 20px 20px; font-size: 12px; color: #8A99A8;">
              <p>© ${year} Titan Blockchain Capital. All rights reserved.</p>
              <p><a href="mailto:${supportEmail}" style="color: #0F2A3F;">${supportEmail}</a></p>
            </div>
          </div>
        `;
      default: return '';
    }
  };
  
  try {
    const { data, error } = await resend.emails.send({
      from: `Titan Blockchain Capital <withdrawals@titanblockchaincapital.com>`,
      to: [to],
      subject: subjects[type],
      html: getHtmlBody()
    });
    
    if (error) throw error;
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Withdrawal email failed:', error);
    return { success: false, error: error.message };
  }
};