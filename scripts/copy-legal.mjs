import { copyFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = resolve(projectRoot, 'dist');

for (const filename of ['LICENSE', 'NOTICE.md']) {
  const source = resolve(projectRoot, filename);
  const destination = resolve(distDir, basename(filename));
  copyFileSync(source, destination);
}

console.log('legal notices copied to dist');
