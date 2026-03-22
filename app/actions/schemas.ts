// app/actions/schemas.ts

import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  phoneNumber: z
    .string()
    .regex(/^(?:\+63|63|0)9\d{9}$/, {
      message:
        "Phone number must be a valid Philippine mobile number (e.g., 09171234567 or +639171234567).",
    }),
})

export type User = z.infer<typeof userSchema>

export const userFormSchema = userSchema.omit({ id: true })
export type UserFormData = z.infer<typeof userFormSchema>
