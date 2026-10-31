import crypto from "crypto";

/**
 * Middleware to assign a unique correlation ID to every incoming request.
 * Propagates existing X-Request-Id from clients (e.g. API gateways, frontend)
 * or generates a new RFC 4122 UUID.
 */
export const correlationIdMiddleware = (req, res, next) => {
  const correlationId =
    req.headers["x-request-id"] ||
    req.headers["x-correlation-id"] ||
    crypto.randomUUID();

  req.id = correlationId;
  res.setHeader("X-Request-Id", correlationId);
  next();
};
