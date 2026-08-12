import dayjs from 'dayjs';
import prisma from '../../utils/prisma.js';
import apiResponse from '../../utils/apiResponse.js';
import AppError from '../../utils/AppError.js';
/**
 * Controller dashboard pengurus (statistik jemaat).
 */
const dashboardController = {
  /**
   * GET /api/dashboard/:id (auth, role: pengurus)
   */
  async index(req, res) {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!user) {
      throw new AppError('User tidak ditemukan', 404);
    }

    const [jumlahJemaat, jumlahJemaatBaru] = await Promise.all([
      prisma.user.count({ where: { deleted_at: null } }),
      prisma.user.count({
        where: {
          deleted_at: null,
          role: 'jemaat',
          created_at: { gte: dayjs().subtract(1, 'month').toDate() },
        },
      }),
    ]);

    return apiResponse.success(res, {
      message: 'Berhasil',
      data: {
        username: user.name,
        jumlah_jemaat: jumlahJemaat,
        jumlah_jemaat_baru: jumlahJemaatBaru,
      },
    });
  },

  /**
   * GET /api/pengurus/dashboard (auth, role: pengurus)
   */
  pengurusDashboard(req, res) {
    return apiResponse.success(res, {
      message: 'Dashboard Pengurus',
    });
  },
};

export default dashboardController;
