import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as departments from "../lib/team-departments";
import * as policies from "../lib/site-policies";
import { normalizeSafeMediaUrl } from "../lib/validations";

test("team settings preserve legacy contacts, save drafts separately, publish assignments, and require admin access", async () => {
  const legacyContact = { regionTitle: "Europe", contactName: "Existing contact", role: "Sales", email: "existing@example.com", whatsapp: "+960 1234567", location: "", photoUrl: "", displayOrder: 1, enabled: true };
  let stored: any = { draft: { title: "Contact Us", regions: [legacyContact] }, published: { title: "Contact Us", regions: [legacyContact] } };
  let authorized = true;
  const revalidated: string[] = [];
  const modules: Record<string, any> = {
    "next/cache": { revalidatePath(path: string) { revalidated.push(path); } },
    "@/lib/team-departments": departments,
    "@/lib/site-policies": policies,
    "@/lib/homepage-services": {}, "@/lib/homepage-why-us": {}, "@/lib/homepage-awards": {},
    "@/lib/validations": { normalizeSafeMediaUrl }, "@/lib/storage/site-assets": {},
    "@/lib/auth/require-admin": { async requireAdminRole() { if (!authorized) throw new Error("Unauthorized."); } },
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => ({ from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { value: structuredClone(stored) } }) }) }),
      upsert: async ({ key, value }: any) => { assert.equal(key, "site.contact"); stored = structuredClone(value); return { error: null }; }
    }) }) }
  };
  function load(path: string) {
    const exports: Record<string, any> = {};
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
      { exports, require: (name: string) => modules[name], process: { env: {} }, File, FormData, Error, Date });
    return exports;
  }
  const content = load("../lib/site-content.ts");
  modules["@/lib/site-content"] = content;
  const actions = load("../app/admin/settings/actions.ts");
  const legacy = (await content.getContactPageContent()).content;
  assert.equal(legacy.title, "Meet Our Team");
  assert.equal(legacy.regions[0].departmentId, "sales-reservations");
  assert.equal(legacy.regions[0].location, "");
  assert.equal(legacy.departments.length, 4);

  const form = new FormData();
  const fields = { title: "Our People", department_count: "2", department_0_id: "sales-reservations", department_0_name: "Sales & Reservations", department_1_id: "finance", department_1_name: "Finance", contact_count: "1", contact_0_departmentId: "finance", contact_0_contactName: "Finance contact", contact_0_email: "finance@example.com", contact_0_role: "Accountant", contact_0_displayOrder: "1", contact_0_enabled: "on", intent: "draft" };
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  assert.equal((await actions.saveContactDraftAction(undefined, form)).message, "Team draft saved.");
  assert.equal((await content.getContactPageContent("draft")).content.title, "Our People");
  assert.equal((await content.getContactPageContent()).content.regions[0].contactName, "Existing contact");
  assert.equal((await actions.publishContactAction(undefined, new FormData())).message, "Team page published.");
  const published = (await content.getContactPageContent()).content;
  assert.equal(published.title, "Our People");
  assert.equal(published.regions[0].departmentId, "finance");
  assert.equal(published.regions[0].regionTitle, "");
  assert.equal(published.regions[0].whatsapp, "");
  assert.equal(departments.groupTeamContacts(published.departments, published.regions)[0].name, "Finance");
  assert(revalidated.includes("/team"));

  form.set("heroImageUrl", "https://example.com/team-banner.jpg");
  assert.equal((await actions.saveContactDraftAction(undefined, form)).message, "Team draft saved.");
  assert.equal((await content.getContactPageContent("draft")).content.heroImageUrl, "https://example.com/team-banner.jpg");
  assert.equal((await content.getContactPageContent()).content.heroImageUrl, undefined, "banner drafts stay private");
  assert.equal((await actions.publishContactAction(undefined, new FormData())).message, "Team page published.");
  assert.equal((await content.getContactPageContent()).content.heroImageUrl, "https://example.com/team-banner.jpg");
  form.delete("heroImageUrl");
  await actions.saveContactDraftAction(undefined, form);
  assert.equal((await content.getContactPageContent("draft")).content.heroImageUrl, "https://example.com/team-banner.jpg", "older forms preserve the banner");
  form.set("heroImageUrl", "javascript:alert(1)");
  const beforeBadBanner = JSON.stringify(stored);
  assert.match((await actions.saveContactDraftAction(undefined, form)).error, /https/);
  assert.equal(JSON.stringify(stored), beforeBadBanner);
  form.set("heroImageUrl", "");
  await actions.saveContactDraftAction(undefined, form);
  assert.equal((await content.getContactPageContent("draft")).content.heroImageUrl, "", "clearing remains explicit");

  form.set("intent", "publish");
  form.set("title", "Contact Us");
  form.set("department_1_name", "Accounts");
  assert.equal((await actions.saveContactDraftAction(undefined, form)).message, "Team page published.");
  assert.equal((await content.getContactPageContent()).content.title, "Contact Us", "admin titles remain editable after migration");
  assert.equal((await content.getContactPageContent()).content.heroImageUrl, "");
  const beforeInvalid = JSON.stringify(stored);
  form.set("contact_0_departmentId", "missing");
  assert.match((await actions.saveContactDraftAction(undefined, form)).error, /existing department/);
  assert.equal(JSON.stringify(stored), beforeInvalid);
  form.set("contact_0_departmentId", "finance");
  form.set("department_count", "1000000000");
  assert.match((await actions.saveContactDraftAction(undefined, form)).error, /invalid team/);
  form.set("department_count", "2");
  authorized = false;
  assert.equal((await actions.saveContactDraftAction(undefined, form)).error, "Unauthorized.");
  assert.equal(JSON.stringify(stored), beforeInvalid);

  const legacyNavigation = { navItems: [
    { label: "Contact", href: "/contact", enabled: true },
    { label: "Team", href: "/contact", enabled: false },
    { label: "Resorts", href: "/resorts", enabled: true }
  ] };
  stored = { draft: legacyNavigation, published: legacyNavigation };
  const navigation = (await content.getNavbarContent()).content.navItems;
  assert.equal(navigation[0].label, "Team");
  assert.equal(navigation[0].href, "/team");
  assert.equal(navigation[1].href, "/team");
  assert.equal(navigation[1].enabled, false);
  assert.equal(navigation[2].href, "/resorts");
  const legacyFooter = { linkGroups: [{ title: "Company", enabled: true, items: [{ label: "Contact", href: "/contact", enabled: true, external: false }] }] };
  stored = { draft: legacyFooter, published: legacyFooter };
  const footerLink = (await content.getFooterContent()).content.linkGroups[0].items[0];
  assert.equal(footerLink.label, "Team");
  assert.equal(footerLink.href, "/team");
});
