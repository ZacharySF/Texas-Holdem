/** Presentation-only brand spelling. */
export const SITE_NAME = 'contemporary';
export const sitePath = (path: string) =>
  `~/${SITE_NAME}/${path.replace(/^\//, '')}`;
