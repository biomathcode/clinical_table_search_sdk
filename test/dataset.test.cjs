const { describe, it } = require("node:test");
const { assert, createFetchMock, urlOfCall } = require("./_helpers.cjs");

describe("ClinicalTablesDatasetClient", () => {
  it("exposes id/version/searchPath", () => {
    const { ClinicalTablesClient, datasets } = require("../dist-test/index.js");
    const fetch = createFetchMock(async () => new Response(JSON.stringify([0, [], null, []]), { status: 200 }));
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test/").fetch(fetch).build();
    const hcpcs = client.dataset(datasets.hcpcs);

    assert.equal(hcpcs.id, "hcpcs");
    assert.equal(hcpcs.version, "v3");
    assert.equal(hcpcs.searchPath, "/api/hcpcs/v3/search");
  });

  it("builds the expected /api/<id>/<version>/search URL and query", async () => {
    const { ClinicalTablesClient, datasets } = require("../dist-test/index.js");

    const fetch = createFetchMock(async () => {
      const raw = [
        1,
        ["A"],
        { long: ["x"] },
        [["A", "Disp"]],
      ];
      return new Response(JSON.stringify(raw), { status: 200 });
    });

    const client = ClinicalTablesClient.builder()
      .baseUrl("https://clinicaltables.nlm.nih.gov")
      .fetch(fetch)
      .defaultSearchParams({ count: 12 })
      .build();
    const hcpcs = client.dataset(datasets.hcpcs);

    const res = await hcpcs.search({
      terms: "wheelchair",
      df: ["code", "display"],
      ef: [{ field: "long_desc", as: "long" }],
      count: 5,
    });

    assert.equal(res.total, 1);
    assert.equal(res.items[0].code, "A");
    assert.deepEqual(res.items[0].display, ["A", "Disp"]);
    assert.equal(res.items[0].extra.long, "x");

    const callUrl = urlOfCall(fetch.calls[0]);
    assert.equal(callUrl.pathname, "/api/hcpcs/v3/search");
    assert.equal(callUrl.searchParams.get("terms"), "wheelchair");
    assert.equal(callUrl.searchParams.get("df"), "code,display");
    assert.equal(callUrl.searchParams.get("ef"), "long_desc:long");
    // Explicit param overrides defaults.
    assert.equal(callUrl.searchParams.get("count"), "5");
  });

  it("passes dataset-specific params and defaults (e.g., cosmic grchv)", async () => {
    const { ClinicalTablesClient, datasets } = require("../dist-test/index.js");
    const fetch = createFetchMock(async () => new Response(JSON.stringify([0, [], null, []]), { status: 200 }));
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test/").fetch(fetch).build();
    const cosmic = client.dataset(datasets.cosmic);

    await cosmic.search({ terms: "BRAF" });
    let callUrl = urlOfCall(fetch.calls[0]);
    assert.equal(callUrl.searchParams.get("grchv"), "38");

    await cosmic.search({ terms: "BRAF", grchv: 37 });
    callUrl = urlOfCall(fetch.calls[1]);
    assert.equal(callUrl.searchParams.get("grchv"), "37");
  });

  it("treats unknown primitive keys as query params and rejects non-primitives", async () => {
    const { ClinicalTablesClient, defineDataset } = require("../dist-test/index.js");
    const fetch = createFetchMock(async () => new Response(JSON.stringify([0, [], null, []]), { status: 200 }));
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test/").fetch(fetch).build();
    const custom = client.dataset(
      defineDataset({
        id: "custom",
        version: "v3",
        fields: ["code", "name"],
      }),
    );

    await custom.search({ terms: "x", foo: "bar" });
    let callUrl = urlOfCall(fetch.calls[0]);
    assert.equal(callUrl.searchParams.get("foo"), "bar");

    await assert.rejects(() => custom.search({ terms: "x", bad: { a: 1 } }), (err) => {
      assert.match(String(err.message), /Unsupported query param value type/);
      return true;
    });
  });

  it("throws when terms is missing (runtime)", async () => {
    const { ClinicalTablesClient, datasets, ClinicalTablesParseError } = require("../dist-test/index.js");
    const fetch = createFetchMock(async () => new Response(JSON.stringify([0, [], null, []]), { status: 200 }));
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test/").fetch(fetch).build();
    const hcpcs = client.dataset(datasets.hcpcs);

    await assert.rejects(() => hcpcs.search({ df: ["code", "display"] }), ClinicalTablesParseError);
  });

  it("parses codeSystems when present (5th element)", async () => {
    const { ClinicalTablesClient, datasets } = require("../dist-test/index.js");
    const fetch = createFetchMock(async () => {
      const raw = [1, ["X"], null, [["X"]], ["SYS"]];
      return new Response(JSON.stringify(raw), { status: 200 });
    });
    const client = ClinicalTablesClient.builder().baseUrl("https://example.test/").fetch(fetch).build();
    const genes = client.dataset(datasets.genes);

    const res = await genes.search({ terms: "BRCA" });
    assert.deepEqual(res.codeSystems, ["SYS"]);
  });
});
