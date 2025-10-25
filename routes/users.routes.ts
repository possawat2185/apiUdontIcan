import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getUserByPhone,
} from "../controllers/users";

export const router = express.Router();

router.route("/").get(getUsers).post(createUser);

router.route('/phone/:phone').get(getUserByPhone);

router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

router.route("/login").post(loginUser);
