const { describe, it } = require("node:test");
const { assert, createFetchMock, urlOfCall, withAbortController } = require("./_helpers.cjs");

describe("ClinicalTablesClient", () => {
  it("normalizes baseUrl", () => {
    const { ClinicalTablesClient } = require("../dist-test/index.js");
    const fetch = createFetchMock(async () => new Response("[]", { status: 200 }));
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test").fetch(fetch).build();
    assert.equal(client.baseUrl, "https://example.test/");
  });

  it("throws when fetch is not available", () => {
    const { ClinicalTablesClient, ClinicalTablesFetchNotAvailableError } = require("../dist-test/index.js");
    const builder = ClinicalTablesClient.builder();
    // Force-disable fetch in JS (TypeScript would prevent this).
    builder.fetch(undefined);
    assert.throws(() => builder.build(), ClinicalTablesFetchNotAvailableError);
  });

  it("applies middleware before fetch", async () => {
    const { ClinicalTablesClient } = require("../dist-test/index.js");
    const fetch = createFetchMock(async (input, init) => {
      const url = new URL(String(input));
      assert.equal(url.searchParams.get("a"), "1");
      assert.equal(url.searchParams.get("b"), "2");
      assert.equal(init.headers["x-test"], "ok");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const client = ClinicalTablesClient.builder()
      .baseUrl("https://example.test/")
      .fetch(fetch)
      .use(({ url, init }) => {
        url.searchParams.set("a", "1");
        init.headers = { ...(init.headers ?? {}), "x-test": "ok" };
      })
      .use(({ url }) => {
        url.searchParams.set("b", "2");
      })
      .build();

    await client.getJson("/x", { c: "3" });
    assert.equal(fetch.calls.length, 1);
    const callUrl = urlOfCall(fetch.calls[0]);
    assert.equal(callUrl.pathname, "/x");
    assert.equal(callUrl.searchParams.get("c"), "3");
  });

  it("merges default headers and per-request headers", async () => {
    const { ClinicalTablesClient } = require("../dist-test/index.js");
    const fetch = createFetchMock(async (_input, init) => {
      assert.equal(init.method, "GET");
      assert.equal(init.headers.accept, "application/json");
      assert.equal(init.headers["x-a"], "a");
      assert.equal(init.headers["x-b"], "b");
      return new Response("[]", { status: 200 });
    });

    const client = ClinicalTablesClient.builder()
      .baseUrl("https://example.test/")
      .fetch(fetch)
      .headers({ "x-a": "a" })
      .build();

    await client.getJson("/x", {}, { headers: { "x-b": "b" } });
  });

  it("passes AbortSignal when provided", async () => {
    const { ClinicalTablesClient } = require("../dist-test/index.js");
    const fetch = createFetchMock(async (_input, init) => {
      assert.ok(init.signal);
      return new Response("[]", { status: 200 });
    });
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test/").fetch(fetch).build();
    const { signal } = withAbortController();
    await client.getJson("/x", {}, { signal });
  });

  it("throws ClinicalTablesHttpError on non-2xx", async () => {
    const { ClinicalTablesClient, ClinicalTablesHttpError } = require("../dist-test/index.js");
    const fetch = createFetchMock(async () => new Response("oops", { status: 500, statusText: "NOPE" }));
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test/").fetch(fetch).build();

    await assert.rejects(() => client.getJson("/x", {}), (err) => {
      assert.ok(err instanceof ClinicalTablesHttpError);
      assert.equal(err.status, 500);
      assert.equal(err.statusText, "NOPE");
      assert.equal(err.url, "https://example.test/x");
      assert.equal(err.bodyText, "oops");
      return true;
    });
  });

  it("throws ClinicalTablesHttpError when fetch throws", async () => {
    const { ClinicalTablesClient, ClinicalTablesHttpError } = require("../dist-test/index.js");
    const fetch = createFetchMock(async () => {
      throw new Error("boom");
    });
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test/").fetch(fetch).build();

    await assert.rejects(() => client.getJson("/x", {}), (err) => {
      assert.ok(err instanceof ClinicalTablesHttpError);
      assert.equal(err.status, 0);
      assert.equal(err.statusText, "FETCH_FAILED");
      assert.match(err.bodyText, /boom/);
      return true;
    });
  });

  it("throws ClinicalTablesParseError on invalid JSON", async () => {
    const { ClinicalTablesClient, ClinicalTablesParseError } = require("../dist-test/index.js");
    const fetch = createFetchMock(async () => new Response("not-json", { status: 200 }));
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test/").fetch(fetch).build();

    await assert.rejects(() => client.getJson("/x", {}), ClinicalTablesParseError);
  });
});
