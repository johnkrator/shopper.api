import express from "express";
import {getCurrentLocation} from "../controllers/userLocation.controller";

const router = express.Router();

router.post("/location", getCurrentLocation);

export default router;