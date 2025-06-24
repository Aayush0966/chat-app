import express from "express";
import {validateUser} from "../middlewares/auth.middleware";
import {validateData} from "../middlewares/validation.middleware";
import {chatSchema} from "../validators/chat.validators";
import {chatController} from "../controllers/chat.controller";

export const chatRouter = express.Router();

chatRouter.post("/", validateUser(), validateData(chatSchema), chatController.createChat);
chatRouter.get("/", validateUser(), chatController.getChatById);
chatRouter.get("/user", validateUser(), chatController.getChatsByUser);



