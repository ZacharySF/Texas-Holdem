<script lang="ts">
  import { assetUrl } from '../visual/config';
  import { parallax } from '../visual/parallax';
</script>

<div
  class="home-artwork"
  aria-hidden="true"
  use:parallax={{ speed: 0.99, pointer: 3 }}
>
  <svg
    class="artwork-filter"
    width="0"
    height="0"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <filter id="lounge-transparent-ink" color-interpolation-filters="sRGB">
        <!-- Paper becomes transparent; only the original drawing carries opacity. -->
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -0.2126 -0.7152 -0.0722 0 1"
          result="tone"
        />
        <feComposite in="tone" in2="SourceAlpha" operator="in" result="ink" />
        <feFlood flood-color="var(--text)" />
        <feComposite in2="ink" operator="in" />
      </filter>
    </defs>
  </svg>
  <picture aria-hidden="true">
    <source srcset={assetUrl('art/lounge/line-art.avif')} type="image/avif" />
    <img
      src={assetUrl('art/lounge/line-art.webp')}
      width="399"
      height="501"
      alt=""
      aria-hidden="true"
    />
  </picture>
</div>
