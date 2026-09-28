import katex from 'katex';
import { Rational } from '../../engine/math';
import { fractionTex } from '../../content/facts';
export function notebookTex(lines: readonly string[]): string {
  return `\\begin{aligned}&${lines[0]}${lines
    .slice(1)
    .map((line) => `\\\\&=${line}`)
    .join('')}\\end{aligned}`;
}
export function NotebookBlock({ lines }: { lines: readonly string[] }) {
  const html = katex.renderToString(notebookTex(lines), {
    displayMode: true,
    throwOnError: true,
    trust: false,
    output: 'htmlAndMathml',
  });
  return (
    <div
      className="notebook"
      tabIndex={0}
      role="region"
      aria-label="Worked derivation"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
export function Formula({ tex }: { tex: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, {
          throwOnError: true,
          trust: false,
          output: 'htmlAndMathml',
        }),
      }}
    />
  );
}
export function ExactValue({
  value,
  label = 'Exact probability',
}: {
  value: Rational;
  label?: string;
}) {
  const display = value.display();
  return (
    <div className="exact-value">
      <h4>{label}</h4>
      <dl>
        <div>
          <dt>Fraction</dt>
          <dd>{display.fraction}</dd>
        </div>
        <div>
          <dt>Percent</dt>
          <dd>{display.percent}</dd>
        </div>
        <div>
          <dt>One in</dt>
          <dd>{display.oneIn}</dd>
        </div>
        <div>
          <dt>Odds against</dt>
          <dd>{display.against}</dd>
        </div>
      </dl>
    </div>
  );
}
export function Count({ value }: { value: bigint | number }) {
  return <Formula tex={fractionTex(new Rational(value))} />;
}
