import {Request, Response, NextFunction} from "express";

// Not Found Error Handler
// This middleware will catch any request that doesn't match any route and create a 404 error
const notFoundErrorHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// General Error Handler
// This middleware will handle all the errors that occur in the app
const generalErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
    // If the response headers have already been sent, delegate to the default Express error handler
    if (res.headersSent) {
        return next(error);
    }

    // Determine the status code: if it's not a 404 from the notFoundErrorHandler, it's a server error (500)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    // Respond with the error details
    res.json({
        message: error.message,
        // Include stack trace only in development mode for debugging purposes
        stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
    });
};

export {notFoundErrorHandler, generalErrorHandler};