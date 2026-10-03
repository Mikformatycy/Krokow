import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fixtureDocuments } from '../src/fixtures';
import { createOpenApiDocument } from '../src/openapi';

const check = process.argv.includes('--check');
const root = new URL('../../../', import.meta.url);
const outputs = [
  ...fixtureDocuments.map((fixture) => {
    fixture.schema.parse(fixture.value);
    return { path: `examples/${fixture.file}`, value: fixture.value };
  }),
  { path: 'packages/contracts/openapi.json', value: createOpenApiDocument() },
];
for (const output of outputs) {
  const target = new URL(output.path, root);
  const expected = `${JSON.stringify(output.value, null, 2)}\n`;
  if (check) {
    const actual = await readFile(target, 'utf8');
    if (actual.replace(/\r\n/g, '\n') !== expected) throw new Error(`Generated file differs: ${output.path}`);
  } else {
    await mkdir(new URL('.', target), { recursive: true });
    await writeFile(target, expected, 'utf8');
  }
}
const expectedFiles = new Set(fixtureDocuments.map((fixture) => fixture.file));
for (const file of await readdir(new URL('examples/', root))) {
  if (file.endsWith('.json') && !expectedFiles.has(file)) throw new Error(`Unregistered JSON example: ${file}`);
}
console.log(`${check ? 'Checked' : 'Generated'} ${outputs.length} files in ${fileURLToPath(root)}`);
