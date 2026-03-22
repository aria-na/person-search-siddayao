// app/components/user-form.tsx
'use client'

import { UseFormReturn } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { UserFormData } from '../actions/schemas'


interface FormComponentProps {
  form: UseFormReturn<UserFormData>
}

export function UserForm({ form }: FormComponentProps) {
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} />
            </FormControl>
            <FormDescription>
              Enter full name.
            </FormDescription>
            {fieldState.error && (
                            <p className="text-red-600 text-sm mt-1">
                                {String(fieldState.error) || ''}
                            </p>
                        ) }
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="john@example.com" {...field} />
            </FormControl>
            <FormDescription>
              Enter email address.
            </FormDescription>
            {fieldState.error && (
                            <p className="text-red-600 text-sm mt-1">
                                {String(fieldState.error) || ''}
                            </p>
                        ) }
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input placeholder="09171234567" {...field} />
            </FormControl>
            <FormDescription>
              Enter a Philippine mobile number (e.g., 09171234567 or +639171234567).
            </FormDescription>
            {fieldState.error && (
                            <p className="text-red-600 text-sm mt-1">
                                {String(fieldState.error) || ''}
                            </p>
                        ) }
          </FormItem>
        )}
      />
    </Form>
  )
}