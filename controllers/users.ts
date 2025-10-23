// controllers/users.controller.ts
import { Request, Response } from "express";
import User, { IUser } from "../models/User.model";

// @desc    Get all users
// @route   GET /api/users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // เพิ่ม .sort({ createdAt: -1 }) เพื่อเรียงข้อมูลจากใหม่ไปเก่า
    const users: IUser[] = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user: IUser | null = await User.findById(req.params.id);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new user (ปรับปรุงให้ตรงกับ Model)
// @route   POST /api/users
export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ดึงข้อมูลทั้งหมดที่จำเป็นจาก request body
  const { phone, password, name, profileImage } = req.body;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!phone || !password || !name) {
    res.status(400).json({ message: "Phone, password, and name are required" });
    return;
  }

  try {
    // เช็คว่ามีเบอร์โทรนี้ในระบบหรือยัง
    const userExists = await User.findOne({ phone });
    if (userExists) {
      res
        .status(400)
        .json({ message: "User with this phone number already exists" });
      return;
    }

    // สร้าง user ใหม่ (ในโปรเจกต์จริง ควร hash password ก่อนบันทึก)
    const newUser = new User({
      phone,
      password,
      name,
      profileImage,
    });
    const createdUser: IUser = await newUser.save();
    res.status(201).json(createdUser);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a user (ปรับปรุงให้มีประสิทธิภาพมากขึ้น)
// @route   PUT /api/users/:id
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // ใช้วิธี findByIdAndUpdate เพื่อความกระชับและประสิทธิภาพ
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // คืนค่า document ที่อัปเดตแล้ว
      runValidators: true, // ให้ Mongoose ตรวจสอบข้อมูลใหม่ตาม Schema
    });

    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user: IUser | null = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.status(200).json({ message: "User removed" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Please provide phone and password" });
    }

    const user = await User.findOne({ phone }).select("+password");
    if (!user || user.password !== password) {
      return res
        .status(401)
        .json({ message: "Phone number or password incorrect" });
    }

    res.status(200).json({
      message: "Login successful",
      userId: user._id,
    });
  } catch (error: any) {
    console.error("Error lagging in user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
