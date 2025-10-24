import mongoose, { Schema, Document } from 'mongoose';
import Counter from './Counter.model';

// Enum สำหรับสถานะของสินค้า (เหมือนเดิม)
export enum DeliveryStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    IN_TRANSIT = 'in_transit',
    DELIVERED = 'delivered',
}

// Interface สำหรับงานส่งของ
export interface IDeliveryJob extends Document {
    _id: string; // JOB000001
    sender: string; // Ref to User's _id (UID)
    receiverPhone: string; // เก็บเบอร์โทรไว้ค้นหา/แจ้งเตือน
    receiver?: string; // Ref to User's _id (UID), optional
    rider?: string; // Ref to Rider's _id (RID), optional
    pickupAddressId: mongoose.Schema.Types.ObjectId; // Ref to Address's _id
    dropoffAddressId: mongoose.Schema.Types.ObjectId; // Ref to Address's _id
    status: DeliveryStatus;
    itemName: string;
    pickupImage?: string;
    inTransitImage?: string;
    deliveredImage?: string;
    distance?: number; // <-- เพิ่มฟิลด์ distance (ระยะทาง)
    createdAt: Date;
    updatedAt: Date;
}

const deliveryJobSchema: Schema = new Schema(
    {
        _id: { type: String },
        sender: { type: String, ref: 'User', required: true },
        receiverPhone: { type: String, required: true },
        receiver: { type: String, ref: 'User' },
        rider: { type: String, ref: 'Rider', default: null },
        pickupAddressId: {
            type: Schema.Types.ObjectId,
            ref: 'Address',
            required: true
        },
        dropoffAddressId: {
            type: Schema.Types.ObjectId,
            ref: 'Address',
            required: true
        },
        status: {
            type: String,
            enum: Object.values(DeliveryStatus),
            default: DeliveryStatus.PENDING,
        },
        itemName: { type: String, required: true },
        pickupImage: { type: String, default: '' },
        inTransitImage: { type: String, default: '' },
        deliveredImage: { type: String, default: '' },
        distance: { type: Number, default: 0.0 } // <-- เพิ่มฟิลด์ distance ใน Schema
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'delivery_jobs'
    }
);

// Pre-save Hook สำหรับสร้าง Job ID (เหมือนเดิม)
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