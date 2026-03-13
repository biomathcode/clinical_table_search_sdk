const { describe, it } = require("node:test");
const { setTimeout: delay } = require("node:timers/promises");
const { assert } = require("../_helpers.cjs");

const BASE_URL = process.env.CT_BASE_URL || "https://clinicaltables.nlm.nih.gov/";

function abortSignalAfter(ms) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, cleanup: () => clearTimeout(timer) };
}

function assertSearchResultShape(res) {
  assert.equal(typeof res.total, "number");
  assert.ok(Array.isArray(res.codes));
  assert.ok(Array.isArray(res.display));
  assert.ok(Array.isArray(res.items));
  assert.equal(res.items.length, res.codes.length);
  assert.equal(res.display.length, res.codes.length);
  for (let i = 0; i < res.items.length; i++) {
    assert.equal(res.items[i].code, res.codes[i]);
    assert.deepEqual(res.items[i].display, res.display[i]);
  }
}

describe("ClinicalTables (integration)", () => {
  it(
    "hcpcs v3 returns a valid result shape",
    async () => {
      const { ClinicalTablesClient, datasets } = require("../../dist-test/index.js");
      const client = ClinicalTablesClient.builder()
        .baseUrl(BASE_URL)
        .build();
      const hcpcs = client.dataset(datasets.hcpcs);

      const { signal, cleanup } = abortSignalAfter(15_000);
      try {
        const res = await hcpcs.search(
          { terms: "wheelchair", maxList: 3, df: ["code", "short_desc"] },
          { signal },
        );
        assertSearchResultShape(res);
        assert.ok(res.codes.length > 0);
      } finally {
        cleanup();
      }
    },
    { timeout: 20_000 },
  );

  it(
    "rxterms v3 returns a valid result shape",
    async () => {
      const { ClinicalTablesClient, datasets } = require("../../dist-test/index.js");
      const client = ClinicalTablesClient.builder()
        .baseUrl(BASE_URL)
        .build();
      const rxterms = client.dataset(datasets.rxterms);

      const { signal, cleanup } = abortSignalAfter(15_000);
      try {
        const res = await rxterms.search(
          { terms: "aspirin", maxList: 3, df: ["DISPLAY_NAME", "STRENGTHS_AND_FORMS"] },
          { signal },
        );
        assertSearchResultShape(res);
        assert.ok(res.codes.length > 0);
      } finally {
        cleanup();
      }
    },
    { timeout: 20_000 },
  );

  it(
    "genes v4 returns a valid result shape",
    async () => {
      const { ClinicalTablesClient, datasets } = require("../../dist-test/index.js");
      const client = ClinicalTablesClient.builder()
        .baseUrl(BASE_URL)
        .build();
      const genes = client.dataset(datasets.genes);

      const { signal, cleanup } = abortSignalAfter(15_000);
      try {
        const res = await genes.search(
          { terms: "BRCA", maxList: 3, df: ["symbol", "name_mod"] },
          { signal },
        );
        assertSearchResultShape(res);
        assert.ok(res.codes.length > 0);
      } finally {
        cleanup();
      }
    },
    { timeout: 20_000 },
  );

  it(
    "smoke: all built-in datasets respond with expected array format",
    async () => {
      const { ClinicalTablesClient, datasets } = require("../../dist-test/index.js");
      const client = ClinicalTablesClient.builder()
        .baseUrl(BASE_URL)
        .build();

      const datasetEntries = Object.entries(datasets);
      assert.ok(datasetEntries.length >= 20);

      for (const [key, def] of datasetEntries) {
        const ds = client.dataset(def);
        const { signal, cleanup } = abortSignalAfter(15_000);
        try {
          const res = await ds.search({ terms: "a", maxList: 1 }, { signal });
          assertSearchResultShape(res);
        } catch (err) {
          err.message = `Dataset "${key}" failed: ${err.message}`;
          throw err;
        } finally {
          cleanup();
        }

        // Be polite to the upstream service.
        await delay(50);
      }
    },
    { timeout: 180_000 },
  );
});
