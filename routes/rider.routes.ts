import express from "express";
import { createRider, deleteRider, getRiderById, getRiders, loginRider, updateRider } from "../controllers/riders";


export const router = express.Router();

router.route('/').get(getRiders).post(createRider);
router.route('/:id').get(getRiderById).put(updateRider).delete(deleteRider);
router.route('/login').post(loginRider);