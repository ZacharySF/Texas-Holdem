export function notebookTex(lines: readonly string[]): string {
  return `\\begin{aligned}&${lines[0]}${lines
    .slice(1)
    .map((line) => `\\\\&=${line}`)
    .join('')}\\end{aligned}`;
}
