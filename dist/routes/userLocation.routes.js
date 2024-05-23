"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userLocation_controller_1 = require("../controllers/userLocation.controller");
const userLocationRouter = express_1.default.Router();
userLocationRouter.post("/", userLocation_controller_1.getCurrentLocation);
exports.default = userLocationRouter;
//# sourceMappingURL=userLocation.routes.js.map