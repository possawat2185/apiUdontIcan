// server.ts
// เมื่อ app.ts ใช้ named export เราต้อง import โดยใช้ {} ครอบ
import { app } from './app';
import dotenv from 'dotenv';
import connectDB from './dbconnect';

// โหลด environment variables
dotenv.config();

// เชื่อมต่อ MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

