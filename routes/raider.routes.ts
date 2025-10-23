import express from "express";
import { createRaider, deleteRaider, getRaiderById, getRaiders, loginRaider, updateRaider } from "../controllers/raiders";


export const router = express.Router();

router.route('/').get(getRaiders).post(createRaider);
router.route('/:id').get(getRaiderById).put(updateRaider).delete(deleteRaider);
router.route('/login').get(loginRaider);