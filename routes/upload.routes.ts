import express, { Request, Response } from "express";
import { router as userImage } from "../controllers/uploads/user.image";
import { router as riderImage } from "../controllers/uploads/rider.image";
import { router as jobImage } from "../controllers/uploads/job.image";

export const router = express.Router();

router.get("/", (req:Request, res:Response) => {
  res.send("Upload route is working...");
});

router.use("/userImage", userImage);
router.use("/riderImage", riderImage);
router.use("/jobImage", jobImage)