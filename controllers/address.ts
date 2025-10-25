import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Address from '../models/Address.model';
import User from '../models/User.model';

// --- สร้างที่อยู่ใหม่และเชื่อมกับ User ---
// POST /api/addresses
export const createAddress = async (req: Request, res: Response): Promise<void> => {
    // userId ควรดึงมาจาก Token หรือ Body ตามการออกแบบ Frontend
    const { userId, addressText, gps } = req.body;

    // ตรวจสอบ Input
    if (!userId || !addressText || !gps || !gps.lat || !gps.lng) {
        res.status(400).json({ message: "userId, addressText, and gps {lat, lng} are required" });
        return;
    }

    // ใช้ Transaction เพื่อความปลอดภัย
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Step 1: ตรวจสอบว่า User มีอยู่จริง
        const user = await User.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Step 2: สร้าง Address ใหม่
        const newAddress = new Address({
            user: userId,
            addressText,
            gps,
        });
        // ใช้ Array destructuring เพื่อเอา Address แรกที่ save สำเร็จ (แม้จะมีแค่ตัวเดียว)
        const savedAddress = await newAddress.save({ session });

        // Step 3: อัปเดต User โดยเพิ่ม ID ของ Address ใหม่เข้าไปใน Array addresses
        // ใช้ findByIdAndUpdate เพื่อความแน่นอน
        await User.findByIdAndUpdate(
            userId,
            { $push: { addresses: savedAddress._id } }, // $push ใช้เพิ่ม element เข้า Array
            { session, new: true } // new: true ไม่จำเป็นในกรณีนี้ แต่ใส่ไว้ได้
        );

        // ถ้าทุกอย่างสำเร็จ
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: "Address created and linked successfully", address: savedAddress });

    } catch (error: any) {
        // ถ้ามีข้อผิดพลาด ให้ยกเลิกทั้งหมด
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: "Server error during address creation", error: error.message });
    }
};



// --- ดึงที่อยู่ทั้งหมดของ User คนเดียว ---
// GET /api/addresses/user/:userId
export const getUserAddresses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        
        // ค้นหา Address ทั้งหมดที่ field 'user' ตรงกับ userId ที่ส่งมา
        const addresses = await Address.find({ user: userId });
        
        // Mongoose find() จะคืนค่า Array ว่าง ถ้าไม่เจอ ไม่คืน null
        if (!addresses || addresses.length === 0) {
            // ส่ง Array ว่างกลับไปก็ได้ หรือจะส่ง 404 ก็ได้ แล้วแต่การตกลงกับ Frontend
            res.status(200).json([]); // ส่ง Array ว่างกลับไป
            // res.status(404).json({ message: "No addresses found for this user" });
            return;
        }

        res.status(200).json(addresses);
    } catch (error: any) {
        res.status(500).json({ message: "Server error fetching addresses", error: error.message });
    }
};

// --- ดึงที่อยู่เดียวด้วย Address ID ---
// GET /api/addresses/:addressId
export const getAddressById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { addressId } = req.params;

        // --- เพิ่มการตรวจสอบ addressId ---
        if (!addressId) {
            res.status(400).json({ message: "Address ID is required in the URL parameters" });
            return;
        }

        // ตรวจสอบ Format ของ ObjectId ก่อน Query
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            res.status(400).json({ message: "Invalid Address ID format" });
            return;
        }

        const address = await Address.findById(addressId).populate('user', 'name phone'); // Populate ข้อมูล User บางส่วน

        if (!address) {
            res.status(404).json({ message: "Address not found" });
            return;
        }

        res.status(200).json(address);

    } catch (error: any) {
        // CastError ไม่ควรเกิดขึ้นแล้วเพราะเช็ค isValid ก่อนหน้า แต่ใส่ไว้เผื่อ
         if (error instanceof mongoose.Error.CastError) {
             // This case might be redundant now due to the isValid check above, but kept for safety.
             res.status(400).json({ message: 'Invalid Address ID format' });
        } else {
             res.status(500).json({ message: "Server error fetching address", error: error.message });
        }
    }
};