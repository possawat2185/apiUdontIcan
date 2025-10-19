import express, { Request, Response } from "express";
import { router as userImage } from "../controllers/uploads/user.image";
import { router as raiderImage } from "../controllers/uploads/raider.image";
import { router as jobImage } from "../controllers/uploads/job.image";

export const router = express.Router();

router.get("/", (req:Request, res:Response) => {
  res.send("Upload route is working...");
});

router.use("/userImage", userImage);
router.use("/raiderImage", raiderImage);
router.use("/jobImage", jobImage)