export type TeamDepartment = { id: string; name: string; displayOrder?: number };

export const defaultTeamDepartments: TeamDepartment[] = [
  { id: "sales-reservations", name: "Sales & Reservations", displayOrder: 1 },
  { id: "contracting", name: "Contracting", displayOrder: 2 },
  { id: "airport", name: "Airport", displayOrder: 3 },
  { id: "finance", name: "Finance", displayOrder: 4 }
];

export function normalizeTeamDepartments(value: unknown): TeamDepartment[] {
  if (!Array.isArray(value)) return defaultTeamDepartments.map((department) => ({ ...department }));
  return value.flatMap((department, index) =>
    department && typeof department.id === "string" && typeof department.name === "string"
      ? [{
        id: department.id,
        name: department.name,
        displayOrder: Number.isInteger(department.displayOrder) && department.displayOrder > 0
          ? department.displayOrder
          : index + 1
      }]
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
    if (department.displayOrder !== undefined && (!Number.isInteger(department.displayOrder) || department.displayOrder < 1)) {
      throw new Error("Department display order must be a positive whole number.");
    }
    ids.add(department.id);
    names.add(name);
  }
  if (contacts.some((contact) => contact.departmentId && !ids.has(contact.departmentId))) {
    throw new Error("Select an existing department or leave it unassigned.");
  }
}

export function groupTeamContacts<T extends { departmentId: string; enabled: boolean }>(departments: TeamDepartment[], contacts: T[]) {
  const visible = contacts.filter((contact) => contact.enabled);
  const groups = normalizeTeamDepartments(departments)
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
    .map((department) => ({
      ...department,
      contacts: visible.filter((contact) => contact.departmentId === department.id)
    }));
  // Keep legacy or orphaned entries visible until an admin assigns their department.
  const unassigned = visible.filter((contact) => !departments.some((department) => department.id === contact.departmentId));
  if (unassigned.length) groups.push({ id: "unassigned", name: "Other contacts", contacts: unassigned });
  return groups.filter((group) => group.contacts.length);
}
