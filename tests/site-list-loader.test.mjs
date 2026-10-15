import { test } from "node:test";
import assert from "node:assert/strict";
import { createSiteListLoader } from "../src/lib/site-list-loader.js";

const site = { id: "site-a", tenantId: "tenant-a", name: "Website", slug: "website", status: "DRAFT", domain: null, subdomain: null, createdAt: "2026-10-09T06:12:19.567Z", updatedAt: "2026-10-12T09:48:35.298Z" };
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

test("focus refresh shares an in-flight GET instead of aborting and restarting it", async () => {
  const pending = deferred();
  const results = [];
  let calls = 0;
  const loader = createSiteListLoader("tenant-a", (result) => results.push(result), async (url, options) => {
    calls++;
    assert.equal(url, "/api/tenants/tenant-a/sites");
    assert.equal(options.cache, "no-store");
    assert.equal(options.signal, undefined);
    return pending.promise;
  });
  const first = loader.load();
  assert.equal(loader.load(), first);
  pending.resolve(Response.json([site]));
  await first;
  assert.equal(calls, 1);
  assert.deepEqual(results, [{ sites: [site], error: null }]);
  await loader.load();
  assert.equal(calls, 2);
});

test("navigation cleanup ignores late success and never aborts or publishes old branch data", async () => {
  const pending = deferred();
  const oldResults = [];
  const oldLoader = createSiteListLoader("tenant-a", (result) => oldResults.push(result), () => pending.promise);
  const oldRead = oldLoader.load();
  oldLoader.dispose();
  const newResults = [];
  const newLoader = createSiteListLoader("tenant-b", (result) => newResults.push(result), async () => Response.json([{ ...site, tenantId: "tenant-b" }]));
  await newLoader.load();
  pending.resolve(Response.json([site]));
  await oldRead;
  await oldLoader.load();
  assert.deepEqual(oldResults, []);
  assert.equal(newResults[0].sites[0].tenantId, "tenant-b");
});

test("late rejected reads after cleanup are handled without publishing an error", async () => {
  const pending = deferred();
  const results = [];
  const loader = createSiteListLoader("tenant-a", (result) => results.push(result), () => pending.promise);
  const read = loader.load();
  loader.dispose();
  pending.reject(new DOMException("signal is aborted without reason", "AbortError"));
  await assert.doesNotReject(read);
  assert.deepEqual(results, []);
});

test("real request failures remain visible and a retry can recover", async () => {
  const results = [];
  let calls = 0;
  const loader = createSiteListLoader("tenant-a", (result) => results.push(result), async () => {
    calls++;
    if (calls === 1) return Response.json({ error: "Unable to load websites." }, { status: 502 });
    return Response.json([]);
  });
  await loader.load();
  assert.match(results[0].error.message, /Unable to load websites/);
  await loader.load();
  assert.deepEqual(results[1], { sites: [], error: null });
});
