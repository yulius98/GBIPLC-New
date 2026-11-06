import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma.js';
import mailService from '../../services/mail.service.js';
import tokenService from '../../services/token.service.js';
const RESET_TOKEN_HOURS = 1; // token berlaku 1 jam

/**
 * Controller reset password via email.
 * Menggantikan PasswordResetController Laravel.
 */
const passwordResetController = {
  /**
   * POST /api/forgot-password
   * Body: { email }
   */
  async sendResetLinkEmail(req, res) {
    const { email } = req.validated_body;

    // Jangan membuka keberadaan akun: balasan selalu sama untuk semua email.
    const genericMessage = 'Jika email terdaftar, link reset password telah dikirim ke email Anda.';

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Token acak; yang disimpan adalah SHA-256-nya agar bocornya database
      // tidak langsung memberi token reset yang berlaku.
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.passwordResetToken.upsert({
        where: { email },
        update: { token: tokenHash, created_at: new Date() },
        create: { email, token: tokenHash },
      });

      await mailService.sendPasswordReset(email, token);
    }

    return res.json({
      status: true,
      message: genericMessage,
    });
  },

  /**
   * POST /api/reset-password
   * Body: { email, token, password }
   */
  async resetPassword(req, res) {
    const { email, token, password } = req.validated_body;

    const record = await prisma.passwordResetToken.findUnique({
      where: { email },
    });

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Token tidak ditemukan / sudah kedaluwarsa
    if (!record || record.token !== tokenHash) {
      return res.status(422).json({
        message: 'Token reset password tidak valid atau sudah expired',
      });
    }

    const createdAt = new Date(record.created_at).getTime();
    const isExpired = Date.now() - createdAt > RESET_TOKEN_HOURS * 60 * 60 * 1000;
    if (isExpired) {
      return res.status(422).json({
        message: 'Token reset password tidak valid atau sudah expired',
      });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { password: await bcrypt.hash(password, 12) },
    });

    // Password berubah: cabut semua access token aktif milik user ini
    // agar sesi di perangkat lain (token yang dicuri penyerang) mati.
    tokenService.revokeAllForUser(user.id);

    await prisma.passwordResetToken.delete({ where: { email } });

    return res.json({
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    });
  },
};

export default passwordResetController;
