import crypto from 'crypto';
import dayjs from 'dayjs';
import prisma from '../../utils/prisma.js';
import apiResponse from '../../utils/apiResponse.js';

/**
 * Modul statistik pengunjung website (tabel tbl_visitor_counts).
 * Satu baris per pengunjung per hari — visitor_hash unik menjadi
 * dedup otomatis: refresh/hit berulang di hari yang sama tidak
 * menambah hitungan.
 */
const visitorController = {
  /**
   * POST /api/visits (publik, tanpa auth)
   * Catat kunjungan. Frontend mengirim visitor_id anonim (uuid perangkat,
   * disimpan di localStorage). Server gabungkan dengan IP + tanggal hari ini
   * menjadi hash, lalu upsert — duplikat hari yang sama diabaikan.
   */
  async track(req, res) {
    const visitorId = String(req.body?.visitor_id ?? '').trim();
    const forwarded = req.headers['x-forwarded-for'];
    const ip = String(
      (forwarded ? String(forwarded).split(',')[0] : '') ||
        req.socket?.remoteAddress ||
        ''
    ).trim();
    const userAgent = String(req.headers['user-agent'] ?? '');
    const today = dayjs().format('YYYY-MM-DD');

    const visitorHash = crypto
      .createHash('sha256')
      .update(`${visitorId}|${ip}|${userAgent}|${today}`)
      .digest('hex');

    await prisma.tblVisitorStat.upsert({
      where: { visitor_hash: visitorHash },
      update: {},
      create: { visitor_hash: visitorHash, visit_date: new Date(today) },
    });

    return apiResponse.success(res, {
      message: 'Kunjungan tercatat',
      data: { date: today },
    });
  },

  /**
   * GET /api/dashboard/visitors (auth, role: pengurus)
   * Ringkasan jumlah pengunjung: bulan ini & total.
   */
  async stats(req, res) {
    const startOfMonth = dayjs().startOf('month');
    const endOfMonth = startOfMonth.add(1, 'month');

    const [bulanIni, total] = await Promise.all([
      prisma.tblVisitorStat.count({
        where: {
          visit_date: { gte: startOfMonth.toDate(), lt: endOfMonth.toDate() },
        },
      }),
      prisma.tblVisitorStat.count(),
    ]);

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: {
        pengunjung_bulan_ini: bulanIni,
        total_pengunjung: total,
        periode: startOfMonth.format('MMMM YYYY'),
      },
    });
  },
};

export default visitorController;
