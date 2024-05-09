"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isAdmin: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    roles: [{ type: String, enum: ["user", "admin"], default: "user" }],
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    profilePicture: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
}, { timestamps: true });
// Pre-save middleware to update isAdmin field based on roles
userSchema.pre("save", function (next) {
    this.isAdmin = this.roles.includes("admin");
    next();
});
exports.default = mongoose_1.default.model("User", userSchema);
//# sourceMappingURL=user.model.js.map