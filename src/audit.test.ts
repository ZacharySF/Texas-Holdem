import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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
    .filter(Boolean);
it('keeps project text free of machine-specific absolute paths', () => {
  const machineRoot = new RegExp(
    '/(?:etc' + '/profiles|nix)(?:/|\\b)|/(?:home|Users)/[\\w.-]+',
  );
  for (const file of files().filter((f) =>
    /\.(?:[cm]?[jt]sx?|json|mdx?|ya?ml|css|html)$/.test(f),
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
    (f) => f.startsWith('src/') && f.endsWith('.tsx') && !f.includes('.test.'),
  )) {
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8'),
      tree = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
    function visit(node: ts.Node) {
      if (
        ts.isJsxText(node) ||
        ts.isStringLiteralLike(node) ||
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node)
      )
        expect(node.text, `${file}: ${node.getStart(tree)}`).not.toMatch(
          literalProbability,
        );
      ts.forEachChild(node, visit);
    }
    visit(tree);
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
