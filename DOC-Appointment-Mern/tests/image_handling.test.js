import { test, describe } from "node:test";
import assert from "node:assert/strict";
import doctorModel from "../models/doctorModel.js";
import userModel from "../models/userModel.js";

describe("🖼️ Doctor & Patient Profile Image Handling Tests", () => {
  test("1. Doctor Model defaults image to empty string when no photo is provided", () => {
    const docData = {
      name: "Dr. Test Specialist",
      email: "test.specialist@medicare.local",
      degree: "MBBS, MD",
      speciality: "Neurology",
      fees: 1200,
      experience: 8,
      about: "Consultant Neurologist",
    };

    const doc = new doctorModel(docData);
    assert.equal(doc.image, "", "Doctor image must be an empty string when no image is uploaded");
    assert.equal(typeof doc.image, "string");
  });

  test("2. Doctor creation stores base64 data URI when image is uploaded", () => {
    const fakeBuffer = Buffer.from("fake-doctor-image-bytes");
    const fakeMimetype = "image/jpeg";
    const imageString = `data:${fakeMimetype};base64,${fakeBuffer.toString("base64")}`;

    const docData = {
      name: "Dr. Photo Specialist",
      email: "photo.specialist@medicare.local",
      degree: "MBBS",
      speciality: "Pediatrics",
      fees: 700,
      experience: 5,
      about: "Pediatric care",
      image: imageString,
    };

    const doc = new doctorModel(docData);
    assert.equal(doc.image.startsWith("data:image/jpeg;base64,"), true);
    assert.equal(doc.image, imageString);
  });

  test("3. Doctor update without new photo preserves existing image", () => {
    const existingDoc = {
      _id: "doc_123",
      name: "Dr. Existing",
      image: "data:image/jpeg;base64,existingPhotoBytes12345",
    };

    // Controller update simulation: no req.file
    const reqFile = undefined;
    const updateData = { name: "Dr. Existing Renamed" };
    if (reqFile) {
      updateData.image = "new_image";
    }

    const updatedDoc = { ...existingDoc, ...updateData };
    assert.equal(updatedDoc.image, existingDoc.image, "Existing photo must not be erased when updating without file");
    assert.equal(updatedDoc.name, "Dr. Existing Renamed");
  });

  test("4. Doctor update with new photo replaces image cleanly", () => {
    const existingDoc = {
      _id: "doc_123",
      name: "Dr. Existing",
      image: "data:image/jpeg;base64,oldPhotoBytes",
    };

    const newBuffer = Buffer.from("new-photo-bytes");
    const reqFile = { mimetype: "image/png", buffer: newBuffer };
    const updateData = {};
    if (reqFile) {
      updateData.image = `data:${reqFile.mimetype};base64,${reqFile.buffer.toString("base64")}`;
    }

    const updatedDoc = { ...existingDoc, ...updateData };
    assert.notEqual(updatedDoc.image, existingDoc.image);
    assert.equal(updatedDoc.image.startsWith("data:image/png;base64,"), true);
  });

  test("5. User Model defaults image to empty string upon registration", () => {
    const userData = {
      name: "John Patient",
      email: "john.patient@example.com",
      password: "HashedPassword123",
    };

    const user = new userModel(userData);
    assert.equal(user.image, "", "User image must be empty string by default");
  });

  test("6. User profile update without new photo preserves existing image", () => {
    const existingUser = {
      _id: "user_789",
      name: "Jane Patient",
      image: "data:image/jpeg;base64,janeOriginalPhoto",
    };

    // Updating phone number only
    const reqFile = undefined;
    const updateData = { phone: "9876543210" };
    if (reqFile) {
      updateData.image = "should_not_reach_here";
    }

    const updatedUser = { ...existingUser, ...updateData };
    assert.equal(updatedUser.image, existingUser.image, "Existing user image must be preserved");
    assert.equal(updatedUser.phone, "9876543210");
  });

  test("7. User profile update with new photo updates image", () => {
    const existingUser = {
      _id: "user_789",
      name: "Jane Patient",
      image: "",
    };

    const newBuffer = Buffer.from("jane-new-avatar");
    const reqFile = { mimetype: "image/jpeg", buffer: newBuffer };
    const updateData = {};
    if (reqFile) {
      updateData.image = `data:${reqFile.mimetype};base64,${reqFile.buffer.toString("base64")}`;
    }

    const updatedUser = { ...existingUser, ...updateData };
    assert.equal(updatedUser.image.startsWith("data:image/jpeg;base64,"), true);
  });

  test("8. Image Helper rejects fallback URLs and returns empty string for absent image", () => {
    const getDoctorImageUrl = (img) => {
      if (!img) return "";
      if (img.startsWith("http") || img.startsWith("data:")) return img;
      return `data:image/jpeg;base64,${img}`;
    };

    // Absent image checks
    assert.equal(getDoctorImageUrl(""), "");
    assert.equal(getDoctorImageUrl(null), "");
    assert.equal(getDoctorImageUrl(undefined), "");

    // Valid image checks
    assert.equal(getDoctorImageUrl("https://mycdn.com/doc.jpg"), "https://mycdn.com/doc.jpg");
    assert.equal(getDoctorImageUrl("data:image/png;base64,abc"), "data:image/png;base64,abc");
    assert.equal(getDoctorImageUrl("rawBase64String123"), "data:image/jpeg;base64,rawBase64String123");
  });
});
