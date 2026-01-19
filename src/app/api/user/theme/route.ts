import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { db } from '@/lib/db'
import { isValidThemeId } from '@/lib/themes'
import type { ThemeId } from '@/types/theme'

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { themeId: true },
    })

    return NextResponse.json({ themeId: user?.themeId ?? 'default' })
  } catch (error) {
    console.error('Failed to fetch theme:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { themeId } = body as { themeId?: string }

    if (!themeId || !isValidThemeId(themeId)) {
      return NextResponse.json(
        { error: 'Invalid theme ID' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { themeId: themeId as ThemeId },
      select: { themeId: true },
    })

    return NextResponse.json({ themeId: user.themeId })
  } catch (error) {
    console.error('Failed to update theme:', error)
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    )
  }
}
