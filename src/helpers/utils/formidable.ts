import {Request, Response, NextFunction} from "express";
import formidable from "formidable";

interface FormidableOptions {
    [key: string]: any;
}

interface FormidableEvent {
    event: string;
    action: (...parameters: any[]) => void;
}

function parse(opts: FormidableOptions, events?: FormidableEvent[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if ((req as any).express_formidable && (req as any).express_formidable.parsed) {
            next();
            return;
        }

        const form = new formidable.IncomingForm();
        Object.assign(form, opts);

        let manageOnError = false;
        if (events) {
            events.forEach((e) => {
                manageOnError = manageOnError || e.event === "error";
                form.on(e.event, (...parameters: any[]) => {
                    e.action(req, res, next, ...parameters);
                });
            });
        }

        if (!manageOnError) {
            form.on("error", (err: Error) => {
                next(err);
            });
        }

        form.parse(req, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
            if (err) {
                next(err);
                return;
            }

            Object.assign(req, {fields, files, express_formidable: {parsed: true}});
            next();
        });
    };
}

export default parse;
export {parse};