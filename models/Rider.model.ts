import mongoose, { Document, Schema } from 'mongoose';
import Counter from './Counter.model'; // 1. Import Counter model โดยตรง

// --- Rider Interface for TypeScript ---
export interface IRider extends Document {
    _id: string;
    phone: string;
    password?: string;
    name: string;
    profileImage: string;
    vehicleImage: string;
    licensePlate: string;
    status: 'available' | 'on_job';
    currentLocation?: {
        type: 'Point';
        coordinates: [number, number];
    };
    currentJobId?: mongoose.Schema.Types.ObjectId;
    createdAt: Date; // Mongoose จะสร้างให้จาก timestamps
    updatedAt: Date; // Mongoose จะสร้างให้จาก timestamps
}

// --- Mongoose Schema ---
const RiderSchema: Schema = new Schema({
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
        default: '',
    },
    vehicleImage: {
        type: String,
        default: '',
    },
    licensePlate: {
        type: String,
        required: [true, 'License plate is required'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['available', 'on_job'],
        default: 'available',
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    currentJobId: {
        type: String,
        ref: 'DeliveryJob',
        default: null,
    },
}, {
    timestamps: true, // 2. ใช้ timestamps ของ Mongoose
    versionKey: false
});

// สร้าง Index สำหรับ Geospatial queries
RiderSchema.index({ currentLocation: '2dsphere' });

// 3. อัปเดต Middleware ให้ใช้ findByIdAndUpdate เพื่อความปลอดภัย
RiderSchema.pre<IRider>('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'raiderId' }, // ใช้ counter 'raiderId'
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            this._id = `RID${counter.seq.toString().padStart(6, '0')}`;
            next();
        } catch (error: any) {
            next(error);
        }
    } else {
        next();
    }
});

export default mongoose.model<IRider>('Rider', RiderSchema);