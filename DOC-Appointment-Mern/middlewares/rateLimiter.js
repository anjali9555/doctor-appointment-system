import rateLimit from "express-rate-limit";

// Helper to construct uniform 429 error responses with Retry-After details
const createRateLimitResponse = (actionName, windowMinutes) => ({
  skip: () => process.env.NODE_ENV === "test",
  statusCode: 429,
  handler: (req, res, next, options) => {
    const retryAfter = res.getHeader("Retry-After") || windowMinutes * 60;
    res.status(429).json({
      success: false,
      status: 429,
      error: "Too Many Requests",
      message: `Too many ${actionName} requests. Please try again in approximately ${windowMinutes} minutes.`,
      retryAfterSeconds: Number(retryAfter),
    });
  },
});

// 1. General Public API Limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  ...createRateLimitResponse("general API", 15),
});

// 2. Login Endpoint Rate Limiter (Brute-force protection)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 attempts per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  ...createRateLimitResponse("login", 15),
});

// 3. Registration Rate Limiter (Bot spam prevention)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Max 15 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  ...createRateLimitResponse("registration", 60),
});

// 4. Password Reset Rate Limiter (Enumeration protection)
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 reset requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  ...createRateLimitResponse("password reset", 15),
});

// 5. Appointment Booking Rate Limiter (Slot exhaustion & spam protection)
export const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 booking requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  ...createRateLimitResponse("appointment booking", 15),
});

// 6. Admin API Rate Limiter
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  ...createRateLimitResponse("administrative", 15),
});

// 7. AI Chatbot Rate Limiter
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  ...createRateLimitResponse("AI query", 1),
});

// 8. Review Submission Rate Limiter
export const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 review operations per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  ...createRateLimitResponse("review submission", 15),
});

// Backwards-compatible export for legacy authLimiter imports
export const authLimiter = loginLimiter;
