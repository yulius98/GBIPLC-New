import { z } from 'zod';

const loginSchema = z.object({
  email: z.string({ message: 'Email wajib diisi' }).email('Format email tidak valid'),
  password: z.string({ message: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
});

export { loginSchema };
