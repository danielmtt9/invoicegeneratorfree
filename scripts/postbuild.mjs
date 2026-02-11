import fs from "node:fs";
import path from "node:path";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copy(src, dst) {
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
}

const root = process.cwd();
const dist = path.join(root, "dist");

// Vite does not reliably copy dotfiles from public/ across environments.
copy(path.join(root, "hostinger/admin.htaccess"), path.join(dist, "admin/.htaccess"));
copy(path.join(root, "hostinger/admin-api.htaccess"), path.join(dist, "admin-api/.htaccess"));

