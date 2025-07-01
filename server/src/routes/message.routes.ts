import express from "express"
import { validateUser } from "../middlewares/auth.middleware";
import { messageController } from "../controllers/message.controller";

export const messageRouter = express.Router();

messageRouter.post("/", validateUser, messageController.sendMessage)
messageRouter.get("/search", validateUser, messageController.searchMessage)
messageRouter.get("/:chatId", validateUser, messageController.getMessageByChat)
messageRouter.delete("/user/:messageId", validateUser, messageController.removeMessageForYourself)
messageRouter.delete("/both/:messageId", validateUser, messageController.removeMessageForBoth)
messageRouter.patch("/:messageId", validateUser, messageController.editMessage)
