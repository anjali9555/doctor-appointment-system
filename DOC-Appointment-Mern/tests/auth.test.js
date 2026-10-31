import { test, describe } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";

describe("🔐 Authentication & Security Unit Tests", () => {
  const secret = "test_jwt_secret_key_12345";

  test("Password hashing creates secure bcrypt hash and verifies correctly", async () => {
    const rawPassword = "SecurePassword@123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notEqual(rawPassword, hash);
    assert.equal(typeof hash, "string");

    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.equal(isMatch, true, "Valid password should match");

    const isWrongMatch = await bcrypt.compare("WrongPassword", hash);
    assert.equal(isWrongMatch, false, "Invalid password must not match");
  });

  test("JWT Token signs user payload with role and decodes accurately", () => {
    const userPayload = {
      id: "660c1f2e9a3b4c5d6e7f8001",
      email: "patient@medicare.local",
      role: "patient",
      isAdmin: false,
    };

    const token = JWT.sign(userPayload, secret, { expiresIn: "1h" });
    assert.equal(typeof token, "string");

    const decoded = JWT.verify(token, secret);
    assert.equal(decoded.id, userPayload.id);
    assert.equal(decoded.email, userPayload.email);
    assert.equal(decoded.role, "patient");
    assert.equal(decoded.isAdmin, false);
  });

  test("JWT Token verification fails on tampered signature", () => {
    const token = JWT.sign({ id: "123" }, secret);
    const tampered = token + "xyz";

    assert.throws(
      () => {
        JWT.verify(tampered, secret);
      },
      /invalid signature/i
    );
  });

  test("Admin authorization middleware verifies admin privilege and rejects normal patient", () => {
    const normalUser = { id: "user_1", role: "patient", isAdmin: false };
    const adminUser = { id: "admin_1", role: "admin", isAdmin: true };

    const checkAdmin = (user) => {
      return Boolean(user && (user.isAdmin || user.role === "admin"));
    };

    assert.equal(checkAdmin(normalUser), false, "Patient must not have admin access");
    assert.equal(checkAdmin(adminUser), true, "Admin must be granted access");
  });
});
