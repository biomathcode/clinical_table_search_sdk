const { describe, it } = require("node:test");
const { assert } = require("./_helpers.cjs");

describe("utils/query", () => {
  it("normalizeBaseUrl adds trailing slash", () => {
    const { normalizeBaseUrl } = require("../dist-test/lib/utils/query.js");
    assert.equal(normalizeBaseUrl("https://x.test"), "https://x.test/");
    assert.equal(normalizeBaseUrl("https://x.test/"), "https://x.test/");
  });

  it("setQueryParam sets only when defined", () => {
    const { setQueryParam } = require("../dist-test/lib/utils/query.js");
    const url = new URL("https://x.test/");
    setQueryParam(url, "a", undefined);
    assert.equal(url.searchParams.has("a"), false);
    setQueryParam(url, "a", 1);
    assert.equal(url.searchParams.get("a"), "1");
  });

  it("setCsvQueryParam accepts string or array", () => {
    const { setCsvQueryParam } = require("../dist-test/lib/utils/query.js");
    const url = new URL("https://x.test/");
    setCsvQueryParam(url, "df", ["a", "b"]);
    assert.equal(url.searchParams.get("df"), "a,b");
    setCsvQueryParam(url, "df", "c");
    assert.equal(url.searchParams.get("df"), "c");
  });

  it("efToCsv renders field specs", () => {
    const { efToCsv } = require("../dist-test/lib/utils/query.js");
    assert.equal(efToCsv(undefined), undefined);
    assert.equal(efToCsv("a,b"), "a,b");
    assert.equal(efToCsv(["a", "b"]), "a,b");
    assert.equal(efToCsv([{ field: "x", as: "y" }]), "x:y");
    assert.equal(efToCsv(["a", { field: "x", as: "y" }]), "a,x:y");
  });

  it("includes small runtime type guards", () => {
    const { isObject, shallowCloneRecord, isEfSpec } = require("../dist-test/lib/utils/query.js");

    assert.equal(isObject(null), false);
    assert.equal(isObject({}), true);

    const orig = { a: 1 };
    const cloned = shallowCloneRecord(orig);
    assert.deepEqual(cloned, orig);
    assert.notEqual(cloned, orig);

    assert.equal(isEfSpec("x"), true);
    assert.equal(isEfSpec({ field: "x", as: "y" }), true);
    assert.equal(isEfSpec({ field: "x" }), false);
  });
});
