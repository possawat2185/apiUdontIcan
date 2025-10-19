import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter.model';

export interface IUser extends Document {
    _id: string;
    phone: string;
    password?: string;
    name: string;
    profileImage?: string;
    addressText?: string;
    gps?: {
        lat: number;
        lng: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const userSchema: Schema = new Schema(
    {
        _id: {
            type: String,
        },
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
        addressText: {
            type: String,
            default: ''
        },
        gps: {
            lat: { type: Number },
            lng: { type: Number },
        },
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Mongoose Pre-save Hook สำหรับ 'User'
userSchema.pre<IUser>('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'userId' }, // ใช้ counter 'userId'
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            const formattedId = 'UID' + String(counter.seq).padStart(6, '0');
            this._id = formattedId;
            next();
        } catch (error: any) {
            next(error);
        }
    } else {
        next();
    }
});


export default mongoose.model<IUser>('User', userSchema);

