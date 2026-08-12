import { z } from 'zod';

const dateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: 'Format tanggal tidak valid',
});

const registerSchema = z
  .object({
    name: z.string({ message: 'Nama wajib diisi' }).min(1, 'Nama wajib diisi'),
    email: z.string({ message: 'Email wajib diisi' }).email('Format email tidak valid'),
    alamat: z.string({ message: 'Alamat wajib diisi' }).min(1, 'Alamat wajib diisi'),
    no_HP: z.string({ message: 'No HP wajib diisi' }).min(1, 'No HP wajib diisi'),
    gol_darah: z.string({ message: 'Golongan darah wajib diisi' }).min(1, 'Golongan darah wajib diisi'),
    tgl_lahir: z.string({ message: 'Tanggal lahir wajib diisi' }).min(1, 'Tanggal lahir wajib diisi'),
    password: z
      .string({ message: 'Password wajib diisi' })
      .min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string({ message: 'Konfirmasi password wajib diisi' }),
    facebook: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak sama dengan password',
    path: ['confirmPassword'],
  });

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  alamat: z.string().min(1, 'Alamat wajib diisi').optional(),
  no_HP: z.string().min(1, 'No HP wajib diisi').optional(),
  gol_darah: z.string().min(1, 'Golongan darah wajib diisi').optional(),
  tgl_lahir: dateString.optional(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
});

export { registerSchema, updateProfileSchema };
