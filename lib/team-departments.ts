export type TeamDepartment = { id: string; name: string };

export const defaultTeamDepartments: TeamDepartment[] = [
  { id: "sales-reservations", name: "Sales & Reservations" },
  { id: "contracting", name: "Contracting" },
  { id: "airport", name: "Airport" },
  { id: "finance", name: "Finance" }
];

export function normalizeTeamDepartments(value: unknown): TeamDepartment[] {
  if (!Array.isArray(value)) return defaultTeamDepartments.map((department) => ({ ...department }));
  return value.flatMap((department) =>
    department && typeof department.id === "string" && typeof department.name === "string"
      ? [{ id: department.id, name: department.name }]
      : []
  );
}

export function validateTeamDepartments(departments: TeamDepartment[], contacts: { departmentId: string }[]) {
  if (!departments.length) throw new Error("Add at least one department.");
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const department of departments) {
    const name = department.name.trim().toLowerCase();
    if (!department.id || !name) throw new Error("Every department needs a name.");
    if (ids.has(department.id) || names.has(name)) throw new Error("Department names must be unique.");
    ids.add(department.id);
    names.add(name);
  }
  if (contacts.some((contact) => !ids.has(contact.departmentId))) {
    throw new Error("Select an existing department for every contact.");
  }
}

export function groupTeamContacts<T extends { departmentId: string; enabled: boolean }>(departments: TeamDepartment[], contacts: T[]) {
  const visible = contacts.filter((contact) => contact.enabled);
  const groups = departments.map((department) => ({
    ...department,
    contacts: visible.filter((contact) => contact.departmentId === department.id)
  }));
  // Keep legacy or orphaned entries visible until an admin assigns their department.
  const unassigned = visible.filter((contact) => !departments.some((department) => department.id === contact.departmentId));
  if (unassigned.length) groups.push({ id: "unassigned", name: "Other contacts", contacts: unassigned });
  return groups.filter((group) => group.contacts.length);
}
