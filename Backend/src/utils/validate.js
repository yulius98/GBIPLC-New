import AppError from './AppError.js';
/**
 * Validasi request body/query/params dengan zod.
 * Error diformat seperti validasi Laravel:
 *   errors: { field: ['pesan'] }
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_errors';
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      }
      return next(new AppError('validasi gagal', 422, errors));
    }

    // Simpan hasil parse (nilai yang sudah di-transform) agar dipakai controller
    req[`validated_${source}`] = result.data;
    next();
  };
}

export default validate;
