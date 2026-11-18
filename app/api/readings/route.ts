import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Reading from '@/lib/models/Reading'

// GET /api/readings  → return recent readings
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const limit = Number(req.nextUrl.searchParams.get('limit') || 50)

    const readings = await Reading.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({ success: true, data: readings })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch readings' },
      { status: 500 }
    )
  }
}

// POST /api/readings  → save new reading (from ESP32 or Gateway)
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()

    const reading = await Reading.create({
      nodeId: body.node || body.nodeId || 1,
      soil: body.soil,
      vibration: body.vib ?? body.vibration ?? 0,
      vibScore: body.vib_score ?? body.vibScore,
      soilAlert: Boolean(body.soil_alert ?? body.soilAlert),
      vibAlert: Boolean(body.vib_alert ?? body.vibAlert),
      status: body.status ?? 0,
    })

    return NextResponse.json({ success: true, data: reading }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, message: 'Failed to save reading' },
      { status: 500 }
    )
  }
}