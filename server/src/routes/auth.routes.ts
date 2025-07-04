import express from "express";
import {validateData} from "../middlewares/validation.middleware";
import {loginSchema, registrationSchema} from "../validators/auth.validators";
import {authController} from "../controllers/auth.controller";

export const authRouter = express.Router();

authRouter.post("/register", validateData(registrationSchema), authController.register);
authRouter.post("/login", validateData(loginSchema), authController.login);
authRouter.post("/refresh", authController.refreshAccessToken);
authRouter.post("/forget-password", authController.forgetPassword);
authRouter.post("/validate-otp", authController.validateOTP);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.post("/logout", authController.logout);