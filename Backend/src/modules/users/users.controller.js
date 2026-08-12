import dayjs from 'dayjs';
import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma.js';
import apiResponse from '../../utils/apiResponse.js';
import AppError from '../../utils/AppError.js';
import fileUploadService from '../../services/fileUpload.service.js';
import { serializeUser } from './user.serializer.js';
import { UserRole } from '../../constants/roles.js';

/**
 * Controller pengguna: registrasi jemaat, profil, dan ulang tahun.
 */
const usersController = {
  /**
   * POST /api/register
   * Mendaftarkan jemaat baru. Role otomatis 'jemaat'.
   * Body: multipart/form-data (mendukung upload foto) atau JSON.
   */
  async register(req, res) {
    const body = req.body || {};
    const hashedPassword = body.password
      ? await bcrypt.hash(body.password, 10)
      : null;

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        alamat: body.alamat,
        no_HP: body.no_HP,
        gol_darah: body.gol_darah,
        tgl_lahir: new Date(body.tgl_lahir),
        password: hashedPassword,
        facebook: body.facebook || null,
        instagram: body.instagram || null,
        filename: fileUploadService.saveFile(req.file, { subDirectory: 'foto-jemaat' }),
        role: UserRole.JEMAAT,
      },
    });

    return apiResponse.success(
      res,
      {
        message: 'Data berhasil disimpan',
        data: serializeUser(user),
      },
      200
    );
  },

  /**
   * GET /api/myprofile/:id (auth)
   * Detail profil lengkap + photo_url.
   */
  async showProfile(req, res) {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        kunjungans: {
          where: { deleted_at: null },
          select: { id: true, tglkunjungan: true, nama_timbesuk: true, keterangan: true },
        },
      },
    });

    if (!user) {
      throw new AppError('Data tidak ditemukan', 404);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: serializeUser(user),
    });
  },

  /**
   * GET /api/myprofile/:id/edit (auth)
   * Data profil untuk form edit.
   */
  async editProfile(req, res) {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!user) {
      throw new AppError('Data tidak ditemukan', 404);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: serializeUser(user),
    });
  },

  /**
   * PUT /api/myprofile/:id (auth)
   * Perbarui profil. Hanya field yang dikirim yang diubah.
   * Mendukung upload foto baru (field: filename).
   */
  async updateProfile(req, res) {
    const id = Number(req.params.id);
    const body = req.body || {};

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('User tidak ditemukan', 404);
    }

    // Hanya field yang benar-benar dikirim (mirip $request->has() di Laravel)
    const data = {};
    const textFields = ['name', 'email', 'alamat', 'no_HP', 'gol_darah', 'facebook', 'instagram'];
    for (const field of textFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        data[field] = body[field];
      }
    }
    if (Object.prototype.hasOwnProperty.call(body, 'tgl_lahir') && body.tgl_lahir) {
      data.tgl_lahir = new Date(body.tgl_lahir);
    }

    // Upload foto baru (hapus foto lama jika ada)
    if (req.file) {
      data.filename = fileUploadService.replaceFile(req.file, {
        subDirectory: 'foto-jemaat',
        oldFilePath: existing.filename,
      });
    }

    const updated = await prisma.user.update({ where: { id }, data });

    return apiResponse.success(res, {
      message: 'Data berhasil diperbarui',
      data: serializeUser(updated),
    });
  },

  /**
   * GET /api/birthday
   * Daftar jemaat yang berulang tahun pada bulan ini.
   */
  async birthdays(req, res) {
    const month = dayjs().month() + 1; // dayjs month 0-11

    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
        tgl_lahir: { not: null },
      },
      orderBy: { tgl_lahir: 'asc' },
    });

    // Filter di JS karena Prisma tidak mendukung whereMonth langsung
    const birthdays = users
      .filter((u) => dayjs(u.tgl_lahir).month() + 1 === month)
      .map(serializeUser);

    if (birthdays.length === 0) {
      return apiResponse.notFound(res);
    }

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: birthdays,
    });
  },
};

export default usersController;
