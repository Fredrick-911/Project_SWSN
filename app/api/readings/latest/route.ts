import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Reading from '@/lib/models/Reading'

export async function GET() {
  try {
    await dbConnect()

    const latest = await Reading.findOne().sort({ createdAt: -1 }).lean()

    if (!latest) {
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({ success: true, data: latest })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch latest reading' },
      { status: 500 }
    )
  }
}