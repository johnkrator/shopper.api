import express from "express";
import {getCurrentLocation} from "../controllers/userLocation.controller";

const userLocationRouter = express.Router();

userLocationRouter.post("/location", getCurrentLocation);

export default userLocationRouter;