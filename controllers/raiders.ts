import { Request, Response } from 'express';
import Raider from '../models/Raider.model';

// --- สมัครสมาชิก Raider ใหม่ (Register Raider) ---
// POST /api/raiders/register
export const registerRaider = async (req: Request, res: Response) => {
    try {
        const { phone, password, name, licensePlate } = req.body;

        if (!phone || !password || !name || !licensePlate) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }
        const raiderExists = await Raider.findOne({ phone });
        if (raiderExists) {
            return res.status(400).json({ message: 'This phone number is already registered' });
        }
        const newRaider = new Raider({ phone, password, name, licensePlate });
        await newRaider.save();

        const raiderResponse = newRaider.toObject();
        delete raiderResponse.password;
        res.status(201).json({ message: 'Raider registered successfully', raider: raiderResponse });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
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

