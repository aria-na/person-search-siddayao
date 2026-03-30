'use server'

import { prisma } from '@/lib/prisma'
import { userFormSchema, userSchema } from '@/app/actions/schemas'

const userSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
} as const

const userUpdateSchema = userFormSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update.',
  })

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002'
}

function getUniqueErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'meta' in error) {
    const meta = (error as { meta?: { target?: unknown } }).meta
    const target = meta?.target

    if (Array.isArray(target) && target.includes('phoneNumber')) {
      return 'Phone number already exists.'
    }

    if (Array.isArray(target) && target.includes('email')) {
      return 'Email already exists.'
    }
  }

  return 'A user with the same unique details already exists.'
}

function toMcpError(error: unknown): Error {
  if (isUniqueError(error)) {
    return new Error(getUniqueErrorMessage(error))
  }

  return error instanceof Error ? error : new Error('Unexpected server error.')
}

export async function mcpListPeople(query?: string) {
  const normalizedQuery = query?.trim() ?? ''
  const where = normalizedQuery
    ? {
      name: {
        startsWith: normalizedQuery,
      },
    }
    : undefined

  try {
    const users = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: {
        name: 'asc',
      },
    })

    return users.map((user) => userSchema.parse(user))
  } catch (error) {
    throw toMcpError(error)
  }
}

export async function mcpGetPerson(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    })

    if (!user) {
      throw new Error(`User with id ${id} not found`)
    }

    return userSchema.parse(user)
  } catch (error) {
    throw toMcpError(error)
  }
}

export async function mcpCreatePerson(input: unknown) {
  try {
    const validated = userFormSchema.parse(input)

    const createdUser = await prisma.user.create({
      data: validated,
      select: userSelect,
    })

    return userSchema.parse(createdUser)
  } catch (error) {
    throw toMcpError(error)
  }
}

export async function mcpUpdatePerson(id: string, input: unknown) {
  try {
    const validated = userUpdateSchema.parse(input)

    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validated,
      select: userSelect,
    })

    return userSchema.parse(updatedUser)
  } catch (error) {
    throw toMcpError(error)
  }
}

export async function mcpDeletePerson(id: string) {
  try {
    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`)
    }

    await prisma.user.delete({ where: { id } })

    return { success: true }
  } catch (error) {
    throw toMcpError(error)
  }
}
