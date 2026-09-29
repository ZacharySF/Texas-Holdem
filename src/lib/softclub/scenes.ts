/** Presentation aliases only: never write the hash or import router state. */
export function sceneFor(hash: string): keyof typeof scenePresets {
  const path = hash.replace(/^#/, '').split('?')[0];
  if (/^\/(learn|course)\/.+/.test(path)) return 'study-quiet';
  if (/^\/(learn|course)/.test(path)) return 'study';
  if (/^\/(arcade|drills)/.test(path)) return 'tunnel';
  if (/^\/(lab|tools)/.test(path)) return 'skyline';
  if (/^\/(stats|progress)/.test(path)) return 'nightwindow';
  return 'terminal';
}
export type Scene = ReturnType<typeof sceneFor>;
export const scenePresets = {
  terminal: {
    light: '84% 6%',
    streaks: [
      [70, 9, 30],
      [57, 13, 22],
      [82, 19, 18],
      [0, 81, 35],
    ],
  },
  study: { light: '52% 8%', streaks: [] },
  'study-quiet': { light: '52% 8%', streaks: [] },
  tunnel: {
    light: '72% 24%',
    streaks: [
      [58, 14, 40],
      [68, 18, 32],
      [72, 23, 28],
      [0, 82, 26],
    ],
  },
  skyline: {
    light: '80% 38%',
    streaks: [
      [66, 41, 34],
      [76, 43, 22],
    ],
  },
  nightwindow: {
    light: '88% 82%',
    streaks: [
      [76, 83, 24],
      [69, 87, 30],
    ],
  },
} as const;
