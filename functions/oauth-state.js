const crypto = require("node:crypto");

function createOAuthState(secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({
    nonce: crypto.randomBytes(24).toString("hex"),
    expires: now + 10 * 60 * 1000,
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function isValidOAuthState(state, secret, now = Date.now()) {
  if (typeof state !== "string" || state.length > 1024) return false;
  const [payload, suppliedSignature, ...extra] = state.split(".");
  if (!payload || !suppliedSignature || extra.length) return false;

  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest();
  const decodedSignature = Buffer.from(suppliedSignature, "base64url");
  if (
    decodedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(decodedSignature, expectedSignature)
  ) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.nonce === "string" &&
      data.nonce.length >= 32 &&
      Number.isFinite(data.expires) &&
      data.expires > now;
  } catch (error) {
    if (error instanceof SyntaxError) return false;
    throw error;
  }
}

module.exports = { createOAuthState, isValidOAuthState };
