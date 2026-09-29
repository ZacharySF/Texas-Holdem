// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach } from 'vitest';
import LessonTestHost from './LessonTestHost.svelte';
import { lessons } from '../../content/lessons';
import { readingGuides } from '../../content/readingGuides';
afterEach(cleanup);
const content = import.meta.glob<Component>('../../content/lessons/*.svx', {
  eager: true,
  import: 'default',
});

it('ships every lesson with all seven parts, four lenses, valid Svelte Markdown and no literal numeric probabilities', () => {
  expect(Object.keys(content)).toHaveLength(53);
  for (const lesson of lessons) {
    const path = `../../content/lessons/${lesson.id}.svx`,
      Content = content[path];
    expect(Content).toBeDefined();
    const mounted = render(LessonTestHost, {
      value: {
        lesson,
        seed: '0123456789abcdef0123456789abcdef',
        onComplete: () => {},
      },
      content: Content,
    });
    const html = mounted.container.innerHTML;
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
    const guide = readingGuides[lesson.id];
    expect(
      mounted.container.querySelector('.reading-check')?.textContent,
    ).toContain(guide.question);
    const explanation = mounted.container.querySelector(
      '.reading-check details',
    );
    expect(explanation?.textContent).toContain(guide.answer);
    expect(explanation?.hasAttribute('open')).toBe(false);
    expect(
      mounted.container.querySelectorAll('[data-part="idea"] h3').length,
    ).toBeGreaterThanOrEqual(5);
    expect(
      readFileSync(new URL(path, import.meta.url), 'utf8').replace(
        /<script>[\s\S]*?<\/script>/,
        '',
      ),
    ).not.toMatch(
      /\b\d+(?:\.\d+)?\s*(?:%|percent\b)|\b\d+\s*\/\s*\d+\b|[¼½¾⅓⅔⅕⅖⅗⅘]/i,
    );
    cleanup();
  }
});

it('keeps reading prerequisites reachable and earlier in the course, with no uncomputed probability literals', () => {
  expect(Object.keys(readingGuides).sort()).toEqual(
    lessons.map((lesson) => lesson.id).sort(),
  );
  for (const [index, lesson] of lessons.entries()) {
    const guide = readingGuides[lesson.id];
    for (const prerequisite of guide.prerequisites) {
      const prerequisiteIndex = lessons.findIndex(
        (item) => item.id === prerequisite,
      );
      expect(
        prerequisiteIndex,
        `${lesson.id} needs ${prerequisite}`,
      ).toBeGreaterThanOrEqual(0);
      expect(prerequisiteIndex).toBeLessThan(index);
    }
    for (const text of [
      guide.introduction,
      guide.takeaway,
      guide.mistake,
      guide.question,
      guide.answer,
    ]) {
      expect(text).not.toMatch(
        /\b\d+(?:\.\d+)?\s*(?:%|percent\b)|\b\d+\s*\/\s*\d+\b|[¼½¾⅓⅔⅕⅖⅗⅘]/i,
      );
    }
  }
});
