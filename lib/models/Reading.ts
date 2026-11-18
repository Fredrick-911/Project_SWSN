import mongoose, { Schema, models, model } from 'mongoose'

export interface IReading {
  nodeId: number
  soil: number
  vibration: number          // 0 or 1
  vibScore?: number
  soilAlert: boolean
  vibAlert: boolean
  status: number             // 0 = Normal, 1 = Alert
  createdAt?: Date
}

const ReadingSchema = new Schema<IReading>(
  {
    nodeId: { type: Number, required: true, default: 1 },
    soil: { type: Number, required: true },
    vibration: { type: Number, required: true },
    vibScore: { type: Number },
    soilAlert: { type: Boolean, default: false },
    vibAlert: { type: Boolean, default: false },
    status: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

const Reading = models.Reading || model<IReading>('Reading', ReadingSchema)

export default Reading