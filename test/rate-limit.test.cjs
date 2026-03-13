const { describe, it } = require("node:test");
const { setTimeout } = require("node:timers/promises");
const { assert } = require("./_helpers.cjs");

describe("debounce", () => {
  it("resolves only the last call (trailing)", async () => {
    const { debounce, CanceledError } = require("../dist-test/index.js");
    const fn = debounce(async (v) => v, 40);

    const p1 = fn(1);
    const p2 = fn(2);

    await assert.rejects(() => p1, CanceledError);
    assert.equal(await p2, 2);
  });

  it("supports cancel()", async () => {
    const { debounce, CanceledError } = require("../dist-test/index.js");
    const fn = debounce(async (v) => v, 40);
    const p = fn(1);
    fn.cancel();
    await assert.rejects(() => p, CanceledError);
  });

  it("supports flush()", async () => {
    const { debounce } = require("../dist-test/index.js");
    const fn = debounce(async (v) => v + 1, 60);
    fn(1);
    const out = await fn.flush();
    assert.equal(out, 2);
  });

  it("supports leading execution", async () => {
    const { debounce } = require("../dist-test/index.js");
    const fn = debounce(async (v) => v, 50, { leading: true, trailing: true });

    assert.equal(await fn(1), 1);
    const p2 = fn(2);
    assert.equal(await p2, 2);
  });
});

describe("throttle", () => {
  it("executes immediately then resolves trailing call", async () => {
    const { throttle, CanceledError } = require("../dist-test/index.js");
    const fn = throttle(async (v) => v, 60, { leading: true, trailing: true });

    assert.equal(await fn(1), 1);
    const p2 = fn(2);
    const p3 = fn(3);

    await assert.rejects(() => p2, CanceledError);
    await setTimeout(80);
    assert.equal(await p3, 3);
  });

  it("rejects when trailing is disabled", async () => {
    const { throttle, CanceledError } = require("../dist-test/index.js");
    const fn = throttle(async (v) => v, 60, { leading: true, trailing: false });

    assert.equal(await fn(1), 1);
    await assert.rejects(() => fn(2), CanceledError);
  });

  it("supports cancel() and pending()", async () => {
    const { throttle, CanceledError } = require("../dist-test/index.js");
    const fn = throttle(async (v) => v, 60, { leading: false, trailing: true });

    const p = fn(1);
    assert.equal(fn.pending(), true);
    fn.cancel();
    assert.equal(fn.pending(), false);
    await assert.rejects(() => p, CanceledError);
  });

  it("supports flush()", async () => {
    const { throttle } = require("../dist-test/index.js");
    const fn = throttle(async (v) => v, 60, { leading: false, trailing: true });

    fn(10);
    const out = await fn.flush();
    assert.equal(out, 10);
  });
});

