import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, lstat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const allowedExtensions = new Set(['.js', '.css', '.json', '.svg', '.png', '.webp', '.woff2']);

async function runtimeFiles(root, relative = 'src') {
  const result = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = `${relative}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Runtime symlinks are not allowed: ${name}`);
    if (entry.name.startsWith('.')) throw new Error(`Hidden runtime assets are not allowed: ${name}`);
    if (entry.isDirectory()) result.push(...await runtimeFiles(root, name));
    else if (entry.isFile() && allowedExtensions.has(path.extname(entry.name))) result.push(name);
    else throw new Error(`Unsupported runtime asset: ${name}`);
  }
  return result;
}

/** No bundler, network, environment injection, timestamps or source maps. */
export async function build(root = projectRoot, output = path.join(root, 'dist')) {
  root = path.resolve(root);
  output = path.resolve(output);
  if (output === root || root.startsWith(output + path.sep) || (output.startsWith(root + path.sep) && output !== path.join(root, 'dist'))) {
    throw new Error('Build output must not replace source');
  }
  const index = await lstat(path.join(root, 'index.html'));
  if (!index.isFile() || index.isSymbolicLink()) throw new Error('index.html must be a regular file');
  const source = await lstat(path.join(root, 'src'));
  if (!source.isDirectory() || source.isSymbolicLink()) throw new Error('src must be a real directory');
  const files = ['index.html', ...await runtimeFiles(root)].sort();
  // Read and hash before changing the output; malformed source cannot erase a prior build.
  const assets = await Promise.all(files.map(async name => ({ name, bytes: await readFile(path.join(root, name)) })));
  const manifest = { schemaVersion: 1, files: Object.fromEntries(assets.map(({name, bytes}) =>
    [name, { sha256: createHash('sha256').update(bytes).digest('hex'), size: bytes.length }])) };
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const {name, bytes} of assets) {
    await mkdir(path.dirname(path.join(output, name)), { recursive: true });
    await writeFile(path.join(output, name), bytes);
  }
  await writeFile(path.join(output, 'integrity.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await build();
  console.log(`Built ${Object.keys(manifest.files).length} runtime assets in dist/`);
}
