const test = require("node:test");
const assert = require("node:assert/strict");
const { createOAuthState, isValidOAuthState } = require("./oauth-state");

test("accepts an unexpired state signed with the correct secret", () => {
  const state = createOAuthState("test-secret", 1000);

  assert.equal(isValidOAuthState(state, "test-secret", 1001), true);
});

test("rejects state with a different secret or modified payload", () => {
  const state = createOAuthState("test-secret", 1000);
  const [payload, signature] = state.split(".");
  const modifiedState = `${Buffer.from('{"nonce":"changed","expires":9999999999999}').toString("base64url")}.${signature}`;

  assert.equal(isValidOAuthState(state, "wrong-secret", 1001), false);
  assert.equal(isValidOAuthState(modifiedState, "test-secret", 1001), false);
  assert.equal(isValidOAuthState(`${payload}.${signature}.extra`, "test-secret", 1001), false);
});

test("rejects expired and oversized states", () => {
  const state = createOAuthState("test-secret", 1000);

  assert.equal(isValidOAuthState(state, "test-secret", 601001), false);
  assert.equal(isValidOAuthState("x".repeat(1025), "test-secret", 1001), false);
});
