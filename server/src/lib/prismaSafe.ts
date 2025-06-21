import { Prisma } from '@prisma/client'

const userFriendlyMessages: Record<string, string> = {
    P2000: 'One of the inputs is too long. Please shorten it.',
    P2002: 'This information is already in use. Please try something different.',
    P2003: 'Something went wrong linking related data. Please contact support.',
    P2004: 'The action failed due to a system constraint. Please try again.',
    P2011: 'A required field was missing. Please check your input.',
    P2025: 'The item you are trying to access does not exist.',
}

export async function prismaSafe<T>(promise: Promise<T>): Promise<[string | null, T | null]> {
    try {
        const data = await promise
        return [null, data]
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const message = userFriendlyMessages[error.code] || 'An error occurred while saving your data. Please try again.'
            return [message, null]
        }

        return ['Something went wrong. Please try again later.', null]
    }
}
