import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'svelte/compiler';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import ts from 'typescript';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = () =>
  execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: root, encoding: 'utf8' },
  )
    .split('\0')
    .filter(
      (file) => file && existsSync(new URL('../' + file, import.meta.url)),
    );
it('keeps project text free of machine-specific absolute paths', () => {
  const machineRoot = new RegExp(
    '/(?:etc' + '/profiles|nix)(?:/|\\b)|/(?:home|Users)/[\\w.-]+',
  );
  for (const file of files().filter((f) =>
    /\.(?:[cm]?[jt]sx?|json|mdx?|svx|svelte|ya?ml|css|html)$/.test(f),
  ))
    expect(
      readFileSync(new URL('../' + file, import.meta.url), 'utf8'),
      file,
    ).not.toMatch(machineRoot);
});
it('CI installs its own Chromium before browser checks', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/ci.yml', import.meta.url),
    'utf8',
  );
  expect(workflow).toContain('npx playwright install --with-deps chromium');
  expect(
    workflow.indexOf('npx playwright install --with-deps chromium'),
  ).toBeLessThan(workflow.indexOf('npm run test:smoke'));
  const config = readFileSync(
    new URL('../playwright.config.ts', import.meta.url),
    'utf8',
  );
  expect(config).toMatch(
    /executablePath:\s*process\.env\.CI\s*\?\s*undefined\s*:\s*process\.env\.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH/,
  );
});
it('keeps rendered percentage labels sourced from code rather than literal prose', () => {
  const literalProbability = /\b\d+(?:\.\d+)?\s*(?:%|percent\b)/i;
  for (const file of files().filter(
    (f) => f.startsWith('src/') && f.endsWith('.svelte'),
  )) {
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    const tree = parse(source, { modern: true });
    function visit(value: unknown) {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      const node = value as Record<string, unknown>;
      // Layout attributes contain CSS/SVG percentages; inspect rendered prose.
      if (node.type === 'Text')
        expect(node.data, file).not.toMatch(literalProbability);
      for (const [key, child] of Object.entries(node))
        if (!['attributes', 'instance', 'module', 'css'].includes(key))
          visit(child);
    }
    visit(tree.fragment);
  }
});

it('roadmap anchor references resolve to actual named tests', () => {
  const roadmap = readFileSync(
    new URL('../docs/ROADMAP.md', import.meta.url),
    'utf8',
  );
  const references = [
    ...roadmap.matchAll(/\[[^\]]+\]\(\.\.\/([^)]+)\) — `([^`]+)`/g),
  ];
  expect(references.length).toBeGreaterThanOrEqual(40);
  for (const [, file, name] of references) {
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8'),
      tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const names: string[] = [];
    function visit(node: ts.Node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        ['it', 'test'].includes(node.expression.text)
      ) {
        const first = node.arguments[0];
        if (first && ts.isStringLiteral(first)) names.push(first.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
    expect(names, file).toContain(name);
  }
});

it('ships a native Svelte app without a React runtime or JSX source', () => {
  const packageFile = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  );
  const dependencies = Object.keys({
    ...packageFile.dependencies,
    ...packageFile.devDependencies,
  });
  expect(
    dependencies.filter((name) => /(^|[/@-])react(?:$|[-/])/.test(name)),
  ).toEqual([]);
  const lock = JSON.parse(
    readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'),
  );
  expect(
    Object.keys(lock.packages).filter((name) =>
      /node_modules\/(react|react-dom|react-router)$/.test(name),
    ),
  ).toEqual([]);
  const sourceFiles = files().filter((f) => f.startsWith('src/'));
  expect(sourceFiles.filter((f) => /\.[jt]sx$/.test(f))).toEqual([]);
  for (const file of sourceFiles.filter((f) => /\.(ts|svelte|svx)$/.test(f)))
    expect(
      readFileSync(new URL('../' + file, import.meta.url), 'utf8'),
      file,
    ).not.toMatch(/from\s*['"]react(?:-dom|-router)?(?:\/[^'"]*)?['"]/);
});
