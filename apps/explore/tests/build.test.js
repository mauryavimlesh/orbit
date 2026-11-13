import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, readdir, mkdir, writeFile, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { build, projectRoot } from '../scripts/build.js';

async function temporary(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'orbit-build-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  return dir;
}

test('real app builds reproducibly with exact asset hashes and no development files', async t => {
  const dir = await temporary(t);
  const first = path.join(dir, 'first');
  const second = path.join(dir, 'second');
  const manifest = await build(projectRoot, first);
  assert.deepEqual(await build(projectRoot, second), manifest);
  assert.equal(await readFile(path.join(first, 'integrity.json'), 'utf8'), await readFile(path.join(second, 'integrity.json'), 'utf8'));
  assert.deepEqual((await readdir(first)).sort(), ['index.html', 'integrity.json', 'src']);
  assert.ok(manifest.files['src/app.js']);
  assert.ok(manifest.files['src/physics.js']);
  for (const [name, expected] of Object.entries(manifest.files)) {
    assert.ok(name === 'index.html' || name.startsWith('src/'));
    const bytes = await readFile(path.join(first, name));
    assert.deepEqual(bytes, await readFile(path.join(projectRoot, name)));
    assert.equal(bytes.length, expected.size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256);
    assert.deepEqual(bytes, await readFile(path.join(second, name)));
  }
  // Removed assets must not survive a later build.
  await writeFile(path.join(first, 'stale.js'), 'stale');
  await build(projectRoot, first);
  assert.equal((await readdir(first)).includes('stale.js'), false);
});

test('build rejects unsafe output paths', async () => {
  await assert.rejects(build(projectRoot, projectRoot), /must not replace source/);
  await assert.rejects(build(projectRoot, path.join(projectRoot, 'src')), /must not replace source/);
  await assert.rejects(build(projectRoot, path.dirname(projectRoot)), /must not replace source/);
});

test('build refuses symlinked and hidden assets without erasing prior output', async t => {
  const root = await temporary(t);
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'index.html'), '<html></html>');
  await writeFile(path.join(root, 'secret.txt'), 'never ship');
  await symlink('../secret.txt', path.join(root, 'src', 'link.js'));
  await assert.rejects(build(root), /symlinks/);
  await rm(path.join(root, 'src', 'link.js'));
  await writeFile(path.join(root, 'src', '.env'), 'never ship');
  await mkdir(path.join(root, 'dist'));
  await writeFile(path.join(root, 'dist', 'sentinel'), 'prior build');
  await assert.rejects(build(root), /Hidden/);
  assert.equal(await readFile(path.join(root, 'dist', 'sentinel'), 'utf8'), 'prior build');
});
