const { describe, it } = require("node:test");
const { assert } = require("./_helpers.cjs");

describe("displayToObjects", () => {
  it("maps display rows to objects keyed by df order", () => {
    const { displayToObjects } = require("../dist-test/index.js");
    const df = ["code", "name"];
    const display = [
      ["A", "Alpha"],
      ["B", "Beta"],
    ];
    const rows = displayToObjects(df, display);
    assert.deepEqual(rows, [
      { code: "A", name: "Alpha" },
      { code: "B", name: "Beta" },
    ]);
  });

  it("fills missing cells with empty string", () => {
    const { displayToObjects } = require("../dist-test/index.js");
    const df = ["a", "b", "c"];
    const display = [["1"]];
    const rows = displayToObjects(df, display);
    assert.deepEqual(rows, [{ a: "1", b: "", c: "" }]);
  });
});

