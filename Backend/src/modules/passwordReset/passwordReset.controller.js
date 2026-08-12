import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma.js';
import mailService from '../../services/mail.service.js';
const RESET_TOKEN_HOURS = 2; // token berlaku 2 jam

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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(422).json({
        status: false,
        message: 'Alamat email tidak terdaftar',
      });
    }

    // Token acak, simpan ke tabel password_reset_tokens
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.upsert({
      where: { email },
      update: { token, created_at: new Date() },
      create: { email, token },
    });

    await mailService.sendPasswordReset(email, token);

    return res.json({
      status: true,
      message: 'Link reset password telah dikirim ke email Anda.',
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

    // Token tidak ditemukan / sudah kedaluwarsa
    if (!record || record.token !== token) {
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

    await prisma.user.update({
      where: { email },
      data: { password: await bcrypt.hash(password, 12) },
    });

    await prisma.passwordResetToken.delete({ where: { email } });

    return res.json({
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    });
  },
};

export default passwordResetController;
