export const themes = [
  { id: 'dark', label: 'Violet' },
  { id: 'blue', label: 'Blue' },
  { id: 'grey', label: 'Grey' },
  { id: 'night', label: 'Dark' },
  { id: 'darker', label: 'Darker' },
  { id: 'green', label: 'Green' },
  { id: 'anime', label: 'Anime' },
  { id: 'amber', label: 'Amber' },
  { id: 'ocean', label: 'Ocean' },
] as const;
export type ThemeId = (typeof themes)[number]['id'];
export function isTheme(value: unknown): value is ThemeId {
  return themes.some((theme) => theme.id === value);
}
