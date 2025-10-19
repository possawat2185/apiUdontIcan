import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
    _id: string;
    seq: number;
}

const counterSchema: Schema = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

// สร้าง model ชื่อ 'Counter' สำหรับ collection ชื่อ 'counters'
export default mongoose.model<ICounter>('Counter', counterSchema);