import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter.model';

// Enum สำหรับสถานะของสินค้า
export enum DeliveryStatus {
    PENDING = 'pending', // [1] รอไรเดอร์มารับสินค้า
    ACCEPTED = 'accepted', // [2] ไรเดอร์รับงาน
    IN_TRANSIT = 'in_transit', // [3] ไรเดอร์รับสินค้าแล้ว
    DELIVERED = 'delivered', // [4] นำส่งสินค้าแล้ว
}

// Interface สำหรับข้อมูลที่อยู่
interface IAddressInfo {
    addressText: string;
    gps: {
        lat: number;
        lng: number;
    };
}

// Interface สำหรับงานส่งของ
export interface IDeliveryJob extends Document {
    _id: string; // JOB000001
    sender: string; // Ref to User's _id (UID)
    receiverPhone: string;
    receiver?: string; // Ref to User's _id (UID), optional
    rider?: string; // Ref to Raider's _id (RID), optional
    pickupAddress: IAddressInfo;
    dropoffAddress: IAddressInfo;
    status: DeliveryStatus;
    pickupImage?: string; // รูปตอนสถานะ [1]
    inTransitImage?: string; // รูปตอนสถานะ [3]
    deliveredImage?: string; // รูปตอนสถานะ [4]
    createdAt: Date;
    updatedAt: Date;
}

const deliveryJobSchema: Schema = new Schema(
    {
        _id: { type: String },
        sender: { type: String, ref: 'User', required: true },
        receiverPhone: { type: String, required: true },
        receiver: { type: String, ref: 'User' },
        rider: { type: String, ref: 'Raider', default: null },
        pickupAddress: {
            addressText: { type: String, required: true },
            gps: {
                lat: { type: Number, required: true },
                lng: { type: Number, required: true },
            },
        },
        dropoffAddress: {
            addressText: { type: String, required: true },
            gps: {
                lat: { type: Number, required: true },
                lng: { type: Number, required: true },
            },
        },
        status: {
            type: String,
            enum: Object.values(DeliveryStatus),
            default: DeliveryStatus.PENDING,
        },
        pickupImage: { type: String },
        inTransitImage: { type: String },
        deliveredImage: { type: String },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'delivery_jobs'
    }
);

// Pre-save Hook สำหรับสร้าง Job ID
deliveryJobSchema.pre<IDeliveryJob>('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'deliveryJobId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this._id = 'JOB' + String(counter.seq).padStart(6, '0');
            next();
        } catch (error: any) {
            next(error);
        }
    } else {
        next();
    }
});

export default mongoose.model<IDeliveryJob>('DeliveryJob', deliveryJobSchema);
