import { z } from 'zod'
import type { Resolver } from 'react-hook-form'

export function createZodResolver<T extends Record<string, any>>(schema: z.ZodSchema): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values)
    if (result.success) {
      return { values: result.data, errors: {} }
    }
    const errors: Record<string, any> = {}
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      if (path && !errors[path]) {
        errors[path] = { type: issue.code as any, message: issue.message }
      }
    })
    return { values: {} as any, errors }
  }
}
