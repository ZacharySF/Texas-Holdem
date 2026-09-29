<script lang="ts">
  import { assetUrl } from '../visual/config';
  let { compact = false }: { compact?: boolean } = $props();
</script>

<span class:compact class="photo-plate" aria-hidden="true">
  <picture>
    <source
      type="image/avif"
      srcset={`${assetUrl('art/plate-640.avif')} 640w, ${assetUrl('art/plate-1280.avif')} 1280w`}
      sizes={compact ? '64px' : '(max-width: 767px) 100vw, 320px'}
    />
    <img
      src={assetUrl('art/plate-640.webp')}
      srcset={`${assetUrl('art/plate-640.webp')} 640w, ${assetUrl('art/plate-1280.webp')} 1280w`}
      sizes={compact ? '64px' : '(max-width: 767px) 100vw, 320px'}
      width="1280"
      height="854"
      loading="lazy"
      alt=""
    />
  </picture>
  {#if !compact}<span class="plate-caption">plate 01 / violet study</span>{/if}
</span>
