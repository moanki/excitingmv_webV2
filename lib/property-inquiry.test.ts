import assert from "node:assert/strict";
import { test } from "node:test";

import { contactSchema } from "./validations";

const inquiry = { name: "Test Guest", email: "guest@example.com", message: "Please advise availability for two guests." };

test("contact requests remain valid and property inquiries retain the exact property name", () => {
  assert.equal(contactSchema.safeParse(inquiry).success, true);
  assert.equal(contactSchema.parse({ ...inquiry, propertyName: "Adaaran Club Rannalhi" }).propertyName, "Adaaran Club Rannalhi");
});

test("inquiries reject invalid contact details, empty messages and oversized input", () => {
  for (const invalid of [{ email: "invalid" }, { name: " " }, { message: "short" }, { message: "x".repeat(5001) }, { propertyName: " " }, { propertyName: "x".repeat(301) }]) {
    assert.equal(contactSchema.safeParse({ ...inquiry, ...invalid }).success, false);
  }
});
