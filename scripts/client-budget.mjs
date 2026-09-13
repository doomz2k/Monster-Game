import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { gzipSync } from 'node:zlib';
import ts from 'typescript';

// Inspect emitted static import edges; dynamic sound-studio imports are reported separately.
const root = resolve(process.argv[2] ?? 'dist/client');
const walk = (path) =>
  readdirSync(path, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(resolve(path, e.name)) : [resolve(path, e.name)],
  );
const files = walk(root).filter((path) => path.endsWith('.js'));
const code = new Map(files.map((path) => [path, readFileSync(path, 'utf8')]));
const dependencies = (path) => {
  const source = ts.createSourceFile(
    path,
    code.get(path),
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.JS,
  );
  return source.statements.flatMap((s) => {
    if (
      (ts.isImportDeclaration(s) || ts.isExportDeclaration(s)) &&
      s.moduleSpecifier &&
      ts.isStringLiteral(s.moduleSpecifier)
    ) {
      const target = resolve(dirname(path), s.moduleSpecifier.text);
      return code.has(target) ? [target] : [];
    }
    return [];
  });
};
const closure = (roots) => {
  const found = new Set();
  const add = (path) => {
    if (found.has(path)) return;
    found.add(path);
    dependencies(path).forEach(add);
  };
  roots.forEach(add);
  return found;
};
const named = (name) =>
  files.find((path) => basename(path).startsWith(name + '-'));
const entry = JSON.parse(
  readFileSync(resolve(root, 'vinext-client-entry-manifest.json'), 'utf8'),
).appBrowserEntry;
const roots = [resolve(root, entry), named('adventure-game'), named('world')];
if (roots.some((path) => !code.has(path)))
  throw new Error('Build the adventure and island first.');
const play = closure(roots);
const parent = named('parent-panel');
const review = parent
  ? [...closure([parent])].filter((path) => !play.has(path))
  : [];
const size = (paths) =>
  [...paths].reduce((n, path) => n + Buffer.byteLength(code.get(path)), 0);
const compressed = (paths) =>
  [...paths].reduce((n, path) => n + gzipSync(code.get(path)).length, 0);
console.log(
  JSON.stringify(
    {
      playModules: play.size,
      playJavaScriptBytes: size(play),
      playGzipBytes: compressed(play),
      reviewOnlyJavaScriptBytes: size(review),
      reviewOnlyGzipBytes: compressed(review),
      reviewDeferred: !!parent && !play.has(parent),
    },
    null,
    2,
  ),
);
