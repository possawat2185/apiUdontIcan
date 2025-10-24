import { Request, Response } from 'express';
import mongoose from 'mongoose';
import DeliveryJob, { DeliveryStatus, IDeliveryJob } from '../models/DeliveryJob.model'; // อัปเดต import
import Rider from '../models/Rider.model';
import User from '../models/User.model';
import Address, { IAddress } from '../models/Address.model';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // รัศมีของโลก หน่วยเป็นกิโลเมตร
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // ระยะทาง หน่วยเป็นกิโลเมตร
    return distance;
}


// --- สร้างงานส่งของใหม่ ---
// POST /api/delivery-jobs
export const createJob = async (req: Request, res: Response): Promise<void> => {
    // ในระบบจริง sender ควรดึงมาจาก JWT Token
    // เปลี่ยนไปรับ ID ของที่อยู่ต้นทาง-ปลายทาง
    const { sender, receiverPhone, pickupAddressId, dropoffAddressId, pickupImage, itemName } = req.body;

    if (!sender || !receiverPhone || !pickupAddressId || !dropoffAddressId || !itemName) {
        res.status(400).json({ message: "Missing required fields: sender, receiverPhone, pickupAddressId, dropoffAddressId, itemName" });
        return;
    }

    try {
        // ตรวจสอบว่ามี User และ Address อยู่จริง
        // ใช้ Type Assertion เพื่อบอก TypeScript ว่าผลลัพธ์จะเป็น IAddress (ถ้าไม่ null)
        const senderUser = await User.findById(sender);
        const pickupAddress = await Address.findById(pickupAddressId) as IAddress | null;
        const dropoffAddress = await Address.findById(dropoffAddressId) as IAddress | null;
        // ค้นหา Receiver User (ถ้ามี)
        const receiverUser = await User.findOne({ phone: receiverPhone });

        // --- เพิ่มการตรวจสอบตรงนี้ ---
        if (!receiverUser) {
            res.status(403).json({ message: "ไม่มีผู้ใช้เบอร์นี้ในระบบ" }); // ส่ง 403 ถ้าหา receiver ไม่เจอ
            return;
        }
        // --- สิ้นสุดการตรวจสอบ ---

        if (!senderUser || !pickupAddress || !dropoffAddress) {
            // ปรับปรุงข้อความ Error ให้ชัดเจนขึ้น
            let notFound = [];
            if (!senderUser) notFound.push("Sender");
            if (!pickupAddress) notFound.push("Pickup Address");
            if (!dropoffAddress) notFound.push("Dropoff Address");
            res.status(404).json({ message: `${notFound.join(', ')} not found` });
            return;
        }

        // ตรวจสอบว่าที่อยู่ต้นทางเป็นของผู้ส่งจริง
        if (pickupAddress.user.toString() !== sender) {
             res.status(403).json({ message: "Pickup address does not belong to the sender" });
             return;
        }
        // ตรวจสอบว่าที่อยู่ปลายทางเป็นของผู้รับ (ถ้าผู้รับมีบัญชี)
        if (dropoffAddress.user.toString() !== receiverUser._id.toString()) {
            res.status(403).json({ message: "Dropoff address does not belong to the receiver" });
             return;
        }

        // --- คำนวณระยะทาง ---
        const distanceKm = calculateDistance(
            pickupAddress.gps.lat,
            pickupAddress.gps.lng,
            dropoffAddress.gps.lat,
            dropoffAddress.gps.lng
        );
        // ---

        const newJob = new DeliveryJob({
            sender,
            receiverPhone,
            receiver: receiverUser._id, // เก็บ ID ถ้าเจอ User (ตอนนี้จะเจอเสมอ)
            pickupAddressId: pickupAddressId,
            dropoffAddressId: dropoffAddressId,
            status: DeliveryStatus.PENDING,
            pickupImage: pickupImage || '',
            itemName: itemName,
            distance: distanceKm // <-- บันทึกระยะทาง
        });

        const savedJob: IDeliveryJob = await newJob.save();
        // Populate ข้อมูลก่อนส่งกลับเพื่อให้ Frontend ใช้งานได้ทันที
        const populatedJob = await DeliveryJob.findById(savedJob._id)
            .populate('sender', 'name profileImage')
            .populate('pickupAddressId')
            .populate('dropoffAddressId');

        res.status(201).json(populatedJob);

    } catch (error: any) {
        // จัดการ CastError สำหรับ ID ต่างๆ
        if (error instanceof mongoose.Error.CastError) {
             res.status(400).json({ message: `Invalid ID format for ${error.path}` });
        } else if (error instanceof mongoose.Error.ValidationError) {
             res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        else {
             res.status(500).json({ message: "Server error creating job", error: error.message });
        }
    }
};

// --- ไรเดอร์ดึงรายการงานที่ว่างอยู่ ---
// GET /api/delivery-jobs/available
export const getAvailableJobs = async (req: Request, res: Response): Promise<void> => {
    try {
        const availableJobs = await DeliveryJob.find({ status: DeliveryStatus.PENDING }) // <-- ใช้ Enum
            .populate('sender', 'name profileImage')
            .sort({ createdAt: -1 });

        res.status(200).json(availableJobs);
    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- ไรเดอร์กดรับงาน ---
// PUT /api/delivery-jobs/:jobId/accept
export const acceptJob = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const { riderId } = req.body; // ในระบบจริงควรดึงมาจาก JWT Token

    if (!riderId) {
        res.status(400).json({ message: "Rider ID is required" });
        return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const job = await DeliveryJob.findOneAndUpdate(
            { _id: jobId, status: DeliveryStatus.PENDING }, // <-- ใช้ Enum
            { $set: { status: DeliveryStatus.ACCEPTED, rider: riderId } }, // <-- เปลี่ยนเป็น rider และใช้ Enum
            { new: true, session }
        );

        if (!job) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ message: "Job not found or already taken" });
            return;
        }

        await Rider.findByIdAndUpdate(riderId,
            { $set: { status: 'on_job', currentJobId: jobId } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: "Job accepted successfully", job });

    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: "Server error during transaction", error: error.message });
    }
};

