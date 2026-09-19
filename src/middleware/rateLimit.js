const requests = new Map();
const windowMs = 60_000;
const maxRequests = 20;
export function rateLimit(request, response, next) {
  const key = request.ip || "unknown";
  const now = Date.now();
  const history = (requests.get(key) || []).filter(
    (timestamp) => now - timestamp < windowMs,
  );
  if (history.length >= maxRequests)
    return response
      .status(429)
      .json({
        ok: false,
        answer: "Too many requests. Please wait a minute and try again.",
        sources: [],
        projects: [],
      });
  history.push(now);
  requests.set(key, history);
  return next();
}
