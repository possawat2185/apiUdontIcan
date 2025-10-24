import { Request, Response } from 'express';
import Rider, { IRider } from '../models/Rider.model';
import mongoose from 'mongoose';

// --- สมัครสมาชิก Rider ใหม่ (Register Rider) ---
// POST /api/riders/register
export const createRider = async (
    req: Request,
    res: Response
): Promise<void> => {
    // 1. ดึงข้อมูล
    const { phone, password, name, licensePlate, profileImage, vehicleImage } = req.body;

    // 2. ตรวจสอบข้อมูลที่จำเป็น
    if (!phone || !password || !name || !licensePlate) {
        res.status(400).json({ message: "Phone, password, name, and licensePlate are required" });
        return;
    }

    try {
        // 3. เช็คว่ามีเบอร์โทรนี้ในระบบหรือยัง
        const riderExists = await Rider.findOne({ phone });
        if (riderExists) {
            res.status(400).json({ message: "Rider with this phone number already exists" });
            return;
        }

        // 4. สร้าง Rider ใหม่ (ID จะถูกสร้างโดย pre-save hook)
        // ในระบบจริง ควรเข้ารหัส password ก่อนบันทึก
        const newRider = new Rider({
            phone,
            password, // ควร hash ก่อนบันทึก
            name,
            licensePlate,
            profileImage: profileImage || '', // ใส่ค่า default
            vehicleImage: vehicleImage || '' // ใส่ค่า default
        });

        // 5. บันทึกและส่งข้อมูลที่สร้างเสร็จกลับไป
        const createdRider: IRider = await newRider.save();

        // ไม่ส่งรหัสผ่านกลับไปใน response
        const responseRider = createdRider.toObject();
        delete responseRider.password;

        res.status(201).json(responseRider);

    } catch (error: any) {
        // จัดการ Validation Error และ Error อื่นๆ
        if (error instanceof mongoose.Error.ValidationError) {
            res.status(400).json({ message: 'Validation Error', errors: error.errors });
        } else {
            res.status(500).json({ message: "Server error creating rider", error: error.message });
        }
    }
};

// --- Login สำหรับ Rider (แบบง่าย) ---
// POST /api/riders/login
export const loginRider = async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ message: 'Please provide both phone and password' });
        }
        const rider = await Rider.findOne({ phone }).select('+password');
        if (!rider || rider.password !== password) {
            return res.status(401).json({ message: 'Phone number or password incorrect' });
        }
        res.status(200).json({ message: 'Login successful', riderId: rider._id });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- GET: ดูข้อมูลไรเดอร์ทั้งหมด ---
// GET /api/riders
export const getRiders = async (req: Request, res: Response) => {
    try {
        const riders = await Rider.find();
        res.status(200).json(riders);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- GET: ดูข้อมูลไรเดอร์รายบุคคลด้วย ID ---
// GET /api/riders/:id
export const getRiderById = async (req: Request, res: Response) => {
    try {
        const rider = await Rider.findById(req.params.id);
        if (!rider) {
            return res.status(404).json({ message: 'Rider not found' });
        }
        res.status(200).json(rider);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- UPDATE: แก้ไขข้อมูลไรเดอร์ ---
// PUT /api/riders/:id
export const updateRider = async (req: Request, res: Response) => {
    try {
        const { name, licensePlate, status } = req.body;
        const rider = await Rider.findByIdAndUpdate(
            req.params.id,
            { name, licensePlate, status },
            { new: true } // { new: true } เพื่อให้ส่งข้อมูลที่อัปเดตแล้วกลับไป
        );

        if (!rider) {
            return res.status(404).json({ message: 'Rider not found' });
        }
        res.status(200).json({ message: 'Rider updated successfully', rider });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- DELETE: ลบข้อมูลไรเดอร์ ---
// DELETE /api/riders/:id
export const deleteRider = async (req: Request, res: Response) => {
    try {
        const rider = await Rider.findByIdAndDelete(req.params.id);
        if (!rider) {
            return res.status(404).json({ message: 'Rider not found' });
        }
        res.status(200).json({ message: 'Rider deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

