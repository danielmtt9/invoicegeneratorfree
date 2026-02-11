import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: "inherit", ...opts });
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

const root = process.cwd();
const outDir = path.join(root, "tmp", "deploy");
const distDir = path.join(root, "dist");
const zipPath = path.join(outDir, "hostinger-dist.zip");
const tarPath = path.join(outDir, "hostinger-dist.tar.gz");

ensureDir(outDir);
rmrf(zipPath);
rmrf(tarPath);

// Builds `dist/` and ensures Hostinger .htaccess templates are copied via scripts/postbuild.mjs
run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);

// Create a zip of the *contents* of dist (so upload extracts directly into public_html).
// Uses system `zip` if available.
let created = "";
try {
  run("zip", ["-r", zipPath, "."], { cwd: distDir });
  created = zipPath;
} catch {
  // Fallback: use `tar` if zip isn't installed (still works for download/upload workflows).
  run("tar", ["-czf", tarPath, "-C", distDir, "."]);
  created = tarPath;
}

console.log(`\nCreated deploy bundle: ${created}`);
