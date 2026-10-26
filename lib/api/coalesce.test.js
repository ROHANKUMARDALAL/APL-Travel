const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

async function load() {
  return import("./coalesce.js");
}

describe("search request coalescing", () => {
  it("shares one in-flight search and starts a later retry separately", async () => {
    const { shareInflight, shouldCoalesce, coalesceKey } = await load();
    assert.equal(shouldCoalesce("POST", "/transfers/search"), true);
    assert.equal(shouldCoalesce("POST", "/transfers/revalidate"), true);
    assert.equal(shouldCoalesce("POST", "/transfers/book"), false);
    let calls = 0;
    const key = coalesceKey("POST", "/transfers/search", { pickup: "DEL" }, "");
    const run = () =>
      shareInflight(key, async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return "ok";
      });
    const [first, second] = await Promise.all([run(), run()]);
    assert.equal(first, "ok");
    assert.equal(second, "ok");
    assert.equal(calls, 1);
    await run();
    assert.equal(calls, 2);
  });
});