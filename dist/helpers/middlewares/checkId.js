"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const checkId = (req, res, next) => {
    if (!(0, mongoose_1.isValidObjectId)(req.params.id)) {
        return res.status(400).json({ error: "Invalid Id" });
    }
    next();
};
exports.default = checkId;
//# sourceMappingURL=checkId.js.map