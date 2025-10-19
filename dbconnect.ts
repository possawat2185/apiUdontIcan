// dbconnect.ts
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // โค้ดส่วนนี้คือส่วนที่มองหา MONGO_URI
        if (!process.env.MONGO_URI) {
            console.error('MongoDB URI is not defined in .env file');
            process.exit(1);
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;

