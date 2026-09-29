import { useLayoutEffect, useRef } from 'react';
import { mount, unmount, type Component } from 'svelte';
import { writable } from 'svelte/store';
import ComponentHost from './ComponentHost.svelte';
/** Keep tested React controllers intact while Svelte owns their new presentation. */
export function SvelteView<P extends Record<string, unknown>>({
  component,
  props,
  className = 'svelte-view',
}: {
  component: Component<P>;
  props: P;
  className?: string;
}) {
  const target = useRef<HTMLDivElement>(null);
  const source = useRef(writable<Record<string, unknown>>(props));
  useLayoutEffect(() => {
    source.current.set(props);
  }, [props]);
  useLayoutEffect(() => {
    const app = mount(ComponentHost, {
      target: target.current!,
      props: {
        component: component as unknown as Component<Record<string, unknown>>,
        source: source.current,
      },
    });
    return () => {
      void unmount(app);
    };
  }, [component]);
  return <div className={className} ref={target} />;
}
