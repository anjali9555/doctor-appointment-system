import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  cacheGet,
  cacheSet,
  cacheInvalidate,
  invalidateDoctorCaches,
  getCacheStatus,
} from "../services/cacheService.js";

describe("⚡ Redis & In-Memory Cache Service Tests", () => {
  test("1. Cache miss returns null", async () => {
    const data = await cacheGet("non_existent_key_9999");
    assert.equal(data, null);
  });

  test("2. Cache set and get returns stored JSON object", async () => {
    const testKey = "doctors:test:doc1";
    const testVal = { id: "doc1", name: "Dr. Sarah", fees: 800 };

    await cacheSet(testKey, testVal, 60);
    const retrieved = await cacheGet(testKey);

    assert.deepEqual(retrieved, testVal);
  });

  test("3. Cache invalidate deletes specific key", async () => {
    const testKey = "doctors:test:doc2";
    await cacheSet(testKey, { data: "sample" }, 60);

    const before = await cacheGet(testKey);
    assert.notEqual(before, null);

    await cacheInvalidate(testKey);
    const after = await cacheGet(testKey);
    assert.equal(after, null);
  });

  test("4. Cache invalidate with wildcard pattern clears matching entries", async () => {
    await cacheSet("doctors:list:page1", [{ id: 1 }], 60);
    await cacheSet("doctors:list:page2", [{ id: 2 }], 60);
    await cacheSet("doctor_specialities", ["Cardiology"], 60);

    await invalidateDoctorCaches();

    const p1 = await cacheGet("doctors:list:page1");
    const p2 = await cacheGet("doctors:list:page2");
    const spec = await cacheGet("doctor_specialities");

    assert.equal(p1, null);
    assert.equal(p2, null);
    assert.equal(spec, null);
  });

  test("5. Cache status reports active operational mode and connectivity", () => {
    const status = getCacheStatus();
    assert.equal(typeof status.mode, "string");
    assert.equal(typeof status.connected, "boolean");
  });
});
