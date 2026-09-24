import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const manifestPath = resolve(dist, 'assets/manifest.webmanifest');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

// Parcel emits the hashed icon files at dist/, but the manifest is in assets/.
// Resolve its icon URLs relative to the manifest, including on project Pages.
for (const icon of manifest.icons) {
  let asset = resolve(dirname(manifestPath), icon.src);
  if (!existsSync(asset)) asset = resolve(dist, basename(icon.src));
  assert(existsSync(asset), `Missing manifest icon: ${icon.src}`);
  icon.src = relative(dirname(manifestPath), asset).replaceAll('\\', '/');
  assert(existsSync(resolve(dirname(manifestPath), icon.src)));
}

writeFileSync(manifestPath, JSON.stringify(manifest));
console.log('manifest icon paths verified');
