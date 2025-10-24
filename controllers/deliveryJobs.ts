import { Request, Response } from 'express';
import mongoose from 'mongoose';
import DeliveryJob, { DeliveryStatus, IDeliveryJob } from '../models/DeliveryJob.model'; // อัปเดต import
import Raider from '../models/Raider.model';

// --- สร้างงานส่งของใหม่ ---
// POST /api/delivery-jobs
export const createJob = async (req: Request, res: Response): Promise<void> => {
    // ในระบบจริง sender ควรดึงมาจาก JWT Token
    const { sender, receiverPhone, pickupAddress, dropoffAddress } = req.body;

    if (!sender || !receiverPhone || !pickupAddress || !dropoffAddress) {
        res.status(400).json({ message: "Missing required fields" });
        return;
    }

    try {
        const newJob = new DeliveryJob({
            sender,
            receiverPhone,
            pickupAddress,
            dropoffAddress,
            status: DeliveryStatus.PENDING, // <-- ใช้ Enum
        });

        const savedJob: IDeliveryJob = await newJob.save();
        res.status(201).json(savedJob);

    } catch (error: any) {
        res.status(500).json({ message: "Server error", error: error.message });
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
    const { raiderId } = req.body; // ในระบบจริงควรดึงมาจาก JWT Token

    if (!raiderId) {
        res.status(400).json({ message: "Raider ID is required" });
        return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const job = await DeliveryJob.findOneAndUpdate(
            { _id: jobId, status: DeliveryStatus.PENDING }, // <-- ใช้ Enum
            { $set: { status: DeliveryStatus.ACCEPTED, rider: raiderId } }, // <-- เปลี่ยนเป็น rider และใช้ Enum
            { new: true, session }
        );

        if (!job) {
            await session.abortTransaction();
            session.endSession();
            res.status(404).json({ message: "Job not found or already taken" });
            return;
        }

        await Raider.findByIdAndUpdate(raiderId,
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
    const { newStatus, imageUrl, raiderId } = req.body; // raiderId ควรมาจาก Token

    try {
        const job: IDeliveryJob | null = await DeliveryJob.findById(jobId);
        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }

        if (job.rider?.toString() !== raiderId) { // <-- เปลี่ยนเป็น rider
             res.status(403).json({ message: "Forbidden: You are not assigned to this job" });
             return;
        }

        job.status = newStatus;
        if (newStatus === DeliveryStatus.IN_TRANSIT && imageUrl) {
            job.inTransitImage = imageUrl; // <-- เปลี่ยนชื่อฟิลด์
        }
        if (newStatus === DeliveryStatus.DELIVERED && imageUrl) {
            job.deliveredImage = imageUrl; // <-- เปลี่ยนชื่อฟิลด์
            await Raider.findByIdAndUpdate(raiderId, { $set: { status: 'available', currentJobId: undefined } });
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