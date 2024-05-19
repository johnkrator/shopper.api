"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const formidable_1 = __importDefault(require("formidable"));
function parse(opts, events) {
    return (req, res, next) => {
        if (req.express_formidable && req.express_formidable.parsed) {
            next();
            return;
        }
        const form = new formidable_1.default.IncomingForm();
        Object.assign(form, opts);
        let manageOnError = false;
        if (events) {
            events.forEach((e) => {
                manageOnError = manageOnError || e.event === "error";
                form.on(e.event, (...parameters) => {
                    e.action(req, res, next, ...parameters);
                });
            });
        }
        if (!manageOnError) {
            form.on("error", (err) => {
                next(err);
            });
        }
        form.parse(req, (err, fields, files) => {
            if (err) {
                next(err);
                return;
            }
            Object.assign(req, { fields, files, express_formidable: { parsed: true } });
            next();
        });
    };
}
exports.parse = parse;
exports.default = parse;
//# sourceMappingURL=formidable.js.map