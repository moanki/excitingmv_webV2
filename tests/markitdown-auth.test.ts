import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire, registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

test("MarkItDown authenticates the protected deployment and distinguishes authentication failures", async (t) => {
  process.env.NEXT_PUBLIC_APP_URL = "https://dev.example.com";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service";
  process.env.VERCEL_URL = "deployment.vercel.app";
  const oidc = `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
  const contextSymbol = Symbol.for("@vercel/request-context");
  const globals = globalThis as typeof globalThis & { [contextSymbol]?: unknown };
  const previousContext = globals[contextSymbol];
  globals[contextSymbol] = { get: () => ({ headers: { "x-vercel-oidc-token": oidc } }) };
  const previousFetch = globalThis.fetch;
  const require = createRequire(import.meta.url);
  const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "server-only" ? pathToFileURL(require.resolve("next/dist/compiled/server-only/empty.js")).href : specifier, context);
  } });
  t.after(() => { globalThis.fetch = previousFetch; globals[contextSymbol] = previousContext; hooks.deregister(); });
  const { convertDocumentToMarkdown } = await import("../lib/services/resort-ai-service");
  const document = { sourceUrl: "upload", filename: "test.pdf", bytes: new Uint8Array([1]) };

  await t.test("forwards request-scoped OIDC separately from the service credential", async () => {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://deployment.vercel.app/api/markitdown_convert");
      const headers = new Headers(options?.headers);
      assert.equal(headers.get("x-vercel-trusted-oidc-idp-token"), oidc);
      assert.equal(headers.get("X-MarkItDown-Token"), "test-service");
      assert.equal(headers.get("Authorization"), "Bearer test-service");
      return Response.json({ ok: true, markdown: "Converted PDF", stats: {} });
    };
    assert.equal((await convertDocumentToMarkdown(document)).markdown, "Converted PDF");
  });
  await t.test("identifies Vercel protection without blaming Supabase", async () => {
    globalThis.fetch = async () => Response.json({ error: { code: "401", message: "Protected deployment" } }, { status: 401 });
    await assert.rejects(convertDocumentToMarkdown(document), /blocked by Vercel Deployment Protection/);
  });
  await t.test("identifies a Python service credential rejection", async () => {
    globalThis.fetch = async () => Response.json({ ok: false, error: "MarkItDown service authentication failed." }, { status: 401 });
    await assert.rejects(convertDocumentToMarkdown(document), /service authentication failed \(HTTP 401\)/);
  });
  await t.test("local conversion does not require Vercel credentials", async () => {
    const { env } = await import("../lib/env");
    env.VERCEL_URL = undefined;
    globals[contextSymbol] = undefined;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://dev.example.com/api/markitdown_convert");
      assert.equal(new Headers(options?.headers).has("x-vercel-trusted-oidc-idp-token"), false);
      return Response.json({ ok: true, markdown: "Local PDF", stats: {} });
    };
    assert.equal((await convertDocumentToMarkdown(document)).markdown, "Local PDF");
  });
});
