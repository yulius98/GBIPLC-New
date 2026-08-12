import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string({ message: 'Email wajib diisi' }).email('Format email tidak valid'),
});

const resetPasswordSchema = z.object({
  email: z.string({ message: 'Email wajib diisi' }).email('Format email tidak valid'),
  token: z.string({ message: 'Token wajib diisi' }).min(1, 'Token wajib diisi'),
  password: z
    .string({ message: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter'),
});

export { forgotPasswordSchema, resetPasswordSchema };
