/**
 * Recursive sanitizer to strip MongoDB query operator injections (keys starting with $)
 * and prohibited dot notation from objects in-place.
 *
 * Compatible with Express 5 where req.query and req.params are getters / non-reassignable properties.
 */
const sanitizeInPlace = (target) => {
  if (!target || typeof target !== "object") return;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (target[i] && typeof target[i] === "object") {
        sanitizeInPlace(target[i]);
      }
    }
    return;
  }

  for (const key of Object.keys(target)) {
    // Prohibit keys starting with $ (e.g. $gt, $ne, $where, $regex) or containing dot notation
    if (key.startsWith("$") || key.includes(".")) {
      delete target[key];
    } else if (target[key] && typeof target[key] === "object") {
      sanitizeInPlace(target[key]);
    }
  }
};

export const sanitizeMiddleware = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      sanitizeInPlace(req.body);
    }
    if (req.query && typeof req.query === "object") {
      sanitizeInPlace(req.query);
    }
    if (req.params && typeof req.params === "object") {
      sanitizeInPlace(req.params);
    }
  } catch (err) {
    // Graceful fallback to avoid unhandled crashes
  }
  next();
};
