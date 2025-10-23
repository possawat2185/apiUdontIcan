import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
    // _id จะเป็น ObjectId อัตโนมัติ
    user: string; // ID ของ User ที่เป็นเจ้าของ (เช่น 'UID000001')
    addressText: string;
    gps: {
        lat: number;
        lng: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const addressSchema: Schema = new Schema(
    {
        user: { 
            type: String, 
            ref: 'User', // เชื่อมโยงกับ User model
            required: true 
        },
        addressText: { 
            type: String, 
            required: true 
        },
        gps: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'addresses' // ระบุชื่อ collection ให้ชัดเจน
    }
);

export default mongoose.model<IAddress>('Address', addressSchema);
