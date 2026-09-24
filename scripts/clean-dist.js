import { rmSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = resolve(projectRoot, 'dist');

if (dirname(distDir) !== projectRoot || basename(distDir) !== 'dist') {
  throw new Error(`Refusing to clean unexpected path: ${distDir}`);
}

rmSync(distDir, { recursive: true, force: true });
