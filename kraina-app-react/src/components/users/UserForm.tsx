'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import * as z from 'zod'
import { User } from '@/lib/types'
import {
  userFormSchema,
  createUserFormSchema,
  type UserFormInput,
  type CreateUserFormInput,
} from '@/lib/schemas'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useUpdateUser, useCreateUser } from '@/hooks/useUsers'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const ROLE_LABELS: Record<string, string> = {
  employee: 'Pracownik',
  admin: 'Administrator',
  owner: 'Właściciel',
}

function customZodResolver(schema: z.ZodSchema): Resolver<CreateUserFormInput> {
  return async (values) => {
    const result = await schema.safeParseAsync(values)
    if (result.success) {
      return { values: result.data, errors: {} } as any
    }
    const errors: Record<string, any> = {}
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as string
      if (path && !errors[path]) {
        errors[path] = { type: issue.code as any, message: issue.message }
      }
    })
    return { values: {} as any, errors }
  }
}

type UserFormProps =
  | { mode?: 'edit'; employee: User; onSuccess?: () => void; onCancel?: () => void }
  | { mode: 'create'; employee?: never; onSuccess?: () => void; onCancel?: () => void }

export function UserForm(props: UserFormProps) {
  const { onSuccess, onCancel } = props
  const isCreating = props.mode === 'create'
  const employee = isCreating ? null : props.employee

  const updateMutation = useUpdateUser()
  const createMutation = useCreateUser()

  const form = useForm<CreateUserFormInput>({
    resolver: customZodResolver(
      isCreating ? createUserFormSchema : userFormSchema
    ),
    defaultValues: employee
      ? {
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          phone: employee.phone || '',
          email: employee.email || '',
          address: employee.address || '',
          role: employee.role,
          assemblyRate: employee.assemblyRate || 0,
          disassemblyRate: employee.disassemblyRate || 0,
          isActive: employee.isActive ?? true,
          password: '',
        }
      : {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          address: '',
          role: 'employee',
          assemblyRate: 0,
          disassemblyRate: 0,
          isActive: true,
          password: '',
        },
  })

  useEffect(() => {
    if (employee) {
      form.reset({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        phone: employee.phone || '',
        email: employee.email || '',
        address: employee.address || '',
        role: employee.role,
        assemblyRate: employee.assemblyRate || 0,
        disassemblyRate: employee.disassemblyRate || 0,
        isActive: employee.isActive ?? true,
        password: '',
      })
    }
  }, [employee, form])

  const onSubmit = async (values: CreateUserFormInput) => {
    if (isCreating) {
      createMutation.mutate(
        {
          email: values.email!,
          password: values.password!,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          address: values.address || undefined,
          role: values.role,
          assemblyRate: values.assemblyRate,
          disassemblyRate: values.disassemblyRate,
          isActive: values.isActive,
        },
        { onSuccess: () => onSuccess?.() }
      )
    } else if (employee) {
      const { password, ...updates } = values
      updateMutation.mutate(
        { id: employee.id, updates },
        { onSuccess: () => onSuccess?.() }
      )
    }
  }

  const onError = (errors: any) => {
    const errorMessages = Object.values(errors).map((err: any) => err?.message).filter(Boolean)
    if (errorMessages.length > 0) {
      errorMessages.forEach((msg) => toast.error(msg as string))
    } else {
      toast.error('Formularz zawiera błędy. Sprawdź wszystkie pola.')
    }
  }

  const isPending = updateMutation.isPending || createMutation.isPending
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Błąd walidacji</AlertTitle>
            <AlertDescription>
              Formularz zawiera niepoprawne dane. Sprawdź komunikaty pod polami.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imię</FormLabel>
                <FormControl>
                  <Input placeholder="np. Jan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nazwisko</FormLabel>
                <FormControl>
                  <Input placeholder="np. Kowalski" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="np. +48 123 456 789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email {isCreating && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="np. jan@firma.pl" {...field} />
                </FormControl>
                {isCreating && (
                  <FormDescription>Email będzie używany jako login do systemu.</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {isCreating && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Hasło <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 6 znaków" {...field} />
                  </FormControl>
                  <FormDescription>
                    Hasło tymczasowe — użytkownik powinien je zmienić po pierwszym logowaniu.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Adres</FormLabel>
                <FormControl>
                  <Input placeholder="np. ul. Przykładowa 10, Warszawa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rola</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz rolę..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div /> {/* spacer */}

          <FormField
            control={form.control}
            name="assemblyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stawka za montaż (PLN)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>Kwota za pojedynczy montaż atrakcji.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="disassemblyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stawka za demontaż (PLN)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>Kwota za pojedynczy demontaż atrakcji.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 md:col-span-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Aktywny</FormLabel>
                  <FormDescription>
                    Czy użytkownik jest aktywny i może być przypisywany do rezerwacji.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Anuluj
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Zapisywanie...' : isCreating ? 'Dodaj użytkownika' : 'Zapisz zmiany'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
