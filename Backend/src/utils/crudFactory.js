import AppError from './AppError.js';
import fileUploadService from '../services/fileUpload.service.js';
/**
 * Factory controller CRUD generik.
 *
 * Dipakai untuk resource yang polanya identik (list, get, create, update, delete)
 * sehingga tidak perlu menulis handler berulang kali untuk tiap model.
 *
 * @param {object} options
 * @param {object} options.model - delegate model Prisma (mis. prisma.tblYouthProgram)
 * @param {object} [options.orderBy] - default ordering, mis. { id: 'asc' }
 * @param {string[]} [options.allowedFields] - field yang boleh diisi dari body
 * @param {object} [options.fileFields] - pemetaan field upload, mis. { filename: 'foto-jemaat' }
 *   (key = field body yang menyimpan relative path hasil upload,
 *    value = sub-directory penyimpanan)
 * @param {string} [options.resourceName] - nama resource untuk pesan error
 * @param {function} [options.listWhere] - (req) => where tambahan untuk list
 * @param {string[]} [options.searchFields] - kolom yang bisa dicari via ?q=
 *   (String dicari dengan contains case-insensitive, DateTime dicari per hari)
 * @param {function} [options.transform] - (data, req) => data final sebelum create/update
 *   (dipakai untuk koersi tipe, mis. mengubah string menjadi Number/Date)
 */
function createCrudController({
  model,
  orderBy = { id: 'asc' },
  allowedFields = [],
  fileFields = {},
  resourceName = 'Data',
  listWhere = null,
  searchFields = [],
  transform = null,
}) {
  const pickBody = (body) => {
    const data = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        data[field] = body[field] ?? null;
      }
    }
    return data;
  };

  const attachFiles = (data, req) => {
    for (const [bodyField, subDirectory] of Object.entries(fileFields)) {
      const singleFile =
        req.file && (req.file.fieldname === bodyField || Object.keys(fileFields).length === 1);
      const multiFile = req.files?.[bodyField]?.[0];
      const file = singleFile || multiFile;
      if (file) {
        data[bodyField] = fileUploadService.replaceFile(file, {
          subDirectory,
          oldFilePath: req.resource?.old?.[bodyField],
        });
      }
    }
    return data;
  };

  const prepare = (req) => {
    const data = attachFiles(pickBody(req.body), req);
    return transform ? transform(data, req) : data;
  };

  const buildSearch = (q) => {
    const or = [];
    for (const field of searchFields) {
      const schema = model.fields[field];
      if (!schema) continue;
      if (schema.type === 'String') {
        or.push({ [field]: { contains: q, mode: 'insensitive' } });
      } else if (schema.type === 'DateTime') {
        const start = new Date(q);
        if (!Number.isNaN(start.getTime())) {
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          or.push({ [field]: { gte: start, lt: end } });
        }
      }
    }
    return or;
  };

  return {
    async list(req, res) {
      const hasSoftDelete = Boolean(model.fields.deleted_at);
      const where = {
        ...(listWhere ? await listWhere(req) : {}),
        ...(hasSoftDelete ? { deleted_at: null } : {}),
      };

      const q = String(req.query.q || '').trim();
      if (q) {
        const searchOr = buildSearch(q);
        if (searchOr.length) where.AND = { OR: searchOr };
      }

      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
      const rawSize = Number.parseInt(req.query.pageSize, 10);
      const pageSize = Number.isInteger(rawSize) ? Math.min(100, Math.max(1, rawSize)) : 10;

      const [items, total] = await Promise.all([
        model.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
        model.count({ where }),
      ]);

      return res.json({
        status: true,
        message: 'Data ditemukan',
        data: items,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    },

    async get(req, res) {
      const item = await model.findUnique({ where: { id: Number(req.params.id) } });
      if (!item) throw new AppError(`${resourceName} tidak ditemukan`, 404);
      return res.json({
        status: true,
        message: 'Data ditemukan',
        data: item,
      });
    },

    async create(req, res) {
      const item = await model.create({ data: prepare(req) });
      return res.status(201).json({
        status: true,
        message: 'Data berhasil disimpan',
        data: item,
      });
    },

    async update(req, res) {
      const id = Number(req.params.id);
      const existing = await model.findUnique({ where: { id } });
      if (!existing) throw new AppError(`${resourceName} tidak ditemukan`, 404);
      req.resource = { old: existing };

      const item = await model.update({
        where: { id },
        data: prepare(req),
      });
      return res.json({
        status: true,
        message: 'Data berhasil diperbarui',
        data: item,
      });
    },

    async remove(req, res) {
      const id = Number(req.params.id);
      const existing = await model.findUnique({ where: { id } });
      if (!existing) throw new AppError(`${resourceName} tidak ditemukan`, 404);

      // Soft delete jika model punya kolom deleted_at, selain itu hard delete
      if (model.fields.deleted_at) {
        await model.update({ where: { id }, data: { deleted_at: new Date() } });
      } else {
        await model.delete({ where: { id } });
      }
      return res.json({
        status: true,
        message: 'Data berhasil dihapus',
      });
    },
  };
}

export default createCrudController;
