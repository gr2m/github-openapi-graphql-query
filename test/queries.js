const { readdirSync, readFileSync } = require("fs");

const test = require("ava");

const graphql = require("../index.js");

for (const filename of readdirSync("test/queries")) {
  const path = `test/queries/${filename}`;
  test(path, async (t) => {
    const query = readFileSync(path, "utf-8");
    const variables = {
      version: "1.0.5",
    };
    const { data } = await graphql(query, variables);
    t.snapshot(data);
  });
}
