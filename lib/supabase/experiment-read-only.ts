import "server-only";

const stagingOrigin = "https://ddelyhoaflwtlzjwtihq.supabase.co";

export function assertExperimentStaging(url: string) {
  if (url !== stagingOrigin) throw new Error("This experiment can only read the staging Supabase project.");
}

export const experimentReadOnlyFetch: typeof fetch = (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const isTableRead = /^\/rest\/v1\/[a-z][a-z0-9_]*$/.test(url.pathname) && url.pathname !== "/rest/v1/rpc";
  if (url.origin !== stagingOrigin || !isTableRead || (method !== "GET" && method !== "HEAD")) {
    return Promise.resolve(new Response(JSON.stringify({ message: "Read-only visual experiment." }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }));
  }
  return fetch(input, { ...init, redirect: "error" });
};
