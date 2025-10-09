import express from "express";
import { upload } from "../utils/b2.js";
import { createRoom, getRooms, getRoomById, deleteRoom } from "../controller/roomController.js";

const router = express.Router();

router.post("/", upload.array("images", 5), createRoom);
router.get("/", getRooms);
router.get("/:id", getRoomById);
router.delete("/:id", deleteRoom);

export default router;
