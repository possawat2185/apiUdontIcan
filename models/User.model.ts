import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter.model';

export interface IUser extends Document {
    _id: string;
    phone: string;
    password?: string;
    name: string;
    profileImage: string;
    // --- เปลี่ยนแปลงตรงนี้ ---
    addresses: mongoose.Schema.Types.ObjectId[]; // เก็บ ID ของที่อยู่ทั้งหมด
    // ---
    createdAt: Date;
    updatedAt: Date;
}

const userSchema: Schema = new Schema(
    {
        _id: { type: String },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            select: false,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        profileImage: {
            type: String,
            default: ''
        },
        // --- ลบ addressText และ gps เก่าออก ---
        
        // --- เพิ่ม Array นี้เพื่ออ้างอิง Address model ---
        addresses: [{
            type: mongoose.Schema.Types.ObjectId, // ใช้ ObjectId เริ่มต้นของ Mongoose
            ref: 'Address' // อ้างอิงไปยัง 'Address' model ใหม่
        }]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'users' // ระบุชื่อ collection ให้ชัดเจน
    }
);

// Mongoose Pre-save Hook สำหรับ 'User' (ยังทำงานเหมือนเดิม)
userSchema.pre<IUser>('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'userId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this._id = 'UID' + String(counter.seq).padStart(6, '0');
            next();
        } catch (error: any) {
            next(error);
        }
    } else {
        next();
    }
});

export default mongoose.model<IUser>('User', userSchema);
