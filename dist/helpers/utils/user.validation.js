"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordSchema = exports.changePasswordSchema = exports.loginSchema = exports.userSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const userSchema = joi_1.default.object().keys({
    username: joi_1.default.string().required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(),
    mobileNumber: joi_1.default.string().required(),
});
exports.userSchema = userSchema;
const loginSchema = joi_1.default.object().keys({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
exports.loginSchema = loginSchema;
const changePasswordSchema = joi_1.default.object().keys({
    currentPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(),
});
exports.changePasswordSchema = changePasswordSchema;
const forgotPasswordSchema = joi_1.default.object().keys({
    email: joi_1.default.string().email().required(),
    mobileNumber: joi_1.default.string().required(),
});
exports.forgotPasswordSchema = forgotPasswordSchema;
//# sourceMappingURL=user.validation.js.map