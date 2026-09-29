/** Hash URLs work on localhost and static GitHub Pages, with no server rewrites. */
class Navigation {
  hash = $state(
    typeof location === 'undefined'
      ? '/play'
      : location.hash.slice(1) || '/play',
  );
  get path() {
    return this.hash.split('?')[0] || '/play';
  }
  get search() {
    return this.hash.split('?').slice(1).join('?');
  }
  get params() {
    const pieces = this.path.split('/');
    return {
      lessonId: pieces[1] === 'learn' ? pieces[2] : undefined,
      drill: pieces[1] === 'arcade' ? pieces[2] : undefined,
      calculator:
        pieces[1] === 'lab' && pieces[2] === 'tools' ? pieces[3] : undefined,
    };
  }
  sync = () => {
    this.hash = location.hash.slice(1) || '/play';
  };
}
export const navigation = new Navigation();
export function navigate(path: string, replace = false) {
  if (replace) history.replaceState(null, '', '#' + path);
  else history.pushState(null, '', '#' + path);
  navigation.sync();
}
export function setParams(
  params: Record<string, string> | URLSearchParams,
  options?: { replace?: boolean },
) {
  const query = new URLSearchParams(params).toString();
  navigate(
    navigation.path + (query ? '?' + query : ''),
    options?.replace ?? false,
  );
}
