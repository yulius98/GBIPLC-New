import nodemailer from 'nodemailer';
import env from '../config/env.js';
/**
 * Service pengiriman email.
 * Jika MAIL_ENABLED=false, link reset hanya dicetak ke log (mode development).
 */
const mailService = {
  /**
   * Kirim email reset password.
   * @param {object} params
   * @param {string} params.to - alamat tujuan (sekaligus email akun)
   * @param {string} params.token - token reset password
   */
  async sendPasswordReset(to, token) {
    // Email akun dikirim lewat query string agar halaman reset tidak
    // perlu meminta email lagi dari user.
    const params = new URLSearchParams({ email: to });
    const resetUrl = `${env.frontendUrl}/reset-password/${token}?${params}`;

    if (!env.mail.enabled) {
      // Mode development: jangan kirim email, cukup log link reset
      console.log(`[MAIL-DEV] Reset password untuk ${to}: ${resetUrl}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: {
        user: env.mail.username,
        pass: env.mail.password,
      },
    });

    await transporter.sendMail({
      from: `"${env.mail.fromName}" <${env.mail.fromAddress}>`,
      to,
      subject: 'Reset Password - GBI PLC',
      text: `Silakan buka link berikut untuk mereset password Anda: ${resetUrl}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#1f2937;line-height:1.6">
          <h2 style="color:#1e3a8a;margin:0 0 8px">Reset Password</h2>
          <p>Halo,</p>
          <p>Kami menerima permintaan untuk mereset password akun <strong>${to}</strong>.</p>
          <p>Klik tombol di bawah ini untuk membuat password baru Anda:</p>
          <p style="text-align:center;margin:24px 0">
            <a href="${resetUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
              Reset Password
            </a>
          </p>
          <p style="font-size:13px;color:#6b7280">
            Jika tombol tidak berfungsi, salin dan buka link berikut di browser Anda:<br/>
            <a href="${resetUrl}" style="color:#2563eb;word-break:break-all">${resetUrl}</a>
          </p>
          <p style="font-size:13px;color:#6b7280">
            Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset password,
            Anda dapat mengabaikan email ini.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
          <p style="font-size:12px;color:#9ca3af">GBI Philadelphia Life Center</p>
        </div>
      `,
    });
  },
};

export default mailService;
