import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTeamDepartments, groupTeamContacts, normalizeTeamDepartments, validateTeamDepartments } from "../lib/team-departments";

test("legacy contact settings receive the four requested departments without sharing mutable defaults", () => {
  const departments = normalizeTeamDepartments(undefined);
  assert.deepEqual(departments.map((department) => department.name), ["Sales & Reservations", "Contracting", "Airport", "Finance"]);
  departments[0].name = "Changed";
  assert.equal(defaultTeamDepartments[0].name, "Sales & Reservations");
});

test("renaming departments preserves memberships and grouping hides empty departments and inactive contacts", () => {
  const departments = [{ id: "finance", name: "Accounts" }, { id: "sales", name: "Sales" }, { id: "airport", name: "Airport" }];
  const contacts = [
    { name: "Sales person", departmentId: "sales", enabled: true },
    { name: "Accountant", departmentId: "finance", enabled: true },
    { name: "Inactive", departmentId: "airport", enabled: false },
    { name: "Legacy", departmentId: "missing", enabled: true }
  ];
  const groups = groupTeamContacts(departments, contacts);
  assert.deepEqual(groups.map((group) => group.name), ["Accounts", "Sales", "Other contacts"]);
  assert.equal(groups[0].contacts[0].name, "Accountant");
  assert.equal(groups.flatMap((group) => group.contacts).length, 3);
});

test("invalid departments and removing an assigned department are rejected before saving", () => {
  assert.throws(() => validateTeamDepartments([], []), /at least one/);
  assert.throws(() => validateTeamDepartments([{ id: "a", name: " " }], []), /needs a name/);
  assert.throws(() => validateTeamDepartments([{ id: "a", name: "Sales" }, { id: "b", name: " sales " }], []), /unique/);
  assert.throws(() => validateTeamDepartments([{ id: "a", name: "Sales" }, { id: "a", name: "Finance" }], []), /unique/);
  assert.throws(() => validateTeamDepartments(defaultTeamDepartments, [{ departmentId: "deleted" }]), /existing department/);
  assert.doesNotThrow(() => validateTeamDepartments(defaultTeamDepartments, [{ departmentId: "finance" }]));
  assert.doesNotThrow(() => validateTeamDepartments(defaultTeamDepartments, [{ departmentId: "" }]));
});

test("department display order sorts the website, keeps ties stable and preserves legacy order", () => {
  const departments = [
    { id: "sales", name: "Sales", displayOrder: 3 },
    { id: "finance", name: "Finance", displayOrder: 1 },
    { id: "airport", name: "Airport", displayOrder: 1 }
  ];
  const contacts = [...departments.map(({ id }) => ({ departmentId: id, enabled: true })), { departmentId: "", enabled: true }];
  assert.deepEqual(groupTeamContacts(departments, contacts).map(({ id }) => id), ["finance", "airport", "sales", "unassigned"]);
  assert.deepEqual(departments.map(({ id }) => id), ["sales", "finance", "airport"]);
  assert.deepEqual(normalizeTeamDepartments(departments.map(({ id, name }) => ({ id, name }))).map(({ displayOrder }) => displayOrder), [1, 2, 3]);
  for (const displayOrder of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => validateTeamDepartments([{ id: "a", name: "Sales", displayOrder }], []), /positive whole number/);
  }
});
