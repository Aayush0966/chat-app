import express from "express"
import { validateUser } from "../middlewares/auth.middleware";
import { messageController } from "../controllers/message.controller";

export const messageRouter = express.Router();

messageRouter.post("/", validateUser(), messageController.sendMessage)