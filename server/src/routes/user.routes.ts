import express from "express";
import {userController} from "../controllers/user.controller";
import {validateUser} from "../middlewares/auth.middleware";


export const userRoutes = express.Router();

userRoutes.get("/search", validateUser(), userController.searchUser);
