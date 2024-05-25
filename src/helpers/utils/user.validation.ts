import Joi from "joi";

const userSchema = Joi.object().keys({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(),
    mobileNumber: Joi.string().required(),
});

const loginSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const changePasswordSchema = Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required(),
});

const forgotPasswordSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    mobileNumber: Joi.string().required(),
});

export {userSchema, loginSchema, changePasswordSchema, forgotPasswordSchema};