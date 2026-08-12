import { z } from 'zod';

const startDateSchema = z.object({
  start_date: z
    .string({ message: 'start_date wajib diisi' })
    .min(1, 'start_date wajib diisi')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Format tanggal tidak valid'),
});

export { startDateSchema };
