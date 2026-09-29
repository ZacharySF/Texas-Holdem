import {
  Application,
  Assets,
  Container,
  EventsTicker,
  Graphics,
  NoiseFilter,
  Rectangle,
  RenderTexture,
  Sprite,
  type Texture,
} from 'pixi.js';
import { CRTFilter } from 'pixi-filters/crt';
import { AdvancedBloomFilter } from 'pixi-filters/advanced-bloom';
import { RGBSplitFilter } from 'pixi-filters/rgb-split';
import { MotionBlurFilter } from 'pixi-filters/motion-blur';
import { Rng } from '../engine/rng';
import { visualConfig, paletteForTheme } from './config';
const { filters: f, performance: budget, motion } = visualConfig;
type Deal = {
  sprite: Sprite;
  x: number;
  y: number;
  started: number;
  blur: MotionBlurFilter | null;
};
/** Purely a view: reads visible card elements; never receives opponents' hidden faces. */
export async function mountPokerScene(
  host: HTMLElement,
  table: HTMLElement,
  signal: AbortSignal,
) {
  const app = new Application();
  await app.init({
    width: table.clientWidth,
    height: table.clientHeight,
    backgroundAlpha: 0,
    antialias: false,
    resolution: Math.min(devicePixelRatio || 1, budget.maxResolution),
    autoDensity: true,
    preference: 'webgl',
    autoStart: false,
    powerPreference: 'low-power',
  });
  if (signal.aborted) {
    app.destroy(true, { children: true });
    return () => {};
  }
  host.appendChild(app.canvas);
  app.canvas.setAttribute('aria-hidden', 'true');
  // Input belongs to semantic HTML, so Pixi needs no interaction polling loop.
  app.stage.eventMode = 'none';
  EventsTicker.removeTickerListener();
  app.ticker.maxFPS = budget.maxFPS;
  const lights = new Container({ label: 'background lights' });
  const surface = new Container({ label: 'table surface' });
  const cards = new Container({ label: 'cards and chips' });
  app.stage.addChild(surface, lights, cards);
  const lightPaint = new Graphics();
  const surfaceContent = new Container();
  const paint = surfaceContent.addChild(new Graphics());
  const grain = surfaceContent.addChild(new Graphics());
  grain.alpha = f.noiseOpacity;
  grain.blendMode = 'screen';
  const chips = cards.addChild(new Graphics());
  // Bake static effects when geometry changes; parallax/flicker reuse textures.
  const surfaceImage = surface.addChild(new Sprite());
  const lightImage = lights.addChild(new Sprite());
  const staticTextures: RenderTexture[] = [];
  function bake() {
    const width = table.clientWidth,
      height = table.clientHeight;
    for (const [index, container] of [surfaceContent, lightPaint].entries()) {
      const texture = (staticTextures[index] ??= RenderTexture.create({
        width,
        height,
        resolution: app.renderer.resolution,
        antialias: false,
      }));
      if (texture.width !== width || texture.height !== height)
        texture.resize(width, height);
      app.renderer.render({ container, target: texture, clear: true });
    }
    surfaceImage.texture = staticTextures[0];
    lightImage.texture = staticTextures[1];
  }
  const crt = new CRTFilter(f.crt),
    noise = new NoiseFilter(f.noise),
    rgb = new RGBSplitFilter(f.rgb),
    bloom = new AdvancedBloomFilter(f.bloom);
  let enabled = f.enabled,
    destroyed = false,
    revision = 0,
    visible = true,
    queued = false;
  let pointerX = 0,
    pointerY = 0,
    slowMs = 0,
    sampleMs = 0,
    sampleFrames = 0,
    activeMs = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)'),
    fine = matchMedia('(hover: hover) and (pointer: fine)');
  const sprites = new Map<HTMLElement, { sprite: Sprite; src: string }>();
  const deals = new Map<Sprite, Deal>();
  // Independent seeded stream for decorative flicker; it never touches the game's RNG.
  const rng = new Rng('7e097c33cd087c996cdf0096f4ca7e08');
  let nextFlicker = motion.flicker.intervalMinMs,
    flicker = 1,
    targetFlicker = 1;
  function filters() {
    // Keep card indices sharp. The texture belongs to the surface; fringe and
    // bloom belong to its tiny light sources, not every high-contrast glyph.
    // Keep filter passes on siblings. Nested filters retain stale pooled
    // targets across resize in Pixi 8.21; flat passes also use less memory.
    paint.filters = enabled ? [crt] : [];
    grain.filters = enabled ? [noise] : [];
    grain.visible = enabled;
    lightPaint.filters = enabled ? [rgb, bloom] : [];
    if (staticTextures.length) bake();
    table.dataset.filters = enabled ? 'on' : 'off';
    for (const d of deals.values()) {
      if (!enabled || reduced.matches) {
        d.sprite.filters = [];
        d.blur?.destroy();
        d.blur = null;
      }
    }
  }
  filters();
  function box(el: Element) {
    const r = el.getBoundingClientRect(),
      b = table.getBoundingClientRect();
    return {
      x: r.x - b.x - table.clientLeft,
      y: r.y - b.y - table.clientTop,
      width: r.width,
      height: r.height,
    };
  }
  function renderStatic() {
    if (!destroyed) app.render();
  }
  async function sync() {
    queued = false;
    if (destroyed) return;
    const p = paletteForTheme(document.documentElement.dataset.theme);
    const version = ++revision,
      width = table.clientWidth,
      height = table.clientHeight;
    app.renderer.resize(width, height);
    app.stage.filterArea = new Rectangle(0, 0, width, height);
    paint
      .clear()
      .rect(0, 0, width, height)
      .fill(p.ink)
      .roundRect(10, 10, width - 20, height - 20, 2)
      .fill(p.night)
      .stroke({ color: p.dusk, width: 1 });
    paint
      .moveTo(10, height * 0.5)
      .lineTo(width - 10, height * 0.5)
      .stroke({ color: p.dusk, alpha: 0.4, width: 1 });
    grain.clear().rect(0, 0, width, height).fill(p.void);
    lightPaint
      .clear()
      .rect(18, height * 0.28, 2, height * 0.2)
      .fill({ color: p.signal, alpha: 0.3 })
      .rect(width - 20, height * 0.55, 2, height * 0.18)
      .fill({ color: p.glow, alpha: 0.35 });
    chips.clear();
    for (const seat of table.querySelectorAll('.seat')) {
      const b = box(seat),
        acting = seat.classList.contains('acting');
      paint
        .roundRect(b.x, b.y, b.width, b.height, 2)
        .fill(p.ink)
        .stroke({
          color: acting ? p.ultraviolet : p.dusk,
          width: acting ? 2 : 1,
        });
      if (acting)
        lightPaint.rect(b.x, b.y, Math.min(b.width, 35), 1).fill(p.signal);
    }
    for (const slot of table.querySelectorAll('.board-slot')) {
      const b = box(slot);
      paint
        .roundRect(b.x, b.y, b.width, b.height, 2)
        .stroke({ color: p.dusk, width: 1 });
    }
    for (const bet of table.querySelectorAll('.seat-bet, .pot-chip')) {
      const b = box(bet);
      for (let i = 0; i < 3; i++)
        chips
          .circle(b.x - 12 + (i - 1) * 3, b.y + b.height / 2, 4)
          .fill(p.ink)
          .stroke({ color: i === 1 ? p.ultraviolet : p.dusk, width: 1 });
    }
    bake();
    const elements = Array.from(
      table.querySelectorAll<HTMLElement>('.playing-card'),
    );
    for (const [el, item] of sprites)
      if (!elements.includes(el)) {
        deals.get(item.sprite)?.blur?.destroy();
        deals.delete(item.sprite);
        item.sprite.destroy();
        sprites.delete(el);
      }
    await Promise.all(
      elements.map(async (el) => {
        const image = el.querySelector('img');
        if (!image) return;
        const src = image.src;
        let item = sprites.get(el);
        const changed = item?.src !== src;
        if (changed) {
          const texture = await Assets.load<Texture>(src);
          if (destroyed || version !== revision) return;
          if (item) {
            deals.get(item.sprite)?.blur?.destroy();
            deals.delete(item.sprite);
            item.sprite.destroy();
          }
          const sprite = new Sprite(texture);
          cards.addChild(sprite);
          item = { sprite, src };
          sprites.set(el, item);
        }
        if (!item) return;
        const b = box(el),
          s = item.sprite;
        s.width = b.width;
        s.height = b.height;
        if (changed && !reduced.matches) {
          const blur = enabled ? new MotionBlurFilter(f.dealBlur) : null;
          s.filters = blur ? [blur] : [];
          deals.set(s, {
            sprite: s,
            x: b.x,
            y: b.y,
            started: performance.now(),
            blur,
          });
          s.position.set(b.x - motion.deal.slidePx, b.y - motion.deal.liftPx);
        } else {
          s.position.set(b.x, b.y);
          const d = deals.get(s);
          if (d) {
            d.x = b.x;
            d.y = b.y;
          }
        }
      }),
    );
    if (destroyed || version !== revision) return;
    table.dataset.renderer = 'pixi';
    renderStatic();
    updateActivity();
  }
  function schedule() {
    if (!queued && !destroyed) {
      queued = true;
      queueMicrotask(() => void sync().catch(fallback));
    }
  }
  function fallback(error: unknown) {
    table.dataset.renderer = 'html';
    if (import.meta.env.DEV) console.warn('Poker canvas fallback:', error);
    app.stop();
    host.hidden = true;
  }
  function updateActivity() {
    if (destroyed) return;
    if (reduced.matches || !visible || document.hidden) {
      app.stop();
      pointerX = pointerY = 0;
      lights.position.set(0, 0);
      surface.position.set(0, 0);
      lights.alpha = 0.8;
      for (const d of deals.values()) {
        d.sprite.position.set(d.x, d.y);
        d.sprite.filters = [];
        d.blur?.destroy();
      }
      deals.clear();
      renderStatic();
    } else if (!app.ticker.started) {
      activeMs = sampleMs = sampleFrames = slowMs = 0;
      app.start();
    }
  }
  const themeObserver = new MutationObserver(schedule);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  const observer = new ResizeObserver(schedule);
  observer.observe(table);
  const mutation = new MutationObserver((records) => {
    if (records.some((r) => !host.contains(r.target) && r.target !== table))
      schedule();
  });
  mutation.observe(table, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'class'],
  });
  const intersection = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    updateActivity();
  });
  intersection.observe(table);
  const pointer = (e: PointerEvent) => {
    if (reduced.matches || !fine.matches || e.pointerType !== 'mouse') return;
    const b = table.getBoundingClientRect();
    pointerX = ((e.clientX - b.x) / b.width) * 2 - 1;
    pointerY = ((e.clientY - b.y) / b.height) * 2 - 1;
  };
  const leave = () => {
    pointerX = pointerY = 0;
  };
  table.addEventListener('pointermove', pointer, { passive: true });
  table.addEventListener('pointerleave', leave, { passive: true });
  reduced.addEventListener('change', updateActivity);
  fine.addEventListener('change', leave);
  document.addEventListener('visibilitychange', updateActivity);
  app.ticker.add((ticker) => {
    const dt = ticker.elapsedMS;
    activeMs += dt;
    for (const [layer, amount] of [
      [lights, motion.table.lights],
      [surface, motion.table.surface],
      [cards, motion.table.cards],
    ] as const) {
      layer.x += (-pointerX * amount - layer.x) * motion.lerp;
      layer.y += (-pointerY * amount - layer.y) * motion.lerp;
    }
    if (activeMs > nextFlicker) {
      targetFlicker = 1 + (rng.int(2001) / 1000 - 1) * motion.flicker.amount;
      nextFlicker =
        activeMs +
        motion.flicker.intervalMinMs +
        rng.int(
          motion.flicker.intervalMaxMs - motion.flicker.intervalMinMs + 1,
        );
    }
    flicker += (targetFlicker - flicker) * motion.lerp;
    lights.alpha = 0.8 * flicker;
    for (const [sprite, d] of deals) {
      const t = Math.min(
          1,
          (performance.now() - d.started) / motion.deal.durationMs,
        ),
        remaining = (1 - t) ** 3;
      sprite.position.set(
        d.x - motion.deal.slidePx * remaining,
        d.y - motion.deal.liftPx * remaining,
      );
      if (d.blur)
        d.blur.velocity = { x: f.dealBlur.velocity.x * remaining, y: 0 };
      if (t === 1) {
        sprite.filters = [];
        d.blur?.destroy();
        deals.delete(sprite);
      }
    }
    if (activeMs > budget.warmupMs) {
      sampleMs += dt;
      sampleFrames++;
      if (sampleMs >= budget.sampleWindowMs) {
        const average = sampleMs / sampleFrames;
        table.dataset.frameMs = average.toFixed(2);
        slowMs = average > budget.frameBudgetMs ? slowMs + sampleMs : 0;
        sampleMs = sampleFrames = 0;
        if (enabled && slowMs >= budget.slowDurationMs) {
          enabled = false;
          filters();
          table.dataset.filterReason = 'frame-budget';
        }
      }
    }
  });
  void sync().catch(fallback);
  return () => {
    destroyed = true;
    revision++;
    observer.disconnect();
    themeObserver.disconnect();
    mutation.disconnect();
    intersection.disconnect();
    table.removeEventListener('pointermove', pointer);
    table.removeEventListener('pointerleave', leave);
    reduced.removeEventListener('change', updateActivity);
    fine.removeEventListener('change', leave);
    document.removeEventListener('visibilitychange', updateActivity);
    for (const d of deals.values()) {
      d.sprite.filters = [];
      d.blur?.destroy();
    }
    app.stop();
    app.stage.filters = [];
    paint.filters = [];
    grain.filters = [];
    lightPaint.filters = [];
    crt.destroy();
    noise.destroy();
    rgb.destroy();
    bloom.destroy();
    app.destroy(true, { children: true });
    surfaceContent.destroy({ children: true });
    lightPaint.destroy();
    for (const texture of staticTextures) texture.destroy(true);
  };
}
