import { Request, Response } from 'express';
import Raider, { IRaider } from '../models/Raider.model';
import mongoose from 'mongoose';

// --- สมัครสมาชิก Raider ใหม่ (Register Raider) ---
// POST /api/raiders/register
export const createRaider = async (
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
        const raiderExists = await Raider.findOne({ phone });
        if (raiderExists) {
            res.status(400).json({ message: "Raider with this phone number already exists" });
            return;
        }

        // 4. สร้าง Raider ใหม่ (ID จะถูกสร้างโดย pre-save hook)
        // ในระบบจริง ควรเข้ารหัส password ก่อนบันทึก
        const newRaider = new Raider({
            phone,
            password, // ควร hash ก่อนบันทึก
            name,
            licensePlate,
            profileImage: profileImage || '', // ใส่ค่า default
            vehicleImage: vehicleImage || '' // ใส่ค่า default
        });

        // 5. บันทึกและส่งข้อมูลที่สร้างเสร็จกลับไป
        const createdRaider: IRaider = await newRaider.save();

        // ไม่ส่งรหัสผ่านกลับไปใน response
        const responseRaider = createdRaider.toObject();
        delete responseRaider.password;

        res.status(201).json(responseRaider);

    } catch (error: any) {
        // จัดการ Validation Error และ Error อื่นๆ
        if (error instanceof mongoose.Error.ValidationError) {
            res.status(400).json({ message: 'Validation Error', errors: error.errors });
        } else {
            res.status(500).json({ message: "Server error creating raider", error: error.message });
        }
    }
};

// --- Login สำหรับ Raider (แบบง่าย) ---
// POST /api/raiders/login
export const loginRaider = async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            return res.status(400).json({ message: 'Please provide both phone and password' });
        }
        const raider = await Raider.findOne({ phone }).select('+password');
        if (!raider || raider.password !== password) {
            return res.status(401).json({ message: 'Phone number or password incorrect' });
        }
        res.status(200).json({ message: 'Login successful', raiderId: raider._id });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- GET: ดูข้อมูลไรเดอร์ทั้งหมด ---
// GET /api/raiders
export const getRaiders = async (req: Request, res: Response) => {
    try {
        const raiders = await Raider.find();
        res.status(200).json(raiders);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- GET: ดูข้อมูลไรเดอร์รายบุคคลด้วย ID ---
// GET /api/raiders/:id
export const getRaiderById = async (req: Request, res: Response) => {
    try {
        const raider = await Raider.findById(req.params.id);
        if (!raider) {
            return res.status(404).json({ message: 'Raider not found' });
        }
        res.status(200).json(raider);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- UPDATE: แก้ไขข้อมูลไรเดอร์ ---
// PUT /api/raiders/:id
export const updateRaider = async (req: Request, res: Response) => {
    try {
        const { name, licensePlate, status } = req.body;
        const raider = await Raider.findByIdAndUpdate(
            req.params.id,
            { name, licensePlate, status },
            { new: true } // { new: true } เพื่อให้ส่งข้อมูลที่อัปเดตแล้วกลับไป
        );

        if (!raider) {
            return res.status(404).json({ message: 'Raider not found' });
        }
        res.status(200).json({ message: 'Raider updated successfully', raider });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

// --- DELETE: ลบข้อมูลไรเดอร์ ---
// DELETE /api/raiders/:id
export const deleteRaider = async (req: Request, res: Response) => {
    try {
        const raider = await Raider.findByIdAndDelete(req.params.id);
        if (!raider) {
            return res.status(404).json({ message: 'Raider not found' });
        }
        res.status(200).json({ message: 'Raider deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
};

