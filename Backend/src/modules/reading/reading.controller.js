import dayjs from 'dayjs';
import prisma from '../../utils/prisma.js';
import AppError from '../../utils/AppError.js';
import { fetchPassage } from '../../services/bible.service.js';
import { formatIndonesianDate, diffInDays } from '../../utils/date.js';

const TOTAL_READING_DAYS = 298;

/**
 * Controller bacaan Alkitab harian.
 * Menghasilkan bacaan pagi & malam berdasarkan reading_start_date user.
 */
const readingController = {
  /**
   * GET /api/reading/today (auth)
   */
  async today(req, res) {
    const user = req.user;

    // Gunakan reading_start_date user (jika login), atau default awal tahun
    const startDate = user?.reading_start_date ? dayjs(user.reading_start_date) : dayjs().startOf('year');

    const daysSinceStart = diffInDays(startDate, dayjs());
    const dateNow = formatIndonesianDate(new Date());

    if (daysSinceStart > TOTAL_READING_DAYS) {
      return res.json({
        date: dateNow,
        morning: null,
        evening: null,
        progress: { current_day: 0, total_days: 0 },
      });
    }

    const currentDay = (daysSinceStart % TOTAL_READING_DAYS) + 1;

    const schedule = await prisma.readingSchedule.findUnique({
      where: { day: currentDay },
    });

    if (!schedule) {
      throw new AppError('Data bacaan untuk hari ini tidak ditemukan', 404);
    }

    const [morning, evening] = await Promise.all([
      fetchPassage(schedule.morning_passage),
      fetchPassage(schedule.evening_passage),
    ]);

    return res.json({
      date: dateNow,
      morning,
      evening,
      progress: { current_day: currentDay, total_days: TOTAL_READING_DAYS },
    });
  },

  /**
   * POST /api/reading/start-date (auth)
   * Set tanggal mulai hanya jika belum ada.
   */
  async setStartDate(req, res) {
    const { start_date } = req.validated_body;
    const user = req.user;

    if (!user.reading_start_date) {
      await prisma.user.update({
        where: { id: user.id },
        data: { reading_start_date: new Date(start_date) },
      });

      return res.json({
        status: true,
        tanggal_mulai: start_date,
        message: 'Mulai membaca Alkitab',
      });
    }

    return res.json({
      status: false,
      tanggal_mulai: user.reading_start_date,
      message: 'Lanjut membaca Alkitab',
    });
  },

  /**
   * PUT /api/reading/start-date (auth)
   * Ubah tanggal mulai.
   */
  async updateStartDate(req, res) {
    const { start_date } = req.validated_body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: { reading_start_date: new Date(start_date) },
    });

    return res.json({
      status: true,
      tanggal_mulai: start_date,
      message: 'Mulai membaca Alkitab',
    });
  },
};

export default readingController;
