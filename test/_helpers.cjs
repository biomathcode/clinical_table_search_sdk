const assert = require("node:assert/strict");

function createFetchMock(impl) {
  const calls = [];
  const fetch = async (input, init) => {
    calls.push({ input, init });
    return impl(input, init);
  };
  fetch.calls = calls;
  return fetch;
}

function urlOfCall(call) {
  return new URL(typeof call.input === "string" ? call.input : String(call.input));
}

function withAbortController() {
  const ac = new AbortController();
  return { ac, signal: ac.signal };
}

module.exports = {
  assert,
  createFetchMock,
  urlOfCall,
  withAbortController,
};

