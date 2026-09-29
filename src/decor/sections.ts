/** Display names only. Existing application URLs are preserved. */
export const sections = [
  { path: '/play', code: '01', name: 'play' },
  { path: '/learn', code: '02', name: 'course' },
  { path: '/arcade', code: '03', name: 'drills' },
  { path: '/lab', code: '04', name: 'tools' },
  { path: '/stats', code: '05', name: 'progress' },
] as const;
export const sectionFor = (path: string) =>
  sections.find((s) => path.startsWith(s.path)) ?? sections[0];
