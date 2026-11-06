import dayjs from 'dayjs';
import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma.js';
import apiResponse from '../../utils/apiResponse.js';
import AppError from '../../utils/AppError.js';
import fileUploadService from '../../services/fileUpload.service.js';
import resolveRowId from '../../utils/publicId.js';
import { serializeUser, serializeBirthdayUser } from './user.serializer.js';
import { UserRole } from '../../constants/roles.js';

/**
 * Akun admin utama dari seed — tidak ditampilkan di kelola user
 * dan tidak dapat diubah/dihapus lewat API.
 */
const PROTECTED_ADMIN_NAME = 'Admin GBI';

/**
 * Anti-IDOR: endpoint /myprofile/:id adalah area pribadi. Hanya pemilik
 * profil yang boleh mengaksesnya — role (jemaat/pengurus) tidak extend
 * hak akses ke profil orang lain. Data profil orang lain (email, No. HP,
 * alamat, riwayat kunjungan) hanya bisa dilihat pengurus lewat
 * /api/admin/users.
 * @param {object} existing  - user hasil query Prisma (target :id)
 * @param {object} currentUser - req.user dari middleware authenticate
 */
function assertSelfProfile(existing, currentUser) {
  if (!existing || !currentUser || existing.id !== currentUser.id) {
    throw new AppError('Anda hanya dapat mengakses profil Anda sendiri', 403);
  }
}

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
   * :id menerima public_id (UUID) atau id intern (Int) — transisi hybrid.
   */
  async showProfile(req, res) {
    const selector = resolveRowId(req.params.id);
    if (!selector) throw new AppError('Data tidak ditemukan', 404);

    const user = await prisma.user.findUnique({
      where: selector,
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

    assertSelfProfile(user, req.user);

    return apiResponse.success(res, {
      message: 'Data ditemukan',
      data: serializeUser(user),
    });
  },

  /**
   * GET /api/myprofile/:id/edit (auth)
   * Data profil untuk form edit.
   * :id menerima public_id (UUID) atau id intern (Int) — transisi hybrid.
   */
  async editProfile(req, res) {
    const selector = resolveRowId(req.params.id);
    if (!selector) throw new AppError('Data tidak ditemukan', 404);

    const user = await prisma.user.findUnique({
      where: selector,
    });

    if (!user) {
      throw new AppError('Data tidak ditemukan', 404);
    }

    assertSelfProfile(user, req.user);

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
    const body = req.body || {};

    const selector = resolveRowId(req.params.id);
    if (!selector) throw new AppError('User tidak ditemukan', 404);

    const existing = await prisma.user.findUnique({ where: selector });
    if (!existing) {
      throw new AppError('User tidak ditemukan', 404);
    }

    assertSelfProfile(existing, req.user);

    const id = existing.id;

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
   * GET /api/admin/users (pengurus)
   * Daftar user untuk panel admin: paging, pencarian ?q= (nama/email),
   * dan filter ?role= (jemaat|pengurus|pendeta). Soft-deleted tidak ditampilkan.
   */
  async adminList(req, res) {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const rawSize = Number.parseInt(req.query.pageSize, 10);
    const pageSize = Number.isInteger(rawSize) ? Math.min(100, Math.max(1, rawSize)) : 10;

    const q = String(req.query.q || '').trim();
    const role = String(req.query.role || '').trim();

    const where = { deleted_at: null, name: { not: PROTECTED_ADMIN_NAME } };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (Object.values(UserRole).includes(role)) {
      where.role = role;
    }

    const orderBy = { name: 'asc' };
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      status: true,
      message: 'Data ditemukan',
      data: items.map(serializeUser),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },

  /**
   * PUT /api/admin/users/:id (pengurus)
   * Ubah role user. :id menerima public_id (UUID) atau id intern (Int).
   * Role diri sendiri tidak boleh diubah agar pengurus tidak terkunci dari panel.
   */
  async adminUpdateRole(req, res) {
    const role = String(req.body?.role || '').trim();
    if (!Object.values(UserRole).includes(role)) {
      throw new AppError('Role tidak valid', 422);
    }

    const selector = resolveRowId(req.params.id);
    if (!selector) throw new AppError('User tidak ditemukan', 404);

    const existing = await prisma.user.findUnique({ where: selector });
    if (!existing) throw new AppError('User tidak ditemukan', 404);

    if (req.user && existing.id === req.user.id) {
      throw new AppError('Role akun sendiri tidak dapat diubah', 422);
    }

    if (existing.name === PROTECTED_ADMIN_NAME) {
      throw new AppError('Akun Admin GBI dilindungi dan tidak dapat diubah', 422);
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role },
    });

    return apiResponse.success(res, {
      message: 'Role berhasil diubah',
      data: serializeUser(updated),
    });
  },

  /**
   * DELETE /api/admin/users/:id (pengurus)
   * Soft delete user (deleted_at). Akun sendiri tidak dapat dihapus.
   */
  async adminRemove(req, res) {
    const selector = resolveRowId(req.params.id);
    if (!selector) throw new AppError('User tidak ditemukan', 404);

    const existing = await prisma.user.findUnique({ where: selector });
    if (!existing) throw new AppError('User tidak ditemukan', 404);

    if (req.user && existing.id === req.user.id) {
      throw new AppError('Akun sendiri tidak dapat dihapus', 422);
    }

    if (existing.name === PROTECTED_ADMIN_NAME) {
      throw new AppError('Akun Admin GBI dilindungi dan tidak dapat dihapus', 422);
    }

    if (existing.deleted_at) {
      throw new AppError('User sudah dihapus sebelumnya', 410);
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: { deleted_at: new Date() },
    });

    return apiResponse.success(res, {
      message: 'User berhasil dihapus',
    });
  },

  /**
   * GET /api/birthday
   * Daftar jemaat yang berulang tahun bulan ini.
   * Query ?months=2 untuk menyertakan bulan sebelumnya juga.
   */
  async birthdays(req, res) {
    const month = dayjs().month() + 1; // dayjs month 0-11
    const includePrevious = req.query.months === '2';
    const previousMonth = month === 1 ? 12 : month - 1;

    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
        tgl_lahir: { not: null },
      },
      orderBy: { tgl_lahir: 'asc' },
    });

    // Filter di JS karena Prisma tidak mendukung whereMonth langsung
    const birthdays = users
      .filter((u) => {
        const birthMonth = dayjs(u.tgl_lahir).month() + 1;
        return includePrevious
          ? birthMonth === month || birthMonth === previousMonth
          : birthMonth === month;
      }      )
      .map(serializeBirthdayUser);

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
