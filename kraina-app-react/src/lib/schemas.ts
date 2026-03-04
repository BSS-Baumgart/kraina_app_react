import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

export type LoginInput = z.infer<typeof loginSchema>
