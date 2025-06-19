import express from "express";
import {validateData} from "../middlewares/validation.middleware";
import {registrationSchema} from "../validators/auth.validators";
import {authController} from "../controllers/auth.controller";

export const authRouter = express.Router();

authRouter.post("/register", validateData(registrationSchema), authController.register)

