import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const userFormSchema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki').max(50, 'Imię jest za długie'),
  lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki').max(50, 'Nazwisko jest za długie'),
  phone: z.string().min(7, 'Numer telefonu jest za krótki').max(20, 'Numer telefonu jest za długi'),
  email: z.string().email('Nieprawidłowy adres email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  role: z.enum(['employee', 'admin', 'owner'], { message: 'Rola jest wymagana' }),
  assemblyRate: z.coerce.number().min(0, 'Stawka nie może być ujemna'),
  disassemblyRate: z.coerce.number().min(0, 'Stawka nie może być ujemna'),
  isActive: z.boolean().default(true),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków').optional().or(z.literal('')),
})

export type UserFormInput = z.infer<typeof userFormSchema>

export const createUserFormSchema = userFormSchema.extend({
  email: z.string().email('Nieprawidłowy adres email').min(1, 'Email jest wymagany przy tworzeniu konta'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

export type CreateUserFormInput = z.infer<typeof createUserFormSchema>

export const rentalFormSchema = z.object({
  date: z.string().min(1, 'Data jest wymagana'),
  setupTime: z.string().min(1, 'Godzina montażu jest wymagana'),
  teardownTime: z.string().min(1, 'Godzina demontażu jest wymagana'),
  clientName: z.string().min(2, 'Imię klienta musi mieć co najmniej 2 znaki').max(100, 'Imię klienta jest za długie'),
  clientPhone: z.string()
    .min(7, 'Numer telefonu jest za krótki')
    .max(20, 'Numer telefonu jest za długi')
    .regex(/^[+\d\s()-]+$/, 'Numer telefonu zawiera niedozwolone znaki'),
  street: z.string().min(2, 'Ulica jest za krótka').max(100, 'Ulica jest za długa'),
  houseNumber: z.string().min(1, 'Numer domu jest wymagany').max(20, 'Numer domu jest za długi'),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi mieć format XX-XXX'),
  city: z.string().min(2, 'Miejscowość jest za krótka').max(100, 'Miejscowość jest za długa'),
  attractionIds: z.array(z.string()).min(1, 'Wybierz co najmniej jedną atrakcję'),
  customPrice: z.union([z.literal(''), z.coerce.number().min(0, 'Cena nie może być ujemna')]).optional(),
  distanceKm: z.union([z.literal(''), z.coerce.number().min(0, 'Dystans nie może być ujemny')]).optional(),
  notes: z.string().max(500, 'Notatki są za długie').optional().or(z.literal('')),
})

export type RentalFormInput = z.infer<typeof rentalFormSchema>
