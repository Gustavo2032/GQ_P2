
"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const testsDir = path.join(rootDir, "tests");

function findTests(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...findTests(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".test.js")) {
      files.push(path.relative(rootDir, fullPath));
    }
  }

  return files;
}

const files = findTests(testsDir);

if (files.length === 0) {
  console.error("Nenhum teste .test.js foi encontrado.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  cwd: rootDir,
});

process.exit(result.status ?? 1);
