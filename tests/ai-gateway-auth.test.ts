import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire, registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

test("AI Gateway reads current request credentials for every import", async (t) => {
  const savedEnv = { ...process.env };
  const token = (id: string, exp: number) => `e30.${Buffer.from(JSON.stringify({ id, exp })).toString("base64url")}.test`;
  const staleToken = token("build", 1);
  process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service";
  process.env.VERCEL_URL = "deployment.vercel.app";
  process.env.VERCEL_OIDC_TOKEN = staleToken;
  delete process.env.AI_GATEWAY_API_KEY;
  const contextSymbol = Symbol.for("@vercel/request-context");
  const globals = globalThis as typeof globalThis & { [contextSymbol]?: unknown };
  const previousContext = globals[contextSymbol];
  const previousFetch = globalThis.fetch;
  const require = createRequire(import.meta.url);
  const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "server-only" ? pathToFileURL(require.resolve("next/dist/compiled/server-only/empty.js")).href : specifier, context);
  } });
  t.after(() => {
    globalThis.fetch = previousFetch;
    globals[contextSymbol] = previousContext;
    hooks.deregister();
    for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
    Object.assign(process.env, savedEnv);
  });
  const { extractImportedResortsFromPdf } = await import("../lib/services/resort-ai-service");
  const { env } = await import("../lib/env");
  const document = { sourceUrl: "upload", filename: "uc.pdf", bytes: new Uint8Array([1]) };
  let currentToken = "";
  let expectedGatewayToken = "";
  let gatewayCalls = 0;
  globals[contextSymbol] = { get: () => ({ headers: { "x-vercel-oidc-token": currentToken } }) };
  globalThis.fetch = async (url, options) => {
    const headers = new Headers(options?.headers);
    if (url === "https://deployment.vercel.app/api/markitdown_convert") {
      assert.equal(headers.get("x-vercel-trusted-oidc-idp-token"), currentToken);
      assert.equal(headers.get("Authorization"), "Bearer test-service");
      return Response.json({ ok: true, markdown: "A document with no resort data.", stats: {} });
    }
    assert.equal(url, "https://ai-gateway.vercel.sh/v1/messages");
    assert.equal(headers.get("Authorization"), `Bearer ${expectedGatewayToken}`);
    gatewayCalls++;
    return Response.json({ model: "anthropic/claude-opus-4.8", content: [{ type: "text", text: JSON.stringify({ resorts: [], notes: "No resort data." }) }] });
  };

  await t.test("ignores an expired environment snapshot and follows token rotation", async () => {
    for (const id of ["request-one", "request-two"]) {
      currentToken = token(id, Math.floor(Date.now() / 1000) + 3600);
      expectedGatewayToken = currentToken;
      const result = await extractImportedResortsFromPdf(document);
      assert.deepEqual(result.data.resorts, []);
    }
    assert.equal(gatewayCalls, 2);
    assert.equal(env.VERCEL_OIDC_TOKEN, staleToken);
  });
  await t.test("preserves an explicitly configured Gateway API key", async () => {
    env.AI_GATEWAY_API_KEY = "test-gateway-key";
    expectedGatewayToken = "test-gateway-key";
    await extractImportedResortsFromPdf(document);
    env.AI_GATEWAY_API_KEY = undefined;
  });
});
