import { NextRequest, NextResponse } from 'next/server'
import { User } from '@/app/actions/schemas'
import { searchUsers } from '@/app/actions/actions'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in or sign up to continue.' },
      { status: 401 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const users: User[] = await searchUsers(query)

    if (users.length === 0) {
      return NextResponse.json({ message: 'No users found' }, { status: 404 })
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}