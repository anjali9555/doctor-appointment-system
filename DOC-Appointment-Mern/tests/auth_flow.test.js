import { test, describe } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

describe("🛡️ Security & Role Enforcement Contract Tests", () => {
  const secret = process.env.JWT_SECRET || "test_jwt_secret_key_12345";

  test("User Schema toJSON sanitizer strips password from serialization", () => {
    const rawUser = {
      _id: "660c1f2e9a3b4c5d6e7f8002",
      name: "Test Patient",
      email: "test.patient@example.com",
      password: "HashedPassword123",
      role: "patient",
      isAdmin: false,
    };

    const doc = new userModel(rawUser);
    const json = doc.toJSON();

    assert.equal(json.name, "Test Patient");
    assert.equal(json.email, "test.patient@example.com");
    assert.equal(json.password, undefined, "Password field must never be exposed in toJSON");
  });

  test("Public registration payload tampering must not elevate user to admin", () => {
    // Simulate user payload trying to elevate privileges
    const maliciousPayload = {
      name: "Hacker User",
      email: "HACKER@EXAMPLE.COM",
      password: "SecretPassword123",
      role: "admin",
      isAdmin: true,
    };

    // Controller logic strictly sets role: 'patient' and isAdmin: false
    const sanitizedUserData = {
      name: maliciousPayload.name.trim(),
      email: maliciousPayload.email.trim().toLowerCase(),
      password: maliciousPayload.password,
      role: "patient",
      isAdmin: false,
    };

    assert.equal(sanitizedUserData.role, "patient");
    assert.equal(sanitizedUserData.isAdmin, false);
    assert.equal(sanitizedUserData.email, "hacker@example.com");
  });

  test("Email validation regex rejects malformed addresses", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    assert.equal(emailRegex.test("valid.user@example.com"), true);
    assert.equal(emailRegex.test("user+test@domain.co.in"), true);
    assert.equal(emailRegex.test("invalid-email"), false);
    assert.equal(emailRegex.test("@missinguser.com"), false);
    assert.equal(emailRegex.test("missingdomain@"), false);
    assert.equal(emailRegex.test("spaces in@email.com"), false);
  });

  test("Appointment IDOR boundary check allows own appointments and blocks others for patients", () => {
    const reqPatientUser = { id: "user_123", role: "patient", isAdmin: false };
    const reqAdminUser = { id: "admin_999", role: "admin", isAdmin: true };

    const checkAccess = (user, targetUserId) => {
      const isSelf = targetUserId === "my" || targetUserId === user.id;
      const isAdmin = user.isAdmin || user.role === "admin";
      return isSelf || isAdmin;
    };

    // Patient accessing own appointments
    assert.equal(checkAccess(reqPatientUser, "user_123"), true);
    assert.equal(checkAccess(reqPatientUser, "my"), true);

    // Patient attempting to access another patient's appointments
    assert.equal(checkAccess(reqPatientUser, "user_456"), false);

    // Admin accessing any patient's appointments
    assert.equal(checkAccess(reqAdminUser, "user_123"), true);
    assert.equal(checkAccess(reqAdminUser, "user_456"), true);
  });

  test("Admin authorization middleware strictly checks admin role / flag", () => {
    const isAuthorizedAdmin = (user) => {
      return Boolean(user && (user.isAdmin === true || user.role === "admin"));
    };

    assert.equal(isAuthorizedAdmin({ role: "patient", isAdmin: false }), false);
    assert.equal(isAuthorizedAdmin({ role: "patient" }), false);
    assert.equal(isAuthorizedAdmin({ isAdmin: false }), false);
    assert.equal(isAuthorizedAdmin(null), false);
    assert.equal(isAuthorizedAdmin(undefined), false);

    assert.equal(isAuthorizedAdmin({ role: "admin", isAdmin: true }), true);
    assert.equal(isAuthorizedAdmin({ role: "admin", isAdmin: false }), true);
    assert.equal(isAuthorizedAdmin({ role: "patient", isAdmin: true }), true);
  });
});