// --- ไรเดอร์อัปเดตสถานะงาน ---
// PUT /api/delivery-jobs/:jobId/status
export const updateJobStatus = async (req: Request, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const { newStatus, imageUrl, riderId } = req.body; // riderId ควรมาจาก Token

    try {
        const job: IDeliveryJob | null = await DeliveryJob.findById(jobId);
        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }

        if (job.rider?.toString() !== riderId) { // <-- เปลี่ยนเป็น rider
             res.status(403).json({ message: "Forbidden: You are not assigned to this job" });
             return;
        }

        job.status = newStatus;
        if (newStatus === DeliveryStatus.IN_TRANSIT && imageUrl) {
            job.inTransitImage = imageUrl; // <-- เปลี่ยนชื่อฟิลด์
        }
        if (newStatus === DeliveryStatus.DELIVERED && imageUrl) {
            job.deliveredImage = imageUrl; // <-- เปลี่ยนชื่อฟิลด์
            await Rider.findByIdAndUpdate(riderId, { $set: { status: 'available', currentJobId: undefined } });
        }

        const updatedJob = await job.save();
        res.status(200).json({ message: "Status updated successfully", job: updatedJob });

    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// --- ดูรายละเอียดงาน ---
// GET /api/delivery-jobs/:jobId
export const getJobDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobId } = req.params;
        const job = await DeliveryJob.findById(jobId)
            .populate('sender', 'name phone profileImage')
            .populate('receiver', 'name phone profileImage')
            .populate('rider', 'name phone licensePlate profileImage vehicleImage'); // <-- เปลี่ยนเป็น rider

        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }
        res.status(200).json(job);
    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- ดึงรายการส่งของทั้งหมดของผู้ส่ง ---
// GET /api/delivery-jobs/sender/:userId
export const getSenderJobs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const jobs = await DeliveryJob.find({ sender: userId })
            .populate('receiver', 'name profileImage') // ดึงข้อมูลผู้รับ (ถ้ามี)
            .populate('rider', 'name profileImage') // ดึงข้อมูลไรเดอร์ (ถ้ามี)
            .populate('pickupAddressId') // ดึงข้อมูลที่อยู่ต้นทาง
            .populate('dropoffAddressId') // ดึงข้อมูลที่อยู่ปลายทาง
            .sort({ createdAt: -1 }); // เรียงจากใหม่สุด

        res.status(200).json(jobs);

    } catch (error: any) {
        if (error instanceof mongoose.Error.CastError) {
             res.status(400).json({ message: 'Invalid User ID format' });
        } else {
             res.status(500).json({ message: "Server error fetching sender jobs", error: error.message });
        }
    }
};