import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
async function check(dir) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await check(file);
    else if (entry.name.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', file], {stdio: 'inherit'});
      if (result.status !== 0 || result.error) process.exit(1);
    }
  }
}
for (const dir of ['src', 'scripts', 'tests']) await check(path.join(root, dir));
console.log('JavaScript syntax checks passed');
