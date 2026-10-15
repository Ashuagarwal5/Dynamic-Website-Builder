import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";

const apiUrl = new URL("../src/lib/api.js", import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === apiUrl && specifier === "./auth") {
      return {
        url: "data:text/javascript,export async function getSession() { return globalThis.apiTestSession; }",
        shortCircuit: true,
      };
    }
    if (
      specifier === "../lib/api" &&
      context.parentURL ===
        new URL("../src/services/auth.service.js", import.meta.url).href
    ) {
      return { url: apiUrl, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { apiFetch } = await import(apiUrl);
const { loginUser } = await import("../src/services/auth.service.js");
const originalFetch = globalThis.fetch;
const originalBase = process.env.BASEURL;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete globalThis.apiTestSession;
  if (originalBase === undefined) delete process.env.BASEURL;
  else process.env.BASEURL = originalBase;
});

function captureRequest() {
  process.env.BASEURL = "https://backend.example/";
  const calls = [];
  const response = new Response(
    JSON.stringify({
      accessToken: "server-only-token",
      user: { id: "1" },
      tenants: [],
    }),
    { status: 201 },
  );
  globalThis.fetch = async (...args) => {
    calls.push(args);
    return response;
  };
  return { calls, response };
}

test("login preserves credentials, upstream response, and makes one anonymous request", async () => {
  const { calls, response } = captureRequest();
  const credentials = {
    email: "user@example.com",
    password: " password with spaces ",
  };
  assert.equal(await loginUser(credentials), response);
  assert.equal(calls.length, 1);
  const [url, options] = calls[0];
  assert.equal(url, "https://backend.example/auth/login");
  assert.equal(options.method, "POST");
  assert.deepEqual(JSON.parse(options.body), credentials);
  assert.equal(options.headers.get("Authorization"), null);
  assert.equal(options.headers.get("Content-Type"), "application/json");
  assert.equal(options.cache, "no-store");
  assert.ok(options.signal instanceof AbortSignal);
});

test("authenticated requests use the session token and preserve backend 401 responses", async () => {
  const { calls } = captureRequest();
  globalThis.apiTestSession = { accessToken: "session-token" };
  const upstream = new Response(null, { status: 401 });
  globalThis.fetch = async (...args) => {
    calls.push(args);
    return upstream;
  };
  assert.equal(await apiFetch("/private"), upstream);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0][1].headers.get("Authorization"),
    "Bearer session-token",
  );
});

test("missing sessions stop requests before contacting the backend", async () => {
  const { calls } = captureRequest();
  assert.equal((await apiFetch("/private")).status, 401);
  assert.equal(calls.length, 0);
});

test("multipart uploads retain FormData and leave the boundary to fetch", async () => {
  const { calls } = captureRequest();
  globalThis.apiTestSession = { accessToken: "session-token" };
  const body = new FormData();
  body.append("file", new Blob(["image"]), "example.png");
  await apiFetch("/upload", { method: "POST", body });
  assert.equal(calls[0][1].body, body);
  assert.equal(calls[0][1].headers.has("Content-Type"), false);
});

test("explicit content types and cancellation signals are preserved", async () => {
  const { calls } = captureRequest();
  const controller = new AbortController();
  await apiFetch("/example", {
    authenticated: false,
    method: "POST",
    body: "plain text",
    headers: { "Content-Type": "text/plain" },
    signal: controller.signal,
  });
  assert.equal(calls[0][1].headers.get("Content-Type"), "text/plain");
  assert.equal(calls[0][1].signal, controller.signal);
});

test("configuration errors and absolute paths fail before contacting the backend", async () => {
  const { calls } = captureRequest();
  for (const path of [
    "https://other.example/private",
    "//other.example/private",
  ]) {
    await assert.rejects(apiFetch(path), /relative API path/);
  }
  delete process.env.BASEURL;
  await assert.rejects(apiFetch("/example"), /BASEURL/);
  assert.equal(calls.length, 0);
});
