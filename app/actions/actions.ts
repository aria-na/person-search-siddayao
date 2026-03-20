//app/actions/actions.ts

'use server'

import { revalidatePath } from 'next/cache'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { User, userFormSchema, userSchema } from './schemas'
import { prisma } from '@/lib/prisma'

const userSelect = {
    id: true,
    name: true,
    email: true,
    phoneNumber: true,
} as const

function toUserFacingError(error: unknown): Error {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        const fields = Array.isArray(error.meta?.target) ? error.meta.target : []

        if (fields.includes('phoneNumber')) {
            return new Error('Phone number already exists.')
        }

        if (fields.includes('email')) {
            return new Error('Email already exists.')
        }

        return new Error('A user with the same unique details already exists.')
    }

    return error instanceof Error ? error : new Error('Unexpected server error.')
}

export async function searchUsers(query: string): Promise<User[]> {
    const results = await prisma.user.findMany({
        where: {
            name: {
                startsWith: query,
            },
        },
        select: userSelect,
        orderBy: {
            name: 'asc',
        },
    })

    return results.map((user: unknown) => userSchema.parse(user))
}

export async function addUser(data: Omit<User, 'id'>): Promise<User> {
    try {
        const validatedData = userFormSchema.parse(data)

        const createdUser = await prisma.user.create({
            data: validatedData,
            select: userSelect,
        })

        revalidatePath('/')
        return userSchema.parse(createdUser)
    } catch (error) {
        throw toUserFacingError(error)
    }
}

export async function deleteUser(id: string): Promise<void> {
    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!existingUser) {
        throw new Error(`User with id ${id} not found`)
    }

    await prisma.user.delete({ where: { id } })
    revalidatePath('/')

}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { id },
            select: userSelect,
        })

        if (!existingUser) {
            throw new Error(`User with id ${id} not found`)
        }

        const updatedUser = { ...existingUser, ...data }
        const validatedUser = userSchema.parse(updatedUser)

        const savedUser = await prisma.user.update({
            where: { id },
            data: {
                name: validatedUser.name,
                email: validatedUser.email,
                phoneNumber: validatedUser.phoneNumber,
            },
            select: userSelect,
        })

        revalidatePath('/')

        return userSchema.parse(savedUser)
    } catch (error) {
        throw toUserFacingError(error)
    }
}

export async function getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
        where: { id },
        select: userSelect,
    })

    return user ? userSchema.parse(user) : null
}
