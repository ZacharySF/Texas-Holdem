import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import type { ComponentType } from 'react';
import type { MDXProps } from 'mdx/types';
import { lessons } from '../../content/lessons';
import { LessonContext } from './context';
import { mdxComponents } from './components';
const content = import.meta.glob<ComponentType<MDXProps>>(
  '../../content/lessons/*.mdx',
  { eager: true, import: 'default' },
);

it('ships every lesson with all seven parts, four lenses, valid MDX and no literal numeric probabilities', () => {
  expect(Object.keys(content)).toHaveLength(53);
  for (const lesson of lessons) {
    const path = `../../content/lessons/${lesson.id}.mdx`,
      Content = content[path];
    expect(Content).toBeDefined();
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LessonContext.Provider
          value={{
            lesson,
            seed: '0123456789abcdef0123456789abcdef',
            onComplete: () => {},
          }}
        >
          <Content components={mdxComponents} />
        </LessonContext.Provider>
      </MemoryRouter>,
    );
    for (const part of [
      'hook',
      'idea',
      'derivation',
      'simulation',
      'practice',
      'table',
      'quant',
    ])
      expect(html.match(new RegExp(`data-part="${part}"`, 'g'))).toHaveLength(
        1,
      );
    expect(html).toContain('A shortcut, with its error measured');
    expect(html).toContain('katex-mathml');
    expect(readFileSync(new URL(path, import.meta.url), 'utf8')).not.toMatch(
      /\b\d+(?:\.\d+)?\s*(?:%|percent\b)|\b\d+\s*\/\s*\d+\b|[¼½¾⅓⅔⅕⅖⅗⅘]/i,
    );
  }
});
