import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';
registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier.startsWith('.') &&
      context.parentURL &&
      !/\.[a-z]+$/i.test(specifier)
    ) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts'))
      return {
        format: 'module',
        source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
          },
        }).outputText,
        shortCircuit: true,
      };
    if (url.includes('/public/audio/') && url.endsWith('.json'))
      return {
        format: 'module',
        source: 'export default ' + readFileSync(new URL(url), 'utf8'),
        shortCircuit: true,
      };
    return next(url, context);
  },
});
