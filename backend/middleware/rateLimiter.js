import rateLimit from "express-rate-limit";

const windowMs = 15 * 60 * 1000;

export const apiLimiter = rateLimit({
    windowMs,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {status: "error", message: "Too many requests from this IP, please try again later."},
  });

export const scanLimiter = rateLimit({
    windowMs,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {status: "error", message: "Too many file scans from this IP, please try again later."},
  });

export const fileLimiter = rateLimit({
    windowMs,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {status: "error", message: "Too many file uploads from this IP, please try again later."},
  });