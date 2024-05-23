import express from "express";
import {getCurrentLocation} from "../controllers/userLocation.controller";

const userLocationRouter = express.Router();

userLocationRouter.post("/", getCurrentLocation);

export default userLocationRouter;