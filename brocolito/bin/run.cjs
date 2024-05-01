#!/usr/bin/env node

const packageDir = require("path").join(__dirname, "..", "..");
const needsUpdate = process.env.CI
  ? undefined
  : (/** @type {import("./update_hashes.cjs")} */(require(/** @type {any} */("brocolito/bin/update_hashes.cjs"))).needsUpdate(packageDir));

if (needsUpdate) {
  const notCompletion = !process.env.COMP_LINE;
  notCompletion && process.stdout.write("🥦Rebuilding ⚙️...");
  require("child_process").execSync(
    "node " + require.resolve("brocolito/bin/build.mjs"),
    {
      cwd: packageDir,
      stdio: "inherit",
      env: { ...process.env, BROCOLITO_REBUILD: "true" },
    },
  );
  notCompletion && require("readline").clearLine(process.stdout, 0);
  notCompletion && require("readline").cursorTo(process.stdout, 0);
}

require(/** @type {any} the actual CLI code */("../cli.cjs"));
