import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await db.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, color, icon } = body as {
      name: string
      color?: string
      icon?: string
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        color: color || '#6366f1',
        icon,
        userId: session.user.id,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
