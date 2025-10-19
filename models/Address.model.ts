import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
    user: string; // Ref to User's _id (UID)
    addressText: string;
    gps: {
        lat: number;
        lng: number;
    };
}

const addressSchema: Schema = new Schema(
    {
        user: { type: String, ref: 'User', required: true },
        addressText: { type: String, required: true },
        gps: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'addresses'
    }
);

export default mongoose.model<IAddress>('Address', addressSchema);
