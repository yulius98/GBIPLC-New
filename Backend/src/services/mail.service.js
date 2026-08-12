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
   * @param {string} params.to - alamat tujuan
   * @param {string} params.token - token reset password
   */
  async sendPasswordReset(to, token) {
    const resetUrl = `${env.appUrl}/reset-password/${token}`;

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
      html: `<p>Silakan buka link berikut untuk mereset password Anda:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  },
};

export default mailService;
