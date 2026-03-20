//app/actions/actions.ts

'use server'

import { revalidatePath } from 'next/cache'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { User, userFormSchema, userSchema } from './schemas'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

const userSelect = {
    id: true,
    name: true,
    email: true,
    phoneNumber: true,
} as const

// Fallback store for environments where SQLite is unavailable (e.g. read-only serverless filesystems).
const fallbackUsers: User[] = [
    { id: 'u-1', name: 'John Doe', email: 'john@example.com', phoneNumber: '0412345678' },
    { id: 'u-2', name: 'Jane Smith', email: 'jane@example.com', phoneNumber: '0423456789' },
    { id: 'u-3', name: 'Alice Johnson', email: 'alice@example.com', phoneNumber: '0434567890' },
    { id: 'u-4', name: 'Bob Williams', email: 'bob@example.com', phoneNumber: '0445678901' },
    { id: 'u-5', name: 'Mikael Estillore', email: 'mikael@example.com', phoneNumber: '0491234567' },
]

function isDatabaseUnavailableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false
    }

    const message = error.message.toLowerCase()
    return (
        message.includes('no such table') ||
        message.includes('unable to open database file') ||
        message.includes('readonly database') ||
        message.includes('error querying the database') ||
        message.includes('database')
    )
}

function getFallbackMatches(query: string): User[] {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
        return []
    }

    return fallbackUsers
        .filter((user) => user.name.toLowerCase().startsWith(normalized))
        .sort((a, b) => a.name.localeCompare(b.name))
}

function ensureFallbackUnique(data: { email: string; phoneNumber: string }, excludeId?: string): void {
    const emailTaken = fallbackUsers.some((user) => user.email === data.email && user.id !== excludeId)
    if (emailTaken) {
        throw new Error('Email already exists.')
    }

    const phoneTaken = fallbackUsers.some((user) => user.phoneNumber === data.phoneNumber && user.id !== excludeId)
    if (phoneTaken) {
        throw new Error('Phone number already exists.')
    }
}

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
    try {
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
    } catch (error) {
        if (isDatabaseUnavailableError(error)) {
            return getFallbackMatches(query)
        }

        throw toUserFacingError(error)
    }
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
        if (isDatabaseUnavailableError(error)) {
            const validatedData = userFormSchema.parse(data)
            ensureFallbackUnique(validatedData)

            const newUser: User = {
                id: randomUUID(),
                ...validatedData,
            }

            fallbackUsers.push(newUser)
            revalidatePath('/')
            return newUser
        }

        throw toUserFacingError(error)
    }
}

export async function deleteUser(id: string): Promise<void> {
    try {
        const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } })
        if (!existingUser) {
            throw new Error(`User with id ${id} not found`)
        }

        await prisma.user.delete({ where: { id } })
        revalidatePath('/')
    } catch (error) {
        if (isDatabaseUnavailableError(error)) {
            const index = fallbackUsers.findIndex((user) => user.id === id)
            if (index === -1) {
                throw new Error(`User with id ${id} not found`)
            }

            fallbackUsers.splice(index, 1)
            revalidatePath('/')
            return
        }

        throw toUserFacingError(error)
    }

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
        if (isDatabaseUnavailableError(error)) {
            const index = fallbackUsers.findIndex((user) => user.id === id)
            if (index === -1) {
                throw new Error(`User with id ${id} not found`)
            }

            const merged = { ...fallbackUsers[index], ...data }
            const validatedUser = userSchema.parse(merged)
            ensureFallbackUnique(validatedUser, id)

            fallbackUsers[index] = validatedUser
            revalidatePath('/')
            return validatedUser
        }

        throw toUserFacingError(error)
    }
}

export async function getUserById(id: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: userSelect,
        })

        return user ? userSchema.parse(user) : null
    } catch (error) {
        if (isDatabaseUnavailableError(error)) {
            return fallbackUsers.find((user) => user.id === id) ?? null
        }

        throw toUserFacingError(error)
    }
}
