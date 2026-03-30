import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { userFormSchema } from '@/app/actions/schemas'
import { prisma } from '@/lib/prisma'
import { checkApiAccess, unauthorizedResponse } from '@/lib/api-access'

const userSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
} as const

const updateSchema = userFormSchema
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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await checkApiAccess(request)
  if (!access.ok) {
    return unauthorizedResponse(access.message)
  }

  const { id } = await context.params

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    })

    if (!user) {
      return NextResponse.json({ error: `User with id ${id} not found` }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error reading user by id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await checkApiAccess(request)
  if (!access.ok) {
    return unauthorizedResponse(access.message)
  }

  const { id } = await context.params

  try {
    const body = await request.json()
    const validated = updateSchema.parse(body)

    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!existingUser) {
      return NextResponse.json({ error: `User with id ${id} not found` }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validated,
      select: userSelect,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    if (isUniqueError(error)) {
      return NextResponse.json({ error: getUniqueErrorMessage(error) }, { status: 409 })
    }

    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const access = await checkApiAccess(request)
  if (!access.ok) {
    return unauthorizedResponse(access.message)
  }

  const { id } = await context.params

  try {
    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!existingUser) {
      return NextResponse.json({ error: `User with id ${id} not found` }, { status: 404 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
