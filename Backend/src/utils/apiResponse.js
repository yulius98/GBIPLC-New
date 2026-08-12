/**
 * Helper untuk format respons yang konsisten dengan API Laravel lama,
 * agar aplikasi mobile (Flutter) yang sudah ada tetap kompatibel.
 *
 * Format lama: { status: boolean, message: string, data: any }
 */
const apiResponse = {
  /**
   * Respons sukses. status HTTP default 200.
   */
  success(res, { message = 'Data ditemukan', data = null, statusCode = 200 } = {}) {
    return res.status(statusCode).json({
      status: true,
      message,
      data,
    });
  },

  /**
   * Respons gagal. status HTTP default 400.
   */
  error(res, { message = 'Terjadi kesalahan', statusCode = 400, errors = null } = {}) {
    const body = {
      status: false,
      message,
    };
    if (errors !== null) body.errors = errors;
    return res.status(statusCode).json(body);
  },

  /**
   * Respons "data tidak ditemukan" dengan format default Laravel lama.
   */
  notFound(res, { message = 'Data tidak ditemukan' } = {}) {
    return res.status(404).json({
      status: false,
      message,
      data: [],
    });
  },
};

export default apiResponse;
