const rateLimit = require('express-rate-limit');

// Rate limiter for internal messaging routes (Portal Dashboard)
const messageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per minute
    message: {
        success: false,
        message: "Too many requests. Please try again after a minute."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter for external API routes (Third-party integrations)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 requests per minute
    message: {
        success: false,
        message: "API rate limit exceeded. Limit is 20 requests per minute."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    messageLimiter,
    apiLimiter
};
