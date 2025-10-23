import { Router } from 'express';
import { createAddress, getUserAddresses } from '../controllers/address';

export const router = Router();

// Endpoint สำหรับสร้างที่อยู่ใหม่
// POST /api/addresses
router.post('/', createAddress);

// Endpoint สำหรับดึงที่อยู่ทั้งหมดของ User โดยใช้ User ID
// GET /api/addresses/user/:userId
router.get('/user/:userId', getUserAddresses);

// --- สามารถเพิ่ม Endpoints อื่นๆ ที่นี่ได้ ---
// เช่น GET /api/addresses/:addressId (ดึงที่อยู่เดียว)
//     PUT /api/addresses/:addressId (แก้ไขที่อยู่)
//     DELETE /api/addresses/:addressId (ลบที่อยู่ - ต้องอัปเดต User.addresses ด้วย)