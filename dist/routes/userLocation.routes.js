"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userLocation_controller_1 = require("../controllers/userLocation.controller");
const router = express_1.default.Router();
router.post("/location", userLocation_controller_1.getCurrentLocation);
exports.default = router;
//# sourceMappingURL=userLocation.routes.js.map