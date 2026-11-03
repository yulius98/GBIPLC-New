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
   * Statistik lengkap untuk dashboard admin:
   * - anggota (total, baru 1 bulan, komposisi role)
   * - konten (kegiatan, kunjungan, saat teduh, materi, komsel, ibadah raya)
   * - grafik pengunjung website 14 hari terakhir
   * - grafik kunjungan pastoral 6 bulan terakhir
   * - ulang tahun anggota yang mendekat (30 hari)
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

    // Batas waktu yang dipakai semua agregat (dayjs disimpan utuh,
    // dikonversi .toDate() saat dipasangkan ke Prisma).
    const today = dayjs().startOf('day');
    const startBulanIni = dayjs().startOf('month');
    const awalGrafikKunjungan = startBulanIni.subtract(5, 'month');
    const awalGrafikPengunjung = today.subtract(13, 'day');

    const [
      totalAnggota,
      jemaatBaru,
      perRole,
      kegiatanTotal,
      kegiatanMendatang,
      kunjunganTotal,
      kunjunganBulanIni,
      saatTeduhTotal,
      materiKotbahTotal,
      komselTotal,
      ibadahRayaMendatang,
      pengunjungBulanIni,
      totalPengunjung,
      kunjunganRows,
      pengunjungRows,
      anggotaRows,
    ] = await Promise.all([
      prisma.user.count({ where: { deleted_at: null } }),
      prisma.user.count({
        where: {
          deleted_at: null,
          role: 'jemaat',
          created_at: { gte: dayjs().subtract(1, 'month').toDate() },
        },
      }),
      prisma.user.groupBy({
        by: ['role'],
        where: { deleted_at: null },
        _count: { _all: true },
      }),
      prisma.tblEvent.count({ where: { deleted_at: null } }),
      prisma.tblEvent.count({
        where: { deleted_at: null, tgl_event: { gte: new Date() } },
      }),
      prisma.tblKunjungan.count({ where: { deleted_at: null } }),
      prisma.tblKunjungan.count({
        where: {
          deleted_at: null,
          tglkunjungan: {
            gte: startBulanIni.toDate(),
            lt: startBulanIni.add(1, 'month').toDate(),
          },
        },
      }),
      prisma.tblPastorNote.count({ where: { deleted_at: null } }),
      prisma.tblMateriKotbah.count({ where: { deleted_at: null } }),
      prisma.tblKomsel.count({ where: { deleted_at: null } }),
      prisma.tblIbadahRaya.count({
        where: { deleted_at: null, tgl_ibadah: { gte: new Date() } },
      }),
      prisma.tblVisitorStat.count({
        where: {
          visit_date: {
            gte: startBulanIni.toDate(),
            lt: startBulanIni.add(1, 'month').toDate(),
          },
        },
      }),
      prisma.tblVisitorStat.count(),
      // Kunjungan pastoral 6 bulan terakhir — dihitung di server (Prisma
      // tidak punya groupBy per bulan), skala data gereja aman.
      prisma.tblKunjungan.findMany({
        where: {
          deleted_at: null,
          tglkunjungan: { gte: awalGrafikKunjungan.toDate() },
        },
        select: { tglkunjungan: true },
      }),
      // Pengunjung website 14 hari terakhir
      prisma.tblVisitorStat.findMany({
        where: { visit_date: { gte: awalGrafikPengunjung.toDate() } },
        select: { visit_date: true },
      }),
      // Ulang tahun anggota
      prisma.user.findMany({
        where: { deleted_at: null, tgl_lahir: { not: null } },
        select: { name: true, tgl_lahir: true },
      }),
    ]);

    // Grafik pengunjung: 14 titik harian (hanya hari, tanpa jam).
    const petaPengunjung = new Map();
    for (const row of pengunjungRows) {
      const kunci = dayjs(row.visit_date).format('YYYY-MM-DD');
      petaPengunjung.set(kunci, (petaPengunjung.get(kunci) ?? 0) + 1);
    }

    const pengunjungSeries = [];
    for (let i = 13; i >= 0; i -= 1) {
      const tanggal = today.subtract(i, 'day').format('YYYY-MM-DD');
      pengunjungSeries.push({ tanggal, jumlah: petaPengunjung.get(tanggal) ?? 0 });
    }

    // Grafik kunjungan pastoral: 6 titik bulanan.
    const petaKunjungan = new Map();
    for (const row of kunjunganRows) {
      const kunci = dayjs(row.tglkunjungan).format('YYYY-MM');
      petaKunjungan.set(kunci, (petaKunjungan.get(kunci) ?? 0) + 1);
    }

    const kunjunganSeries = [];
    for (let i = 5; i >= 0; i -= 1) {
      const bulan = startBulanIni.subtract(i, 'month');
      const kunci = bulan.format('YYYY-MM');
      kunjunganSeries.push({ bulan: kunci, jumlah: petaKunjungan.get(kunci) ?? 0 });
    }

    // Ulang tahun: kejadian berikutnya (tahun ini, atau tahun depan bila lewat).
    const ultahMendekat = anggotaRows
      .map((row) => {
        const lahir = dayjs(row.tgl_lahir);
        let berikutnya = lahir.year(today.year());
        if (berikutnya.isBefore(today, 'day')) {
          berikutnya = berikutnya.add(1, 'year');
        }
        return {
          nama: row.name,
          tanggal: berikutnya.format('YYYY-MM-DD'),
          dalam_hari: berikutnya.diff(today, 'day'),
        };
      })
      .filter((item) => item.dalam_hari <= 30)
      .sort((a, b) => a.dalam_hari - b.dalam_hari)
      .slice(0, 5);

    // Komposisi anggota per role untuk donut chart.
    const komposisi = { jemaat: 0, pengurus: 0, pendeta: 0 };
    for (const grup of perRole) {
      komposisi[grup.role] = grup._count?._all ?? 0;
    }

    return apiResponse.success(res, {
      message: 'Berhasil',
      data: {
        username: user.name,
        jumlah_jemaat: totalAnggota,
        jumlah_jemaat_baru: jemaatBaru,
        komposisi,
        konten: {
          kegiatan_total: kegiatanTotal,
          kegiatan_mendatang: kegiatanMendatang,
          kunjungan_total: kunjunganTotal,
          kunjungan_bulan_ini: kunjunganBulanIni,
          saat_teduh_total: saatTeduhTotal,
          materi_kotbah_total: materiKotbahTotal,
          komsel_total: komselTotal,
          ibadah_raya_mendatang: ibadahRayaMendatang,
        },
        pengunjung_bulan_ini: pengunjungBulanIni,
        total_pengunjung: totalPengunjung,
        grafik_pengunjung: pengunjungSeries,
        grafik_kunjungan: kunjunganSeries,
        ultah_mendekat: ultahMendekat,
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
