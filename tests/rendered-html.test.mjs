import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished Outbreak Atlas page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Outbreak Atlas/i);
  assert.match(html, /Cyclospora/i);
  assert.match(html, /Verified sources/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("renders medical scope and source safeguards", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /Do not add these numbers together/i);
  assert.match(html, /not medical advice/i);
  assert.match(html, /cdc\.gov/i);
  assert.match(html, /fda\.gov/i);
});
