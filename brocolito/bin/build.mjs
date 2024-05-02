#!/usr/bin/env node

import path from "path";
import { build } from "vite";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import {
  packageJSON,
  createBinFile,
  createGlobalStateFile,
  createCompletionFiles,
  showSetupHint,
} from "./build-common.mjs";

// https://vitejs.dev/config/
await build({
  logLevel: "error",
  build: {
    lib: {
      entry: path.resolve("src/main.ts"),
      fileName: (_format) => "cli.mjs",
      formats: ["es"],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [/^node:.*/, ...Object.keys(packageJSON.dependencies)],
      output: {
        dir: "build",
      },
    },
  },
});

await createGlobalStateFile();

// add global state
const cliFile = path.resolve("./build/cli.mjs");
const cliContent = await fs.readFile(cliFile, "utf-8");
await fs.writeFile(cliFile, 'import "./meta.mjs";\n' + cliContent);

// update file hashes for hot reload before next execution
if (!process.env.CI)
  (await import("./update_hashes.mjs")).updateHashes(path.resolve("."));

// create execution wrapper
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runFile = path.join(__dirname, "run.mjs");
await createBinFile((binFile) => fs.cp(runFile, binFile));

await createCompletionFiles();

showSetupHint();
