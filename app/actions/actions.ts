//app/actions/actions.ts

'use server'

import { revalidatePath } from 'next/cache'
import { User, userFormSchema, userSchema } from './schemas'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { auth } from '@clerk/nextjs/server'

const userSelect = {
    id: true,
    name: true,
    email: true,
    phoneNumber: true,
} as const

// Fallback store for environments where SQLite is unavailable (e.g. read-only serverless filesystems).
const fallbackUsers: User[] = [
    { id: 'u-1', name: 'John Doe', email: 'john@example.com', phoneNumber: '09171234567' },
    { id: 'u-2', name: 'Jane Smith', email: 'jane@example.com', phoneNumber: '09181234567' },
    { id: 'u-3', name: 'Alice Johnson', email: 'alice@example.com', phoneNumber: '09191234567' },
    { id: 'u-4', name: 'Bob Williams', email: 'bob@example.com', phoneNumber: '09201234567' },
    { id: 'u-5', name: 'Mikael Estillore', email: 'mikael@example.com', phoneNumber: '09211234567' },
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

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message.toLowerCase() : ''
}

function getUniqueConstraintFields(error: unknown): string[] {
    const fields = new Set<string>()

    if (typeof error === 'object' && error !== null && 'meta' in error) {
        const meta = (error as { meta?: { target?: unknown } }).meta
        const target = meta?.target

        if (Array.isArray(target)) {
            for (const field of target) {
                if (typeof field === 'string') {
                    fields.add(field)
                }
            }
        }

        if (typeof target === 'string') {
            fields.add(target)
        }
    }

    const message = getErrorMessage(error)
    if (message.includes('email')) {
        fields.add('email')
    }
    if (message.includes('phonenumber') || message.includes('phone number')) {
        fields.add('phoneNumber')
    }

    return Array.from(fields)
}

function isUniqueConstraintError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = (error as { code?: unknown }).code
        if (code === 'P2002') {
            return true
        }
    }

    const message = getErrorMessage(error)
    return message.includes('unique constraint failed') || message.includes('on the fields')
}

function toUserFacingError(error: unknown): Error {
    if (isUniqueConstraintError(error)) {
        const fields = getUniqueConstraintFields(error)

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

async function assertAuthenticated(): Promise<void> {
    const { userId } = await auth()

    if (!userId) {
        throw new Error('Authentication required. Please sign in or sign up to continue.')
    }
}

function parseUserSafely(user: unknown, context: string): User | null {
    const parsed = userSchema.safeParse(user)
    if (!parsed.success) {
        console.warn(`[actions] Skipping invalid user in ${context}:`, parsed.error.flatten().fieldErrors)
        return null
    }

    return parsed.data
}

export async function searchUsers(query: string): Promise<User[]> {
    try {
        await assertAuthenticated()

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

        return results
            .map((user: unknown) => parseUserSafely(user, 'searchUsers'))
            .filter((user): user is User => user !== null)
    } catch (error) {
        if (isDatabaseUnavailableError(error)) {
            return getFallbackMatches(query)
        }

        throw toUserFacingError(error)
    }
}

export async function addUser(data: Omit<User, 'id'>): Promise<User> {
    try {
        await assertAuthenticated()

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
        await assertAuthenticated()

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
        await assertAuthenticated()

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

        if (!user) {
            return null
        }

        return parseUserSafely(user, 'getUserById')
    } catch (error) {
        if (isDatabaseUnavailableError(error)) {
            return fallbackUsers.find((user) => user.id === id) ?? null
        }

        throw toUserFacingError(error)
    }
}
