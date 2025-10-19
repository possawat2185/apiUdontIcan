import express from "express";
import {
  acceptJob,
  createJob,
  getAvailableJobs,
  getJobDetails,
  updateJobStatus,
} from "../controllers/deliveryJobs";

export const router = express.Router();

router.post("/", createJob);

router.get("/available", getAvailableJobs);

router.get("/:jobId", getJobDetails);

router.put("/:jobId/accept", acceptJob);

router.put("/:jobId/status", updateJobStatus);
