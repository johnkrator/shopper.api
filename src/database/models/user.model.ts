import mongoose, {Document, Schema} from "mongoose";

export interface IUser extends Document {
    username: string;
    password: string;
    email: string;
    isAdmin: boolean;
    isDeleted: boolean;
    roles: string[];
    isVerified: boolean;
    verificationCode?: string | number;
    verificationCodeExpires?: Date;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date | number | undefined;
    profilePicture: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    failedLoginAttempts: number;
    lockUntil: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    mobileNumber: string;
    lastActivity: Date;
    refreshToken?: string;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    isAdmin: {type: Boolean, default: false},
    isDeleted: {type: Boolean, default: false},
    roles: [{type: String, enum: ["user", "admin"], default: "user"}],
    isVerified: {type: Boolean, default: false},
    verificationCode: {type: String},
    verificationCodeExpires: {type: Date},
    resetPasswordToken: {type: String},
    resetPasswordExpires: {type: Date},
    profilePicture: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    location: {
        latitude: {type: Number},
        longitude: {type: Number},
    },
    failedLoginAttempts: {type: Number, default: 0},
    lockUntil: {type: Date, default: null},
    mobileNumber: {type: String, unique: true},
    refreshToken: {type: String}
}, {timestamps: true});

// Pre-save middleware to update isAdmin field based on roles
userSchema.pre<IUser>("save", function (next) {
    // Only update isAdmin if roles have been modified
    if (this.isModified("roles")) {
        this.isAdmin = this.roles.includes("admin");
    }
    next();
});

export default mongoose.model<IUser>("User", userSchema);